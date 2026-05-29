// ══════════════════════════════════════════════════════════════════
//  profile-sheet.js — 스터디아 프로필 풀스크린 시트 (v2 안전판)
//
//  사용법: app.html <head> 끝부분에 한 줄 추가:
//    <script src="profile-sheet.js"></script>
//
//  v2 변경:
//   - 'use strict' 제거 (호환성 우선)
//   - arguments.callee 등 위험 구문 제거
//   - 함수명에 ps_ 또는 _PS prefix (기존 코드와 이름 충돌 방지)
//   - IIFE 전체를 try-catch 로 감싸서 어떤 에러가 나도 다른 코드 실행 안 막음
//   - 각 핸들러도 try-catch 로 보호
// ══════════════════════════════════════════════════════════════════

(function () {
  try {

    // ──────────────────────────────────────────────
    // 1. CSS (style 태그로 동적 삽입)
    // ──────────────────────────────────────────────
    var PS_CSS = [
      '.ps-overlay{position:fixed;inset:0;z-index:9000;background:#F5F5F7;display:none;flex-direction:column;overflow:hidden;}',
      '.ps-overlay.ps-open{display:flex;}',
      '.ps-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 16px 32px;}',
      '.ps-nav{display:flex;align-items:center;padding:8px;position:relative;min-height:52px;}',
      '.ps-back{width:40px;height:40px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:28px;color:#4A40E0;font-weight:300;line-height:1;padding:0;}',
      '.ps-title{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:17px;font-weight:700;color:#1F2937;letter-spacing:-0.02em;}',
      '.ps-header{display:flex;justify-content:flex-end;padding:8px 8px 12px;}',
      '.ps-close{width:32px;height:32px;border:none;background:#fff;border-radius:50%;font-size:16px;color:#1F2937;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(0,0,0,0.06);padding:0;}',
      '.ps-profile{text-align:center;padding:4px 0 28px;}',
      '.ps-avatar-wrap{position:relative;width:84px;height:84px;margin:0 auto 14px;}',
      '.ps-avatar{width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#4A40E0 0%,#2D2A7A 100%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700;letter-spacing:-0.02em;}',
      '.ps-name{font-size:21px;font-weight:700;color:#1F2937;letter-spacing:-0.02em;}',
      '.ps-email{font-size:13px;color:#6B7280;margin-top:4px;word-break:break-all;}',
      '.ps-section-label{font-size:13px;font-weight:600;color:#8E8E93;padding:22px 16px 8px;letter-spacing:-0.01em;}',
      '.ps-card{background:#fff;border-radius:14px;overflow:hidden;}',
      '.ps-row{display:flex;align-items:center;padding:14px 16px;cursor:pointer;border-bottom:1px solid #F1F1F4;font-family:inherit;width:100%;border:none;background:#fff;text-align:left;}',
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
      '.ps-plan-card{background:linear-gradient(135deg,#4A40E0 0%,#2D2A7A 100%);color:#fff;border-radius:18px;padding:24px 22px;margin:16px 0 24px;position:relative;overflow:hidden;}',
      '.ps-plan-badge{display:inline-block;background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:10px;letter-spacing:0.04em;}',
      '.ps-plan-name{font-size:22px;font-weight:700;margin-bottom:4px;letter-spacing:-0.02em;}',
      '.ps-plan-sub{font-size:13px;opacity:0.85;margin-bottom:18px;}',
      '.ps-plan-divider{height:1px;background:rgba(255,255,255,0.18);margin:14px 0;}',
      '.ps-plan-info-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:14px;}',
      '.ps-plan-info-label{opacity:0.8;}',
      '.ps-plan-info-value{font-weight:600;}',
      '.ps-cancel-section{margin-top:24px;}',
      '.ps-cancel-btn{width:100%;background:#fff;border:none;padding:16px;border-radius:14px;color:#DC2626;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;}',
      '.ps-cancel-btn:hover{background:#FEF2F2;}',
      '.ps-cancel-hint{text-align:center;font-size:12px;color:#9CA3AF;margin-top:10px;line-height:1.6;}',
      '.ps-screen{position:absolute;inset:0;background:#F5F5F7;display:flex;flex-direction:column;transition:transform 0.28s cubic-bezier(0.2,0.8,0.2,1);}',
      '.ps-sub{transform:translateX(100%);}',
      '.ps-sub.ps-open-sub{transform:translateX(0);}'
    ].join('');

    function psInjectCSS() {
      try {
        var s = document.createElement('style');
        s.id = 'ps-css';
        s.textContent = PS_CSS;
        (document.head || document.documentElement).appendChild(s);
      } catch (e) { console.warn('[profile-sheet] CSS 주입 실패', e); }
    }

    // ──────────────────────────────────────────────
    // 2. 헬퍼
    // ──────────────────────────────────────────────
    function psEscape(s) {
      if (s === null || s === undefined) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function psInitials(name, email) {
      try {
        if (name && String(name).trim()) {
          var n = String(name).trim();
          var parts = n.split(/\s+/);
          if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
          return n.substring(0, 2).toUpperCase();
        }
        if (email) {
          var local = String(email).split('@')[0];
          return local.substring(0, 2).toUpperCase();
        }
      } catch (e) {}
      return 'S';
    }

    function psFormatDate(iso) {
      if (!iso) return '—';
      try {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1);
        if (m.length < 2) m = '0' + m;
        var day = String(d.getDate());
        if (day.length < 2) day = '0' + day;
        return y + '-' + m + '-' + day;
      } catch (e) { return '—'; }
    }

    function psDaysLeft(iso) {
      if (!iso) return null;
      try {
        var end = new Date(iso).getTime();
        if (isNaN(end)) return null;
        var diff = Math.ceil((end - Date.now()) / 86400000);
        return diff;
      } catch (e) { return null; }
    }

    function psGradeLabel(g) {
      var m = { mid1: '중1', mid2: '중2', mid3: '중3', high1: '고1', high2: '고2', high3: '고3' };
      return g ? (m[g] || g) : '미설정';
    }

    function psInterestsLabel(arr) {
      if (!arr || !arr.length) return '미설정';
      var m = { korean: '국어', english: '영어', math: '수학', social: '사회', science: '과학', history: '역사' };
      try {
        return arr.map(function (i) { return m[i] || i; }).join('·');
      } catch (e) { return '미설정'; }
    }

    function psGetSubInfo() {
      try { return window._subInfo || null; } catch (e) { return null; }
    }

    // ──────────────────────────────────────────────
    // 3. 데이터 수집 (window 캐시 활용)
    // ──────────────────────────────────────────────
    function psCollectData() {
      var email = '';
      var meta = {};
      try {
        if (window._psUserCache) {
          email = window._psUserCache.email || '';
          meta = window._psUserCache.user_metadata || {};
        }
      } catch (e) {}
      return {
        email: email,
        name: meta.name || meta.full_name || '',
        grade: meta.grade || '',
        interests: meta.interests || [],
        sub: psGetSubInfo()
      };
    }

    function psCacheUser() {
      try {
        var sb = (window.Studia && window.Studia.sb) || null;
        if (!sb || !sb.auth || typeof sb.auth.getUser !== 'function') return;
        sb.auth.getUser().then(function (res) {
          if (res && res.data && res.data.user) {
            window._psUserCache = res.data.user;
          }
        }).catch(function () {});
      } catch (e) {}
    }

    // ──────────────────────────────────────────────
    // 4. HTML 빌더 — 메인 시트
    // ──────────────────────────────────────────────
    function psBuildMain(data) {
      var name = data.name || (data.email ? String(data.email).split('@')[0] : 'Studia 사용자');
      var email = data.email || '';
      var initials = psInitials(data.name, data.email);
      var grade = psGradeLabel(data.grade);
      var interests = psInterestsLabel(data.interests);

      var sub = data.sub;
      var planRow = '';
      var nextDateRow = '';
      if (sub && sub.trial_ends_at) {
        var dleft = psDaysLeft(sub.trial_ends_at);
        var planText;
        if (sub.state === 'subscribed') planText = 'Pro 구독중';
        else if (dleft !== null && dleft >= 0) planText = '무료체험 D-' + dleft;
        else planText = '무료체험 만료';
        planRow =
          '<button class="ps-row ps-row-trial" data-ps-act="subscription">' +
            '<div class="ps-row-icon">🎁</div>' +
            '<div class="ps-row-label">현재 플랜</div>' +
            '<div class="ps-row-value">' + psEscape(planText) + '</div>' +
            '<div class="ps-row-arrow">›</div>' +
          '</button>';
        nextDateRow =
          '<button class="ps-row" data-ps-act="subscription">' +
            '<div class="ps-row-icon">📅</div>' +
            '<div class="ps-row-label">다음 결제일</div>' +
            '<div class="ps-row-value">' + psEscape(psFormatDate(sub.trial_ends_at)) + '</div>' +
            '<div class="ps-row-arrow">›</div>' +
          '</button>';
      } else {
        planRow =
          '<button class="ps-row" data-ps-act="subscription">' +
            '<div class="ps-row-icon">💳</div>' +
            '<div class="ps-row-label">결제수단 등록하기</div>' +
            '<div class="ps-row-arrow">›</div>' +
          '</button>';
      }

      return [
        '<div class="ps-header">',
          '<button class="ps-close" data-ps-act="close" aria-label="닫기">✕</button>',
        '</div>',
        '<div class="ps-profile">',
          '<div class="ps-avatar-wrap"><div class="ps-avatar">' + psEscape(initials) + '</div></div>',
          '<div class="ps-name">' + psEscape(name) + '</div>',
          email ? '<div class="ps-email">' + psEscape(email) + '</div>' : '',
        '</div>',
        '<div class="ps-section-label">STUDIA 맞춤 설정</div>',
        '<div class="ps-card">',
          '<button class="ps-row" data-ps-act="onboarding">',
            '<div class="ps-row-icon">🎓</div>',
            '<div class="ps-row-label">학년</div>',
            '<div class="ps-row-value">' + psEscape(grade) + '</div>',
            '<div class="ps-row-arrow">›</div>',
          '</button>',
          '<button class="ps-row" data-ps-act="onboarding">',
            '<div class="ps-row-icon">📚</div>',
            '<div class="ps-row-label">관심 과목</div>',
            '<div class="ps-row-value">' + psEscape(interests) + '</div>',
            '<div class="ps-row-arrow">›</div>',
          '</button>',
          '<button class="ps-row" data-ps-act="onboarding">',
            '<div class="ps-row-icon">✨</div>',
            '<div class="ps-row-label">온보딩 다시 보기</div>',
            '<div class="ps-row-arrow">›</div>',
          '</button>',
        '</div>',
        '<div class="ps-section-label">구독</div>',
        '<div class="ps-card">',
          planRow,
          nextDateRow,
          '<button class="ps-row" data-ps-act="subscription">',
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
            '<div class="ps-row-value">' + psEscape(email) + '</div>',
          '</div>',
          '<button class="ps-row ps-row-danger" data-ps-act="logout">',
            '<div class="ps-row-icon">⎋</div>',
            '<div class="ps-row-label">로그아웃</div>',
          '</button>',
        '</div>',
        '<div class="ps-section-label">정보</div>',
        '<div class="ps-card">',
          '<button class="ps-row" data-ps-act="terms">',
            '<div class="ps-row-icon">📄</div>',
            '<div class="ps-row-label">이용약관</div>',
            '<div class="ps-row-arrow">›</div>',
          '</button>',
          '<button class="ps-row" data-ps-act="privacy">',
            '<div class="ps-row-icon">🔒</div>',
            '<div class="ps-row-label">개인정보 처리방침</div>',
            '<div class="ps-row-arrow">›</div>',
          '</button>',
          '<button class="ps-row" data-ps-act="contact">',
            '<div class="ps-row-icon">✉</div>',
            '<div class="ps-row-label">문의하기</div>',
            '<div class="ps-row-arrow">›</div>',
          '</button>',
        '</div>'
      ].join('');
    }

    // ──────────────────────────────────────────────
    // 5. HTML 빌더 — 구독 관리 화면
    // ──────────────────────────────────────────────
    function psBuildSub(data) {
      var sub = data.sub;
      var hasSub = sub && sub.trial_ends_at;
      var dleft = hasSub ? psDaysLeft(sub.trial_ends_at) : null;

      var planName, planSubText, planInfo;
      if (hasSub) {
        planName = (sub.state === 'subscribed') ? 'Pro 구독중' : '무료체험';
        if (sub.state === 'subscribed') planSubText = '월 18,900원 정기결제';
        else if (dleft !== null && dleft >= 0) planSubText = '7일 무료체험 중 · D-' + dleft;
        else planSubText = '체험 기간 종료';
        planInfo =
          '<div class="ps-plan-divider"></div>' +
          '<div class="ps-plan-info-row"><span class="ps-plan-info-label">' +
            (sub.state === 'subscribed' ? '다음 결제일' : '자동결제 예정일') +
            '</span><span class="ps-plan-info-value">' + psEscape(psFormatDate(sub.trial_ends_at)) + '</span></div>' +
          '<div class="ps-plan-info-row"><span class="ps-plan-info-label">결제 금액</span><span class="ps-plan-info-value">월 18,900원</span></div>';
      } else {
        planName = '결제수단 미등록';
        planSubText = '결제수단을 등록하면 7일간 무료로 이용할 수 있어요';
        planInfo = '';
      }

      var paymentSection = hasSub
        ? [
            '<div class="ps-section-label">결제수단</div>',
            '<div class="ps-card">',
              '<button class="ps-row" data-ps-act="change-payment">',
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
              '<button class="ps-row" data-ps-act="register-payment">',
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
              '<button class="ps-cancel-btn" data-ps-act="cancel">구독 해지하기</button>',
              '<div class="ps-cancel-hint">해지해도 남은 ' +
                (sub.state === 'subscribed' ? '구독' : '체험') + ' 기간' +
                (dleft !== null && dleft >= 0 ? '(D-' + dleft + ')' : '') +
                ' 동안은<br>계속 이용할 수 있어요</div>',
            '</div>'
          ].join('')
        : '';

      return [
        '<div class="ps-nav">',
          '<button class="ps-back" data-ps-act="back" aria-label="뒤로">‹</button>',
          '<div class="ps-title">구독 관리</div>',
        '</div>',
        '<div class="ps-plan-card">',
          '<span class="ps-plan-badge">현재 플랜</span>',
          '<div class="ps-plan-name">' + psEscape(planName) + '</div>',
          '<div class="ps-plan-sub">' + psEscape(planSubText) + '</div>',
          planInfo,
        '</div>',
        paymentSection,
        cancelSection
      ].join('');
    }

    // ──────────────────────────────────────────────
    // 6. 시트 생성·열기·닫기
    // ──────────────────────────────────────────────
    var psSheet = null;
    var psMainEl = null;
    var psSubEl = null;
    var psMainScroll = null;
    var psSubScroll = null;

    function psEnsureSheet() {
      if (psSheet) return;
      psSheet = document.createElement('div');
      psSheet.className = 'ps-overlay';
      psSheet.setAttribute('role', 'dialog');
      psSheet.setAttribute('aria-modal', 'true');
      psSheet.innerHTML =
        '<div class="ps-screen ps-main"><div class="ps-scroll"></div></div>' +
        '<div class="ps-screen ps-sub"><div class="ps-scroll"></div></div>';
      document.body.appendChild(psSheet);
      psMainEl = psSheet.querySelector('.ps-main');
      psSubEl = psSheet.querySelector('.ps-sub');
      psMainScroll = psMainEl.querySelector('.ps-scroll');
      psSubScroll = psSubEl.querySelector('.ps-scroll');
      psSheet.addEventListener('click', psOnClick);
    }

    function psRefreshMain() {
      if (!psMainScroll) return;
      try {
        var d = psCollectData();
        psMainScroll.innerHTML = psBuildMain(d);
      } catch (e) {
        console.warn('[profile-sheet] 메인 렌더 실패', e);
      }
    }

    function psRefreshSub() {
      if (!psSubScroll) return;
      try {
        var d = psCollectData();
        psSubScroll.innerHTML = psBuildSub(d);
      } catch (e) {
        console.warn('[profile-sheet] 구독 화면 렌더 실패', e);
      }
    }

    function psOpen() {
      try {
        psEnsureSheet();
        psRefreshMain();
        if (psSubEl) psSubEl.classList.remove('ps-open-sub');
        psSheet.classList.add('ps-open');
      } catch (e) { console.warn('[profile-sheet] 시트 열기 실패', e); }
    }

    function psClose() {
      try {
        if (psSheet) psSheet.classList.remove('ps-open');
      } catch (e) {}
    }

    function psPushSub() {
      try {
        psRefreshSub();
        if (psSubEl) psSubEl.classList.add('ps-open-sub');
      } catch (e) {}
    }

    function psPopSub() {
      try {
        if (psSubEl) psSubEl.classList.remove('ps-open-sub');
      } catch (e) {}
    }

    // ──────────────────────────────────────────────
    // 7. 행 클릭 라우팅
    // ──────────────────────────────────────────────
    function psClickHidden(id) {
      try {
        var el = document.getElementById(id);
        if (el && typeof el.click === 'function') el.click();
      } catch (e) {}
    }

    function psOnClick(e) {
      try {
        var btn = e.target.closest ? e.target.closest('[data-ps-act]') : null;
        if (!btn) return;
        var act = btn.getAttribute('data-ps-act');
        switch (act) {
          case 'close':
            psClose();
            break;
          case 'back':
            psPopSub();
            break;
          case 'subscription':
            psPushSub();
            break;
          case 'onboarding':
            psClose();
            try {
              if (typeof Onboarding !== 'undefined' && Onboarding.open) Onboarding.open('redo');
            } catch (err) {}
            break;
          case 'logout':
            psClose();
            psClickHidden('menuLogout');
            break;
          case 'terms':
            try {
              if (typeof openModal === 'function') openModal('modalTerms');
            } catch (err) {}
            break;
          case 'privacy':
            try {
              if (typeof openModal === 'function') openModal('modalPrivacy');
            } catch (err) {}
            break;
          case 'contact':
            try { window.location.href = 'mailto:hkbyoo@studia.co.kr'; } catch (err) {}
            break;
          case 'cancel':
            psClickHidden('menuSubscription');
            setTimeout(psClose, 200);
            break;
          case 'change-payment':
          case 'register-payment':
            psClose();
            setTimeout(function () {
              var rb = document.getElementById('billingRegBtn');
              if (rb) {
                rb.click();
              } else if (typeof showScreen === 'function') {
                showScreen('screenBilling');
              }
            }, 120);
            break;
        }
      } catch (err) {
        console.warn('[profile-sheet] 클릭 라우팅 실패', err);
      }
    }

    // ──────────────────────────────────────────────
    // 8. 기존 프로필 버튼 가로채기 + 드롭다운 숨기기
    // ──────────────────────────────────────────────
    function psInterceptProfileBtn() {
      try {
        var btn = document.getElementById('btnProfile');
        if (!btn) return false;
        if (btn.__psHooked) return true;
        btn.__psHooked = true;
        btn.addEventListener('click', function (e) {
          try {
            e.stopPropagation();
            e.preventDefault();
            var menu = document.getElementById('profileMenu');
            if (menu) {
              menu.hidden = true;
              menu.style.display = 'none';
            }
            psOpen();
          } catch (err) {
            console.warn('[profile-sheet] 프로필 클릭 처리 실패', err);
          }
        }, true);
        return true;
      } catch (e) {
        return false;
      }
    }

    function psHideOldMenu() {
      try {
        var menu = document.getElementById('profileMenu');
        if (menu) menu.style.display = 'none';
      } catch (e) {}
    }

    // ──────────────────────────────────────────────
    // 9. ESC 닫기
    // ──────────────────────────────────────────────
    function psBindEsc() {
      try {
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && psSheet && psSheet.classList.contains('ps-open')) {
            if (psSubEl && psSubEl.classList.contains('ps-open-sub')) psPopSub();
            else psClose();
          }
        });
      } catch (e) {}
    }

    // ──────────────────────────────────────────────
    // 10. 초기화
    // ──────────────────────────────────────────────
    function psInit() {
      try {
        psInjectCSS();
        psBindEsc();
        // btnProfile 이 늦게 생성될 수 있으므로 재시도 (최대 3초)
        var tries = 0;
        var iv = setInterval(function () {
          tries++;
          var ok = psInterceptProfileBtn();
          if (ok) psHideOldMenu();
          if (ok || tries >= 30) clearInterval(iv);
        }, 100);
        // 사용자 정보 비동기 캐시
        setTimeout(psCacheUser, 1500);
        console.log('[profile-sheet] 초기화 완료 (v2)');
      } catch (e) {
        console.warn('[profile-sheet] 초기화 실패', e);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', psInit);
    } else {
      psInit();
    }

  } catch (e) {
    // 어떤 에러가 나도 다른 스크립트에 영향 안 가도록
    try { console.warn('[profile-sheet] 외부 catch', e); } catch (_) {}
  }
})();
