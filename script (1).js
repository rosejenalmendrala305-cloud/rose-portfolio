/* =========================================================
   Rose Jen Almendrala — Portfolio
   Vanilla JavaScript · no dependencies
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     EDIT ME — replace these placeholders with your real details
     --------------------------------------------------------- */
  const CONFIG = {
    email: 'hello@yourdomain.com',                       // your real email address
    linkedin: 'https://www.linkedin.com/in/your-profile' // your real LinkedIn URL
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- contact placeholders ---------- */
  $$('[data-email]').forEach(a => { a.href = 'mailto:' + CONFIG.email; });
  $$('[data-email-text]').forEach(el => { el.textContent = CONFIG.email; });
  $$('[data-linkedin]').forEach(a => { a.href = CONFIG.linkedin; });
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- split hero name into characters ---------- */
  $$('[data-split]').forEach(el => {
    const text = el.textContent;
    const base = el.getAttribute('data-base');
    if (base) el.style.setProperty('--base', base);
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    Array.from(text).forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', i);
      s.textContent = c === ' ' ? ' ' : c;
      el.appendChild(s);
    });
  });

  /* ---------------------------------------------------------
     INTRO
     --------------------------------------------------------- */
  const intro = $('#intro');
  const introPct = $('#introPct');
  const introSkip = $('#introSkip');
  let introFinished = false;
  let introCancelled = false;

  function setReady() { root.classList.add('is-ready'); }

  function finishIntro() {
    if (introFinished) return;
    introFinished = true;
    try { sessionStorage.setItem('rja-intro', '1'); } catch (e) { /* storage unavailable */ }
    root.classList.remove('intro-active');
    if (!intro) { setReady(); return; }
    intro.classList.add('is-leaving');
    window.setTimeout(setReady, reduced ? 0 : 650);
    window.setTimeout(() => { if (intro.parentNode) intro.parentNode.removeChild(intro); }, reduced ? 0 : 1400);
  }

  function runIntro() {
    const bar = $('.intro__bar i', intro);
    const duration = 2600;
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    function tick(now) {
      if (introCancelled) return;
      const t = Math.min((now - start) / duration, 1);
      const p = ease(t);
      if (bar) bar.style.setProperty('--p', p.toFixed(3));
      if (introPct) introPct.textContent = String(Math.round(p * 100)).padStart(2, '0');
      if (t < 1) requestAnimationFrame(tick);
      else window.setTimeout(finishIntro, 350);
    }
    requestAnimationFrame(tick);
  }

  if (!intro || root.classList.contains('no-intro')) {
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    root.classList.remove('intro-active');
    // let the first frame paint, then reveal
    requestAnimationFrame(() => requestAnimationFrame(setReady));
  } else {
    runIntro();
    if (introSkip) {
      introSkip.addEventListener('click', () => { introCancelled = true; finishIntro(); });
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !introFinished) { introCancelled = true; finishIntro(); }
    });
  }

  /* ---------------------------------------------------------
     SCROLL REVEALS
     --------------------------------------------------------- */
  const revealEls = $$('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------------------------------------------------------
     NAVIGATION
     --------------------------------------------------------- */
  const nav = $('#nav');
  const menu = $('#mobileMenu');
  const menuBtn = $('#menuBtn');
  const progressBar = $('#progressBar');

  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    root.classList.toggle('menu-open', open);
  }
  if (menuBtn) menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu && menu.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });

  // smooth in-page anchors (offset handled by CSS scroll-padding-top)
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      const wasOpen = menu && menu.classList.contains('is-open');
      if (wasOpen) setMenu(false);
      const go = () => {
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        try { history.pushState(null, '', href); } catch (err) { /* file:// may block */ }
      };
      if (wasOpen) window.setTimeout(go, 60); else go();
    });
  });

  // active section indicator
  const navLinks = $$('[data-nav]');
  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + id));
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => so.observe(s));
  }

  /* ---------------------------------------------------------
     SCROLL-DRIVEN: progress bar, nav state, parallax (rAF throttled)
     --------------------------------------------------------- */
  const px = $$('[data-speed]').map(el => ({ el, speed: parseFloat(el.dataset.speed) || 0, host: el.parentElement }));
  let ticking = false;

  function onScroll() {
    const y = window.scrollY || window.pageYOffset;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (nav) nav.classList.toggle('is-scrolled', y > 40);

    if (!reduced) {
      const vh = window.innerHeight;
      px.forEach(({ el, speed, host }) => {
        const r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const offset = (r.top + r.height / 2 - vh / 2) * speed * -1;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------------------------------------------------------
     CUSTOM CURSOR (desktop pointer only)
     --------------------------------------------------------- */
  const cursor = $('.cursor');
  if (cursor && finePointer && !reduced) {
    const dot = $('.cursor__dot', cursor);
    const ring = $('.cursor__ring', cursor);
    const label = $('.cursor__label', cursor);
    let mx = -100, my = -100, rx = -100, ry = -100;
    root.classList.add('has-cursor');

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', e => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return;
      const lab = t.closest('[data-cursor-label]');
      if (lab) {
        label.textContent = lab.getAttribute('data-cursor-label');
        cursor.classList.add('is-label'); cursor.classList.remove('is-link');
      } else {
        cursor.classList.remove('is-label');
        cursor.classList.toggle('is-link', !!t.closest('a, button, .tool, .service, .skill, .fact'));
      }
    });
    document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
  }

  /* ---------------------------------------------------------
     MAGNETIC BUTTONS
     --------------------------------------------------------- */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.22;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.32;
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    // cursor-following fill on service cards
    $$('.service').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------------------------------------------------------
     PROJECTS: whole visual is clickable, opens the card's CTA
     --------------------------------------------------------- */
  $$('.project').forEach(project => {
    const visual = $('.project__visual', project);
    const cta = $('.project__cta', project);
    if (!visual || !cta) return;
    visual.addEventListener('click', () => cta.click());
  });

  /* ---------------------------------------------------------
     MODAL (concept / sample projects)
     --------------------------------------------------------- */
  const modal = $('#modal');
  if (modal) {
    const mKicker = $('#modalKicker'), mTitle = $('#modalTitle'), mText = $('#modalText'), mNote = $('#modalNote');
    const mClose = $('#modalClose'), mCta = $('#modalCta');

    const closeModal = () => {
      if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open');
      root.classList.remove('modal-open');
    };

    $$('[data-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        mKicker.textContent = btn.dataset.kicker || '';
        mTitle.textContent = btn.dataset.title || '';
        mText.textContent = btn.dataset.text || '';
        mNote.textContent = btn.dataset.note || '';
        mNote.hidden = !btn.dataset.note;
        if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
        root.classList.add('modal-open');
      });
    });

    mClose.addEventListener('click', closeModal);
    modal.addEventListener('close', () => root.classList.remove('modal-open'));
    modal.addEventListener('click', e => {           // click on backdrop
      const r = $('.modal__box', modal).getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal();
    });
    if (mCta) mCta.addEventListener('click', e => {
      e.preventDefault();
      closeModal();
      const t = document.getElementById('contact');
      if (t) window.setTimeout(() => t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }), 80);
    });
  }

  /* ---------------------------------------------------------
     COPY EMAIL + TOAST
     --------------------------------------------------------- */
  const toast = $('#toast');
  let toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
  }

  const copyBtn = $('#copyEmail');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(CONFIG.email);
        } else {
          const ta = document.createElement('textarea');
          ta.value = CONFIG.email; ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        showToast('Email address copied to clipboard');
      } catch (err) {
        showToast('Copy not available — ' + CONFIG.email);
      }
    });
  }
})();
