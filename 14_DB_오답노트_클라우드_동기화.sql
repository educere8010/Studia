-- ════════════════════════════════════════════════════════════
--  Studia / 14. 오답노트 클라우드 동기화 — 스키마 변경
-- ════════════════════════════════════════════════════════════
--
-- 목적:
--   현재 오답노트(WrongNote)는 브라우저 localStorage 에만 저장되어
--   기기 변경/캐시 청소 시 데이터가 사라지는 문제가 있음.
--   이를 Supabase DB로 이전하여 사용자 계정과 함께 클라우드에 영속화.
--
-- 안전성:
--   - IF NOT EXISTS 사용하여 멱등성 보장 (여러 번 실행해도 안전)
--   - RLS(Row Level Security) 로 본인 데이터만 접근 가능
--   - auth.uid() 자동 주입으로 frontend 에서 user_id 직접 다룰 필요 없음
--
-- 실행 순서:
--   STEP 1 → 2 → 3 → 4 → 5 (검증)
--
-- 실행 환경:
--   Supabase SQL Editor (대시보드 → SQL Editor → + New query → 붙여넣기 → Run)
--
-- 작성일: 2026-04-25
-- ════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────
-- STEP 1. wrong_notes 테이블 생성
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wrong_notes (
    id BIGSERIAL PRIMARY KEY,

    -- 소유자 (auth.users 와 연결, 계정 삭제 시 자동 삭제)
    user_id UUID NOT NULL DEFAULT auth.uid()
        REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 과목 (현재 6개 과목만 허용)
    subject TEXT NOT NULL CHECK (
        subject IN ('math', 'english', 'korean', 'social', 'science', 'history')
    ),

    -- 문제 본문
    question TEXT NOT NULL,

    -- 학생이 적은 답
    my_answer TEXT NOT NULL DEFAULT '',

    -- 정답
    correct_answer TEXT NOT NULL DEFAULT '',

    -- AI 가 생성한 해설
    explanation TEXT NOT NULL DEFAULT '',

    -- 핵심 개념 (있을 때만)
    concept TEXT NOT NULL DEFAULT '',

    -- 객관식 옵션 배열 (없으면 NULL)
    options JSONB,

    -- 객관식 정답 인덱스 (-1 이면 객관식 아님)
    correct_idx INTEGER NOT NULL DEFAULT -1,

    -- 클라이언트 측 timestamp (Date.now()) — localStorage 마이그레이션 시 보존용
    client_timestamp BIGINT,

    -- 서버 측 생성 시각 (정렬·통계 기준)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.wrong_notes IS
    '학생의 오답노트 (구 localStorage → 클라우드 동기화). 2026-04-25 도입.';


-- ────────────────────────────────────────────────────────
-- STEP 2. 인덱스 (조회 성능)
-- ────────────────────────────────────────────────────────
-- 사용자별 + 시간 역순 조회 (오답노트 메인 화면)
CREATE INDEX IF NOT EXISTS idx_wrong_notes_user_created
    ON public.wrong_notes(user_id, created_at DESC);

-- 사용자별 + 과목 필터 (필터 버튼)
CREATE INDEX IF NOT EXISTS idx_wrong_notes_user_subject
    ON public.wrong_notes(user_id, subject);


-- ────────────────────────────────────────────────────────
-- STEP 3. RLS(Row Level Security) 활성화
-- ────────────────────────────────────────────────────────
ALTER TABLE public.wrong_notes ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────
-- STEP 4. RLS 정책 — 본인 데이터만 CRUD
-- ────────────────────────────────────────────────────────
-- (멱등성을 위해 DROP IF EXISTS → CREATE 패턴)

-- SELECT: 본인 행만 조회
DROP POLICY IF EXISTS "wrong_notes_select_own" ON public.wrong_notes;
CREATE POLICY "wrong_notes_select_own"
    ON public.wrong_notes
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: 본인 행만 추가
DROP POLICY IF EXISTS "wrong_notes_insert_own" ON public.wrong_notes;
CREATE POLICY "wrong_notes_insert_own"
    ON public.wrong_notes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: 본인 행만 수정 (현재 사용 안 하지만 향후 대비)
DROP POLICY IF EXISTS "wrong_notes_update_own" ON public.wrong_notes;
CREATE POLICY "wrong_notes_update_own"
    ON public.wrong_notes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: 본인 행만 삭제 (오답노트 비우기 등)
DROP POLICY IF EXISTS "wrong_notes_delete_own" ON public.wrong_notes;
CREATE POLICY "wrong_notes_delete_own"
    ON public.wrong_notes
    FOR DELETE
    USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────
-- STEP 5. 검증 쿼리
-- ────────────────────────────────────────────────────────
-- 아래 쿼리를 실행하여 정상 생성 확인.
-- (이미 본인이 로그인된 상태로 SQL Editor 사용 중이라
--  RLS 가 적용되어 본인 데이터만 보임 — 처음엔 0행 정상)

SELECT
    'wrong_notes 테이블 생성 완료' AS status,
    COUNT(*) AS my_row_count
FROM public.wrong_notes;

-- 테이블 컬럼 구조 확인 (참고용)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'wrong_notes'
-- ORDER BY ordinal_position;

-- RLS 정책 확인 (참고용)
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename = 'wrong_notes';


-- ════════════════════════════════════════════════════════════
--  실행 후 다음 단계:
--   1) Supabase SQL Editor 에서 위 STEP 1~5 전체 실행
--   2) STEP 5 결과가 "wrong_notes 테이블 생성 완료" / 0행 으로 나오면 OK
--   3) Frontend (app.html) 의 WrongNote 모듈 변경분 배포
--      → 로그인된 사용자가 처음 들어오면 자동으로 localStorage 데이터를
--         DB로 옮긴 후 localStorage 키 제거
-- ════════════════════════════════════════════════════════════
