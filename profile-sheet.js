// ══════════════════════════════════════════════════════════════════
//  profile-sheet.js — 스터디아 프로필 풀스크린 시트
//
//  사용법: app.html <head> 끝부분에 다음 한 줄 추가:
//    <script src="profile-sheet.js"></script>
//
//  이 파일이 하는 일:
//   1) 우측 상단 프로필 버튼(#btnProfile) 클릭 시 풀스크린 시트 표시
//   2) 기존 드롭다운 메뉴(#profileMenu)는 자동으로 비활성화
//   3) 메인 시트: STUDIA 맞춤 설정 / 구독 / 계정 / 정보 (4 섹션)
//   4) "구독 관리" 클릭 시 구독 관리 화면으로 push (뒤로 가기 지원)
//   5) 모든 데이터(이름, 이메일, 학년, 관심과목, D-N, 다음 결제일)
//      는 user_metadata 와 _subInfo 에서 자동으로 가져옴
//   6) 구독 해지는 portone-billing.js 의 기존 #menuSubscription
//      핸들러를 트리거 (코드 중복 없음)
//   7) 결제수단 변경은 portone-billing.js 의 #billingRegBtn 트리거
// ══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ──────────────────────────────────────────────
  // 1. 스타일 — <style> 태그로 동적 삽입
  // ──────────────────────────────────────────────
  var CSS = [
    '.ps-overlay{position:fixed;inset:0;z-index:9000;background:#F5F5F7;display:none;flex-direction:column;overflow:hidden;}',
    '.ps-overlay.open{display:flex;}',

    /* 스크롤 영역 */
    '.ps-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:env(safe-area-inset-top,0) 16px calc(env(safe-area-inset-bottom,0) + 32px);}',

    /* 헤더 (구독 관리 화면) */
    '.ps-nav{display:flex;align-items:center;padding:max(8px,env(safe-area-inset-top,8px)) 8px 8px;position:relative;min-height:52px;}',
    '.ps-back{width:40px;height:40px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:28px;color:#4A40E0;font-weight:300;line-height:1;padding:0;}',
    '.ps-title{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:17px;font-weight:700;color:#1F2937;letter-spacing:-0.02em;}',

    /* 닫기 (메인 시트) */
    '.ps-header{display:flex;justify-content:flex-end;padding:max(8px,env(safe-area-inset-top,8px)) 8px 12px;}',
    '.ps-close{width:32px;height:32px;border:none;background:#fff;border-radius:50%;font-size:16px;color:#1F2937;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(0,0,0,0.06);padding:0;}',

    /* 프로필 헤더 (메인) */
    '.ps-profile{text-align:center;padding:4px 0 28px;}',
    '.ps-avatar-wrap{position:relative;width:84px;height:84px;margin:0 auto 14px;}',
    '.ps-avatar{width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#4A40E0 0%,#2D2A7A 100%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700;letter-spacing:-0.02em;}',
    '.ps-name{font-size:21px;font-weight:700;color:#1F2937;letter-spacing:-0.02em;}',
    '.ps-email{font-size:13px;color:#6B7280;margin-top:4px;word-break:break-all;}',

    /* 섹션·카드·행 */
    '.ps-section-label{font-size:13px;font-weight:600;color:#8E8E93;padding:22px 16px 8px;letter-spacing:-0.01em;}',
    '.ps-card{background:#fff;border-radius:14px;overflow:hidden;margin-bottom:0;}',
    '.ps-row{display:flex;align-items:center;padding:14px 16px;cursor:pointer;border-bottom:1px solid #F1F1F4;transition:background 0.15s;font-family:inherit;width:100%;border:none;background:#fff;text-align:left;}',
    '.ps-row:last-child{border-bottom:none;}',
    '.ps-row:hover{background:#FAFAFB;}',
    '.ps-row:active{background:#F1F1F4;}',
    '.ps-row-icon{width:22px;margin-right:14px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#4A40E0;font-size:17px;}',
    '.ps-row-label{flex:1;font-size:15px;color:#1F2937;font-weight:500;letter-spacing:-0.01em;}',
    '.ps-row-value{font-size:14px;color:#6B7280;margin-right:6px;}',
    '.ps-row-arrow{color:#C7C7CC;font-size:18px;line-height:1;margin-left:4px;}',
    '.ps-row-trial{background:linear-gradient(135deg,#F4F1FF 0%,#fff 100%);}',
    '.ps-row-trial .ps-row-value{color:#4A40E0;font-weight:700;}',
    '.ps-row-danger .ps-row-icon{color:#DC2626;}',
    '.ps-row-danger .ps-row-label{color:#DC2626;}',
    '.ps-row-email .ps-row-value{font-size:13px;color:#9CA3AF;word-break:break-all;}',
    '.ps-row-sub{font-size:12px;color:#6B7280;margin-top:2px;font-weight:400;}',
    '.ps-row-label-wrap{flex:1;display:flex;flex-direction:column;}',

    /* 구독 관리 — 플랜 카드 */
    '.ps-plan-card{background:linear-gradient(135deg,#4A40E0 0%,#2D2A7A 100%);color:#fff;border-radius:18px;padding:24px 22px;margin:16px 0 24px;position:relative;overflow:hidden;}',
    '.ps-plan-card::after{content:"🎁";position:absolute;top:18px;right:22px;font-size:34px;opacity:0.4;}',
    '.ps-plan-badge{display:inline-block;background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:10px;letter-spacing:0.04em;}',
    '.ps-plan-name{font-size:22px;font-weight:700;margin-bottom:4px;letter-spacing:-0.02em;}',
    '.ps-plan-sub{font-size:13px;opacity:0.85;margin-bottom:18px;}',
    '.ps-plan-divider{height:1px;background:rgba(255,255,255,0.18);margin:14px 0;}',
    '.ps-plan-info-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:14px;}',
    '.ps-plan-info-label{opacity:0.8;}',
    '.ps-plan-info-value{font-weight:600;}',

    /* 구독 해지 버튼 */
    '.ps-cancel-section{margin-top:24px;}',
    '.ps-cancel-btn{width:100%;background:#fff;border:none;padding:16px;border-radius:14px;color:#DC2626;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.15s;font-family:inherit;}',
    '.ps-cancel-btn:hover{background:#FEF2F2;}',
    '.ps-cancel-btn:active{background:#FEE2E2;}',
    '.ps-cancel-hint{text-align:center;font-size:12px;color:#9CA3AF;margin-top:10px;line-height:1.6;}',

    /* 화면 전환 (push) */
    '.ps-screen{position:absolute;inset:0;background:#F5F5F7;display:flex;flex-direction:column;transition:transform 0.28s cubic-bezier(0.2,0.8,0.2,1);}',
    '.ps-screen.is-sub{transform:translateX(100%);}',
    '.ps-screen.is-sub.open{transform:translateX(0);}',
    '.ps-main.pushed{transform:translateX(-30%);opacity:0.7;}'
  ].join('');

  function injectCSS() {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ──────────────────────────────────────────────
  // 2. 데이터 헬퍼
  // ──────────────────────────────────────────────
  function getUserMeta() {
    try {
      if (window.Studia && window.Studia.sb) {
        // 동기 캐시가 있으면 그걸로
        var cache = window._psUserCache;
        if (cache) return cache;
      }
    } catch (e) {}
    return {};
  }

  function getInitials(name, email) {
    if (name && name.trim()) {
      var parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.trim().substring(0, 2).toUpperCase();
    }
    if (email) {
      var local = email.split('@')[0];
      return local.substring(0, 2).toUpperCase();
    }
    return 'S';
  }

  function fmtKoreanDate(iso) {
    try {
      if (typeof fmtKoreanDate !== 'undefined' && fmtKoreanDate !== arguments.callee) {
        return window.fmtKoreanDate(iso);
      }
    } catch (e) {}
    if (!iso) return '—';
    try {
      var d = new Date(iso);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    } catch (e) { return '—'; }
  }

  function calcDaysLeft(iso) {
    if (!iso) return null;
    try {
      var end = new Date(iso).getTime();
      var now = Date.now();
      var diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return diff;
    } catch (e) { return null; }
  }

  function getSubInfo() {
    try { return window._subInfo || null; } catch (e) { return null; }
  }

  function getGradeLabel(grade) {
    var map = {
      'mid1': '중1', 'mid2': '중2', 'mid3': '중3',
      'high1': '고1', 'high2': '고2', 'high3': '고3'
    };
    return grade ? (map[grade] || grade) : '미설정';
  }

  function getInterestsLabel(interests) {
    if (!interests || !interests.length) return '미설정';
    var map = {
      korean: '국어', english: '영어', math: '수학',
      social: '사회', science: '과학', history: '역사'
    };
    return interests.map(function (i) { return map[i] || i; }).join('·');
  }

  // ──────────────────────────────────────────────
  // 3. 메인 시트 HTML
  // ──────────────────────────────────────────────
  function buildMainHTML(data) {
    var name = data.name || (data.email ? data.email.split('@')[0] : 'Studia 사용자');
    var email = data.email || '';
    var initials = getInitials(data.name, data.email);
    var grade = getGradeLabel(data.grade);
    var interests = getInterestsLabel(data.interests);

    // 구독 상태 표시
    var sub = data.subInfo;
    var planRow = '';
    var nextDateRow = '';
    if (sub && sub.trial_ends_at) {
      var daysLeft = calcDaysLeft(sub.trial_ends_at);
      var planText = '';
      if (sub.state === 'subscribed') {
        planText = 'Pro 구독중';
      } else {
        planText = (daysLeft !== null && daysLeft >= 0)
          ? '무료체험 D-' + daysLeft
          : '무료체험 만료';
      }
      planRow =
        '<button class="ps-row ps-row-trial" data-act="subscription">' +
          '<div class="ps-row-icon">🎁</div>' +
          '<div class="ps-row-label">현재 플랜</div>' +
          '<div class="ps-row-value">' + escapeHtml(planText) + '</div>' +
          '<div class="ps-row-arrow">›</div>' +
        '</button>';
      nextDateRow =
        '<button class="ps-row" data-act="subscription">' +
          '<div class="ps-row-icon">📅</div>' +
          '<div class="ps-row-label">다음 결제일</div>' +
          '<div class="ps-row-value">' + escapeHtml(fmtKoreanDate(sub.trial_ends_at)) + '</div>' +
          '<div class="ps-row-arrow">›</div>' +
        '</button>';
    } else {
      planRow =
        '<button class="ps-row" data-act="subscription">' +
          '<div class="ps-row-icon">💳</div>' +
          '<div class="ps-row-label">결제수단 등록하기</div>' +
          '<div class="ps-row-arrow">›</div>' +
        '</button>';
    }

    return [
      '<div class="ps-header">',
        '<button class="ps-close" data-act="close" aria-label="닫기">✕</button>',
      '</div>',

      '<div class="ps-profile">',
        '<div class="ps-avatar-wrap"><div class="ps-avatar">' + escapeHtml(initials) + '</div></div>',
        '<div class="ps-name">' + escapeHtml(name) + '</div>',
        email ? '<div class="ps-email">' + escapeHtml(email) + '</div>' : '',
      '</div>',

      '<div class="ps-section-label">STUDIA 맞춤 설정</div>',
      '<div class="ps-card">',
        '<button class="ps-row" data-act="onboarding">',
          '<div class="ps-row-icon">🎓</div>',
          '<div class="ps-row-label">학년</div>',
          '<div class="ps-row-value">' + escapeHtml(grade) + '</div>',
          '<div class="ps-row-arrow">›</div>',
        '</button>',
        '<button class="ps-row" data-act="onboarding">',
          '<div class="ps-row-icon">📚</div>',
          '<div class="ps-row-label">관심 과목</div>',
          '<div class="ps-row-value">' + escapeHtml(interests) + '</div>',
          '<div class="ps-row-arrow">›</div>',
        '</button>',
        '<button class="ps-row" data-act="onboarding">',
          '<div class="ps-row-icon">✨</div>',
          '<div class="ps-row-label">온보딩 다시 보기</div>',
          '<div class="ps-row-arrow">›</div>',
        '</button>',
      '</div>',

      '<div class="ps-section-label">구독</div>',
      '<div class="ps-card">',
        planRow,
        nextDateRow,
        '<button class="ps-row" data-act="subscription">',
          '<div class="ps-row-icon">💳</div>',
          '<div class="ps-row-label">구독 관리</div>',
          '<div class="ps-row-arrow">›</div>',
        '</button>',
      '</div>',

      '<div class="ps-section-label">계정</div>',
      '<div class="ps-card">',
        '<div class="ps-row ps-row-email">',
          '<div class="ps-row-icon">✉</div>',
          '<div class="ps-row-label">이메일</div>',
          '<div class="ps-row-value">' + escapeHtml(email) + '</div>',
        '</div>',
        '<button class="ps-row ps-row-danger" data-act="logout">',
          '<div class="ps-row-icon">⎋</div>',
          '<div class="ps-row-label">로그아웃</div>',
        '</button>',
      '</div>',

      '<div class="ps-section-label">정보</div>',
      '<div class="ps-card">',
        '<button class="ps-row" data-act="terms">',
          '<div class="ps-row-icon">📄</div>',
          '<div class="ps-row-label">이용약관</div>',
          '<div class="ps-row-arrow">›</div>',
        '</button>',
        '<button class="ps-row" data-act="privacy">',
          '<div class="ps-row-icon">🔒</div>',
          '<div class="ps-row-label">개인정보 처리방침</div>',
          '<div class="ps-row-arrow">›</div>',
        '</button>',
        '<button class="ps-row" data-act="contact">',
          '<div class="ps-row-icon">✉</div>',
          '<div class="ps-row-label">문의하기</div>',
          '<div class="ps-row-arrow">›</div>',
        '</button>',
      '</div>'
    ].join('');
  }

  // ──────────────────────────────────────────────
  // 4. 구독 관리 화면 HTML
  // ──────────────────────────────────────────────
  function buildSubHTML(data) {
    var sub = data.subInfo;
    var hasSub = sub && sub.trial_ends_at;
    var daysLeft = hasSub ? calcDaysLeft(sub.trial_ends_at) : null;

    var planName = hasSub
      ? (sub.state === 'subscribed' ? 'Pro 구독중' : '무료체험')
      : '결제수단 미등록';

    var planSubText = '';
    if (hasSub) {
      if (sub.state === 'subscribed') planSubText = '월 18,900원 정기결제';
      else if (daysLeft !== null && daysLeft >= 0) planSubText = '7일 무료체험 중 · D-' + daysLeft;
      else planSubText = '체험 기간 종료';
    } else {
      planSubText = '결제수단을 등록하면 7일간 무료로 이용할 수 있어요';
    }

    var planInfo = hasSub
      ? [
          '<div class="ps-plan-divider"></div>',
          '<div class="ps-plan-info-row"><span class="ps-plan-info-label">' + (sub.state === 'subscribed' ? '다음 결제일' : '자동결제 예정일') + '</span><span class="ps-plan-info-value">' + escapeHtml(fmtKoreanDate(sub.trial_ends_at)) + '</span></div>',
          '<div class="ps-plan-info-row"><span class="ps-plan-info-label">결제 금액</span><span class="ps-plan-info-value">월 18,900원</span></div>'
        ].join('')
      : '';

    var paymentSection = hasSub
      ? [
          '<div class="ps-section-label">결제수단</div>',
          '<div class="ps-card">',
            '<button class="ps-row" data-act="change-payment">',
              '<div class="ps-row-icon">🔄</div>',
              '<div class="ps-row-label-wrap">',
                '<div class="ps-row-label">결제수단 변경</div>',
                '<div class="ps-row-sub">PortOne 으로 안전하게 처리됩니다</div>',
              '</div>',
              '<div class="ps-row-arrow">›</div>',
            '</button>',
          '</div>'
        ].join('')
      : [
          '<div class="ps-section-label">결제수단</div>',
          '<div class="ps-card">',
            '<button class="ps-row" data-act="register-payment">',
              '<div class="ps-row-icon">💳</div>',
              '<div class="ps-row-label-wrap">',
                '<div class="ps-row-label">결제수단 등록하기</div>',
                '<div class="ps-row-sub">카카오페이 또는 신용·체크카드</div>',
              '</div>',
              '<div class="ps-row-arrow">›</div>',
            '</button>',
          '</div>'
        ].join('');

    var cancelSection = hasSub
      ? [
          '<div class="ps-cancel-section">',
            '<button class="ps-cancel-btn" data-act="cancel">구독 해지하기</button>',
            '<div class="ps-cancel-hint">',
              '해지해도 남은 ' + (sub.state === 'subscribed' ? '구독' : '체험') + ' 기간' +
              (daysLeft !== null && daysLeft >= 0 ? '(D-' + daysLeft + ')' : '') +
              ' 동안은<br>계속 이용할 수 있어요',
            '</div>',
          '</div>'
        ].join('')
      : '';

    return [
      '<div class="ps-nav">',
        '<button class="ps-back" data-act="back" aria-label="뒤로">‹</button>',
        '<div class="ps-title">구독 관리</div>',
      '</div>',

      '<div class="ps-plan-card">',
        '<span class="ps-plan-badge">현재 플랜</span>',
        '<div class="ps-plan-name">' + escapeHtml(planName) + '</div>',
        '<div class="ps-plan-sub">' + escapeHtml(planSubText) + '</div>',
        planInfo,
      '</div>',

      paymentSection,

      cancelSection
    ].join('');
  }

  // ──────────────────────────────────────────────
  // 5. 보조 — HTML escape
  // ──────────────────────────────────────────────
  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ──────────────────────────────────────────────
  // 6. 시트 생성 / 열기 / 닫기 / 푸시
  // ──────────────────────────────────────────────
  var sheet = null;     // 오버레이 루트
  var mainEl = null;    // 메인 스크린
  var subEl = null;     // 구독 관리 스크린

  function ensureSheet() {
    if (sheet) return;
    sheet = document.createElement('div');
    sheet.className = 'ps-overlay';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.innerHTML =
      '<div class="ps-screen ps-main"><div class="ps-scroll" id="psMainScroll"></div></div>' +
      '<div class="ps-screen ps-sub"><div class="ps-scroll" id="psSubScroll"></div></div>';
    document.body.appendChild(sheet);
    mainEl = sheet.querySelector('.ps-main');
    subEl = sheet.querySelector('.ps-sub');

    // 클릭 위임
    sheet.addEventListener('click', onSheetClick);
    // ESC 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.classList.contains('open')) {
        if (subEl.classList.contains('open')) popSub();
        else closeSheet();
      }
    });
  }

  function collectData() {
    var email = '';
    var meta = {};
    try {
      var sb = (window.Studia && window.Studia.sb) || null;
      if (sb) {
        // 캐시된 user 가 있으면 사용; 없으면 비동기로 채우고 일단 빈 값
        if (window._psUserCache) {
          email = window._psUserCache.email || '';
          meta = window._psUserCache.user_metadata || {};
        }
      }
    } catch (e) {}
    return {
      email: email,
      name: meta.name || meta.full_name || '',
      grade: meta.grade || '',
      interests: meta.interests || [],
      subInfo: getSubInfo()
    };
  }

  function refreshMain() {
    var data = collectData();
    document.getElementById('psMainScroll').innerHTML = buildMainHTML(data);
  }
  function refreshSub() {
    var data = collectData();
    document.getElementById('psSubScroll').innerHTML = buildSubHTML(data);
  }

  function openSheet() {
    ensureSheet();
    // 데이터 미리 캐시
    cacheUserAsync().then(function () {
      refreshMain();
      subEl.classList.remove('open');
      mainEl.classList.remove('pushed');
      sheet.classList.add('open');
      try { document.body.style.overflow = 'hidden'; } catch (e) {}
    });
  }

  function closeSheet() {
    if (!sheet) return;
    sheet.classList.remove('open');
    try { document.body.style.overflow = ''; } catch (e) {}
  }

  function pushSub() {
    refreshSub();
    subEl.classList.add('open');
    mainEl.classList.add('pushed');
  }
  function popSub() {
    subEl.classList.remove('open');
    mainEl.classList.remove('pushed');
  }

  // ──────────────────────────────────────────────
  // 7. 행 클릭 라우팅
  // ──────────────────────────────────────────────
  function onSheetClick(e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) {
      // 배경 클릭 (메인 스크롤 영역 바깥) — 닫지 않음 (실수 방지)
      return;
    }
    var act = btn.getAttribute('data-act');

    switch (act) {
      case 'close':
        closeSheet();
        break;
      case 'back':
        popSub();
        break;
      case 'subscription':
        pushSub();
        break;
      case 'onboarding':
        closeSheet();
        try {
          if (typeof Onboarding !== 'undefined' && Onboarding.open) Onboarding.open('redo');
        } catch (err) { console.warn('[profile-sheet] Onboarding.open 실패', err); }
        break;
      case 'logout':
        // 기존 로그아웃 버튼 트리거
        closeSheet();
        clickHidden('menuLogout');
        break;
      case 'terms':
        // 기존 약관 모달 트리거
        try {
          if (typeof openModal === 'function') openModal('modalTerms');
          else {
            var m = document.getElementById('modalTerms');
            if (m) m.classList.add('open');
          }
        } catch (err) {}
        break;
      case 'privacy':
        try {
          if (typeof openModal === 'function') openModal('modalPrivacy');
          else {
            var p = document.getElementById('modalPrivacy');
            if (p) p.classList.add('open');
          }
        } catch (err) {}
        break;
      case 'contact':
        window.location.href = 'mailto:hkbyoo@studia.co.kr';
        break;
      case 'cancel':
        // 구독 해지 → portone-billing.js 의 기존 #menuSubscription 핸들러 트리거
        // (portone-billing.js 안에서 자체적으로 confirm + 해지 API 호출하므로
        //  여기서는 중복 confirm 없이 클릭만 위임)
        clickHidden('menuSubscription');
        setTimeout(function () { closeSheet(); }, 200);
        break;
      case 'change-payment':
      case 'register-payment':
        // portone-billing.js 의 #billingRegBtn 트리거
        closeSheet();
        setTimeout(function () {
          var rb = document.getElementById('billingRegBtn');
          if (rb) rb.click();
          else if (typeof showScreen === 'function') showScreen('screenBilling');
        }, 100);
        break;
    }
  }

  function clickHidden(id) {
    var el = document.getElementById(id);
    if (el) {
      try { el.click(); } catch (e) {}
    }
  }

  // ──────────────────────────────────────────────
  // 8. 캐시된 user 비동기 로드
  // ──────────────────────────────────────────────
  function cacheUserAsync() {
    return new Promise(function (resolve) {
      try {
        var sb = (window.Studia && window.Studia.sb) || null;
        if (!sb) return resolve();
        sb.auth.getUser().then(function (res) {
          if (res && res.data && res.data.user) {
            window._psUserCache = res.data.user;
          }
          resolve();
        }).catch(function () { resolve(); });
      } catch (e) { resolve(); }
    });
  }

  // ──────────────────────────────────────────────
  // 9. 기존 드롭다운 메뉴 가로채기
  // ──────────────────────────────────────────────
  function interceptProfileButton() {
    var btn = document.getElementById('btnProfile');
    if (!btn) return false;

    // 기존 클릭 핸들러를 막기 위해 캡처 단계에서 가로채기
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      // 기존 드롭다운이 혹시 보이면 강제로 숨기기
      var oldMenu = document.getElementById('profileMenu');
      if (oldMenu) {
        oldMenu.hidden = true;
        oldMenu.style.display = 'none';
      }
      openSheet();
    }, true);

    return true;
  }

  function hideOldMenuPermanently() {
    var menu = document.getElementById('profileMenu');
    if (!menu) return;
    // 인라인 style 로 강제 숨김 — 기존 코드가 hidden 속성을 토글해도 안 보이게
    menu.style.display = 'none';
  }

  // ──────────────────────────────────────────────
  // 10. 초기화
  // ──────────────────────────────────────────────
  function init() {
    injectCSS();
    // btnProfile 이 늦게 생성될 수 있으므로 재시도
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var ok = interceptProfileButton();
      if (ok) hideOldMenuPermanently();
      if (ok || tries >= 30) clearInterval(iv); // 최대 3초
    }, 100);

    // 사용자 캐시 미리 받기
    setTimeout(cacheUserAsync, 1000);

    console.log('[profile-sheet] 초기화 완료');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
