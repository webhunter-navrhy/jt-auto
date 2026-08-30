/* Mobile menu toggle */
const toggle = document.querySelector('.nav__toggle');
const menu = document.querySelector('.nav__menu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !open);
    menu.classList.toggle('is-open');
    document.body.style.overflow = open ? '' : 'hidden';
  });
  menu.querySelectorAll('.nav__link').forEach(link =>
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
    })
  );
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });
}

/* Active section highlighting */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link');
if (sections.length && navLinks.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active',
            link.getAttribute('href') === `#${entry.target.id}`
          );
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => observer.observe(s));
}

/* Scroll reveal with direction + delay support */
const reveals = document.querySelectorAll('[data-reveal]');
if (reveals.length) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay) || 0;
        if (delay) {
          setTimeout(() => entry.target.classList.add('revealed'), delay);
        } else {
          entry.target.classList.add('revealed');
        }
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  reveals.forEach(el => revealObserver.observe(el));
}

/* Stagger animation — triggers children sequentially */
function initStagger(containerSel, itemSel) {
  const containers = document.querySelectorAll(containerSel);
  if (!containers.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll(itemSel).forEach((item, i) => {
          item.style.setProperty('--i', i);
          setTimeout(() => item.classList.add('is-visible'), i * 80);
        });
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  containers.forEach(el => obs.observe(el));
}
initStagger('.grid', '.stagger-item');
initStagger('.process-steps', '.stagger-item');
initStagger('.gallery-grid', '.stagger-item');
initStagger('.stats .grid--4', '.stagger-item');
initStagger('.contact-info-grid', '.stagger-item');

/* Counter animation — HTML text = FINAL value. JS animates FROM 0 TO target.
   If JS fails, user still sees the correct number. */
const counters = document.querySelectorAll('.counter');
if (counters.length) {
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const duration = 2000;
        const start = performance.now();
        const animate = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = prefix + Math.floor(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  counters.forEach(c => counterObserver.observe(c));
}

/* Lightbox — works with [data-lightbox] links (gallery images) */
const lbDialog = document.getElementById('lightbox');
if (lbDialog) {
  const lbImg = lbDialog.querySelector('.lightbox__img');
  const items = [...document.querySelectorAll('[data-lightbox]')];
  let currentIdx = 0;

  function showLightbox(idx) {
    currentIdx = idx;
    const el = items[idx];
    const src = el.href || el.querySelector('img')?.src || '';
    const alt = el.querySelector('img')?.alt || '';
    lbImg.src = src;
    lbImg.alt = alt;
    lbDialog.showModal();
  }

  items.forEach((el, i) => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', e => { e.preventDefault(); showLightbox(i); });
  });

  lbDialog.addEventListener('click', e => { if (e.target === lbDialog) lbDialog.close(); });
  lbDialog.querySelector('.lightbox__close')?.addEventListener('click', () => lbDialog.close());

  document.addEventListener('keydown', e => {
    if (!lbDialog.open) return;
    if (e.key === 'ArrowRight' && currentIdx < items.length - 1) showLightbox(currentIdx + 1);
    if (e.key === 'ArrowLeft' && currentIdx > 0) showLightbox(currentIdx - 1);
  });
}

/* Scroll progress bar — JS fallback for browsers without scroll-driven CSS */
if (typeof CSS !== 'undefined' && !CSS.supports?.('animation-timeline', 'scroll()')) {
  const bar = document.querySelector('.scroll-progress');
  if (bar) {
    bar.style.display = 'block';
    window.addEventListener('scroll', () => {
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      bar.style.transform = `scaleX(${Math.min(pct, 1)})`;
    }, { passive: true });
  }
}
/* === ADVANCED EFFECTS (Level 7+) === */

/* Magnetic buttons — lerp-based spring pull toward cursor */
document.querySelectorAll('.btn--magnetic').forEach(btn => {
  let bounds, rafId;
  let cx = 0, cy = 0, tx = 0, ty = 0;
  const strength = 0.3, lerp = 0.15;

  btn.addEventListener('mouseenter', () => {
    bounds = btn.getBoundingClientRect();
    cancelAnimationFrame(rafId);
    tick();
  });
  btn.addEventListener('mousemove', e => {
    tx = (e.clientX - bounds.left - bounds.width / 2) * strength;
    ty = (e.clientY - bounds.top - bounds.height / 2) * strength;
  });
  btn.addEventListener('mouseleave', () => { tx = 0; ty = 0; });

  function tick() {
    cx += (tx - cx) * lerp;
    cy += (ty - cy) * lerp;
    if (Math.abs(cx) < 0.1 && Math.abs(cy) < 0.1 && tx === 0 && ty === 0) {
      cx = 0; cy = 0;
      btn.style.transform = '';
      return;
    }
    btn.style.transform = `translate(${cx}px, ${cy}px)`;
    rafId = requestAnimationFrame(tick);
  }
});

/* Parallax JS fallback — only when CSS scroll-driven not supported */
if (typeof CSS !== 'undefined' && !CSS.supports?.('animation-timeline', 'view()')) {
  const parallaxImgs = document.querySelectorAll('.parallax-img img');
  if (parallaxImgs.length) {
    function updateParallax() {
      const vh = window.innerHeight;
      parallaxImgs.forEach(img => {
        const rect = img.parentElement.getBoundingClientRect();
        const progress = (rect.top + rect.height / 2) / (vh + rect.height);
        const offset = (progress - 0.5) * 16;
        img.style.transform = `translateY(${offset}%) scale(1.15)`;
      });
    }
    window.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();
  }
}

/* Image tilt on hover (3D card effect) — for elements with .card--tilt */
document.querySelectorAll('.card--tilt').forEach(card => {
  card.style.transformStyle = 'preserve-3d';
  card.style.perspective = '800px';
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* Reduced motion: disable all advanced effects */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.btn--magnetic, .parallax-img img, .card--tilt').forEach(el => {
    el.style.transform = '';
  });
}
