-- ══════════════════════════════════════════════════════════════════
--  스터디아 Phase 1 ― "결제수단 먼저" 플로우 DB 변경
--  실행 순서: Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run
--
--  이 SQL이 하는 일 요약:
--   1) profiles 테이블에 billing_registered_at 컬럼 추가
--   2) 기존 가입자 3명은 "이미 결제수단 등록한 것"으로 간주 (그랜드파더)
--   3) 새 가입자는 trial_ends_at 이 NULL 로 생성됨 (결제수단 등록 전엔 체험 미개시)
--   4) get_subscription_status() 가 'needs_payment_method' 상태를 반환하도록 확장
--   5) activate_trial_with_billing() RPC 추가 — 카드 등록 시 호출되어 7일 체험 개시
--   6) cancel_subscription() RPC 추가 — 프로필 메뉴의 "해지하기" 버튼에서 호출
-- ══════════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────
-- STEP 1. profiles 테이블에 billing_registered_at 추가
--   NULL = 아직 결제수단 미등록
--   NOT NULL = 등록 완료 시점 (이 시점부터 7일 체험 카운트)
-- ──────────────────────────────────────────────
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS billing_registered_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.billing_registered_at
    IS '결제수단(카드) 등록 완료 시점. NULL이면 아직 미등록 → 체험 미개시.';


-- ──────────────────────────────────────────────
-- STEP 2. 기존 가입자 그랜드파더 처리
--   billing_registered_at 이 NULL 인 기존 유저는 created_at 으로 채워서
--   "이미 결제수단 등록을 마친 것처럼" 간주한다.
--   (현재 3명뿐이라 자연스럽게 이월 가능)
-- ──────────────────────────────────────────────
UPDATE public.profiles
    SET billing_registered_at = created_at
    WHERE billing_registered_at IS NULL;


-- ──────────────────────────────────────────────
-- STEP 3. handle_new_user() 트리거 교체
--   변경점: trial_ends_at 을 자동으로 찍지 않는다 (NULL 로 생성).
--           trial_started_at / billing_registered_at 둘 다 NULL.
--           카드 등록이 완료되어야 activate_trial_with_billing() 에서 채워짐.
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        display_name,
        signup_source,
        trial_started_at,
        trial_ends_at,
        billing_registered_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
        NULL,   -- 체험 미개시
        NULL,   -- 체험 미개시
        NULL    -- 결제수단 미등록
    );
    RETURN NEW;
END;
$$;

-- 트리거 자체는 02_DB_스키마.sql 에서 이미 붙어있음.
-- 함수만 교체하면 됨.


-- ──────────────────────────────────────────────
-- STEP 4. get_subscription_status() 확장
--   새 상태값: 'needs_payment_method'
--   판단 순서:
--     (1) profiles 없음                       → no_profile (기존과 동일)
--     (2) billing_registered_at IS NULL        → needs_payment_method  ← NEW
--     (3) 활성 유료 구독 있음                   → subscribed
--     (4) trial_ends_at 미래                   → trial_active
--     (5) 그 외                                → trial_expired
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_subscription_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile RECORD;
    v_sub RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_trial_active BOOLEAN := FALSE;
    v_sub_active BOOLEAN := FALSE;
    v_state TEXT;
BEGIN
    -- 1) 프로필 조회
    SELECT id, trial_ends_at, billing_registered_at
        INTO v_profile
        FROM public.profiles
        WHERE id = p_user_id
        LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'eligible', FALSE,
            'state', 'no_profile',
            'trial_ends_at', NULL,
            'billing_registered_at', NULL,
            'plan', 'none'
        );
    END IF;

    -- 2) 결제수단 미등록 → 즉시 needs_payment_method 반환
    IF v_profile.billing_registered_at IS NULL THEN
        RETURN jsonb_build_object(
            'eligible', FALSE,
            'state', 'needs_payment_method',
            'trial_ends_at', NULL,
            'billing_registered_at', NULL,
            'plan', 'none'
        );
    END IF;

    -- 3) 체험 기간 유효 여부
    IF v_profile.trial_ends_at IS NOT NULL AND v_profile.trial_ends_at > v_now THEN
        v_trial_active := TRUE;
    END IF;

    -- 4) 활성 유료 구독 조회
    SELECT plan, status, period_end INTO v_sub
        FROM public.subscriptions
        WHERE user_id = p_user_id
          AND status = 'active'
          AND plan <> 'trial'
          AND (period_end IS NULL OR period_end > v_now)
        ORDER BY created_at DESC
        LIMIT 1;

    IF FOUND THEN
        v_sub_active := TRUE;
    END IF;

    -- 5) 상태 문자열 결정
    IF v_sub_active THEN
        v_state := 'subscribed';
    ELSIF v_trial_active THEN
        v_state := 'trial_active';
    ELSE
        v_state := 'trial_expired';
    END IF;

    RETURN jsonb_build_object(
        'eligible', (v_trial_active OR v_sub_active),
        'state', v_state,
        'trial_ends_at', v_profile.trial_ends_at,
        'billing_registered_at', v_profile.billing_registered_at,
        'plan', COALESCE(v_sub.plan, CASE WHEN v_trial_active THEN 'trial' ELSE 'none' END)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_subscription_status(UUID)
    TO authenticated, service_role;


-- ──────────────────────────────────────────────
-- STEP 5. activate_trial_with_billing()
--   카드(빌링키) 등록이 성공한 직후 호출한다.
--   동작:
--     - profiles.billing_registered_at = NOW()
--     - profiles.trial_started_at     = NOW()
--     - profiles.trial_ends_at        = NOW() + 7 days
--     - profiles.has_used_trial       = TRUE
--     - subscriptions 에 plan='trial', status='active', 빌링키/고객키 저장
--   재호출 안전장치:
--     - billing_registered_at 이 이미 채워져 있으면 아무것도 하지 않고 현재 상태를 반환
--       (사용자가 실수로 카드등록 화면을 두 번 타더라도 체험기간이 리셋되지 않도록)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.activate_trial_with_billing(
    p_user_id       UUID,
    p_billing_key   TEXT,
    p_customer_key  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_trial_end TIMESTAMPTZ;
BEGIN
    -- 프로필 잠금 조회 (동시 호출 방지)
    SELECT id, billing_registered_at
        INTO v_profile
        FROM public.profiles
        WHERE id = p_user_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'profile_not_found';
    END IF;

    -- 이미 등록된 경우엔 재설정 없이 현재 상태 반환
    IF v_profile.billing_registered_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'already_registered', TRUE,
            'billing_registered_at', v_profile.billing_registered_at
        );
    END IF;

    v_trial_end := v_now + INTERVAL '7 days';

    -- profiles 업데이트
    UPDATE public.profiles
        SET billing_registered_at = v_now,
            trial_started_at      = v_now,
            trial_ends_at         = v_trial_end,
            has_used_trial        = TRUE,
            updated_at            = v_now
        WHERE id = p_user_id;

    -- subscriptions 레코드 생성 (plan='trial')
    INSERT INTO public.subscriptions (
        user_id,
        plan,
        status,
        period_start,
        period_end,
        toss_billing_key,
        toss_customer_key
    )
    VALUES (
        p_user_id,
        'trial',
        'active',
        v_now,
        v_trial_end,
        p_billing_key,
        p_customer_key
    );

    RETURN jsonb_build_object(
        'already_registered', FALSE,
        'billing_registered_at', v_now,
        'trial_ends_at', v_trial_end
    );
END;
$$;

-- 빌링키는 민감정보라 service_role 에서만 호출 가능하도록 제한.
-- (Edge Function 또는 결제 웹훅에서 호출할 것)
GRANT EXECUTE ON FUNCTION public.activate_trial_with_billing(UUID, TEXT, TEXT)
    TO service_role;


-- ──────────────────────────────────────────────
-- STEP 6. cancel_subscription()
--   프로필 메뉴의 "해지하기" 버튼에서 호출.
--   동작:
--     - 해당 유저의 active 구독 중 가장 최근 것을 골라
--       cancel_at_period_end = TRUE, cancelled_at = NOW() 로 마킹.
--     - status 는 'active' 유지 (남은 체험 기간 동안은 계속 이용 가능).
--     - period_end 가 지나면 Edge Function 또는 스케줄러가 status='cancelled' 로 전환.
--   주의:
--     - 버튼 비활성화 로직은 클라이언트(app.html)에서 이미 수행 (5일차 미만은 눌러도 안됨).
--     - 여기선 단순 처리만 하고, 해지창이 아닌 날 호출되어도 그대로 기록한다.
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_subscription(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sub RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 본인 요청인지 확인 (service_role 키는 auth.uid()가 NULL 이므로 우회 가능)
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'not_authorized';
    END IF;

    SELECT id, plan, period_end, cancel_at_period_end
        INTO v_sub
        FROM public.subscriptions
        WHERE user_id = p_user_id
          AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'reason', 'no_active_subscription'
        );
    END IF;

    IF v_sub.cancel_at_period_end THEN
        RETURN jsonb_build_object(
            'ok', TRUE,
            'already_cancelled', TRUE,
            'period_end', v_sub.period_end
        );
    END IF;

    UPDATE public.subscriptions
        SET cancel_at_period_end = TRUE,
            cancelled_at         = v_now,
            updated_at           = v_now
        WHERE id = v_sub.id;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'already_cancelled', FALSE,
        'period_end', v_sub.period_end
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_subscription(UUID)
    TO authenticated, service_role;


-- ══════════════════════════════════════════════════════════════════
--  완료!
--  검증 쿼리 (선택 사항 — 실행해보고 싶으면):
--
--    -- 컬럼이 추가됐는지
--    SELECT column_name FROM information_schema.columns
--     WHERE table_name='profiles' AND column_name='billing_registered_at';
--
--    -- 기존 3명이 그랜드파더됐는지
--    SELECT id, email, billing_registered_at FROM public.profiles;
--
--    -- 함수 3개가 등록됐는지
--    SELECT proname FROM pg_proc
--     WHERE proname IN (
--       'get_subscription_status',
--       'activate_trial_with_billing',
--       'cancel_subscription'
--     );
-- ══════════════════════════════════════════════════════════════════
