/* JT Auto — Dynamic content loader
   Reads admin-saved data from localStorage and applies to pages. */
(function() {
  'use strict';

  function getData(key) {
    try {
      const d = localStorage.getItem(key);
      return d ? JSON.parse(d) : null;
    } catch { return null; }
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  const page = location.pathname.split('/').pop() || 'index.html';

  /* ===== HERO (index.html) ===== */
  if (page === 'index.html' || page === '') {
    const hero = getData('jt_hero');
    if (hero) {
      const h1 = document.querySelector('.hero__content h1');
      const p = document.querySelector('.hero__content > p');
      const btn1 = document.querySelector('.hero__actions .btn--white');
      const btn2 = document.querySelector('.hero__actions .btn--ghost-white');
      const badge = document.querySelector('.hero__badge');

      if (h1 && hero.title) h1.innerHTML = hero.title;
      if (p && hero.subtitle) p.innerHTML = hero.subtitle;
      if (btn1 && hero.btn1Text) btn1.textContent = hero.btn1Text;
      if (btn2 && hero.btn2Text) btn2.textContent = hero.btn2Text;
      if (badge && hero.badge) badge.innerHTML = hero.badge;
    }

    /* Stats */
    const stats = getData('jt_stats');
    if (stats) {
      const counters = document.querySelectorAll('.counter');
      counters.forEach(c => {
        if (c.dataset.target === '790' && stats.vehicles) {
          c.dataset.target = stats.vehicles;
          c.textContent = stats.vehicles + '+';
        }
        if (c.dataset.target === '10' && stats.years) {
          c.dataset.target = stats.years;
          c.textContent = stats.years + '+';
        }
      });
    }
  }

  /* ===== VEHICLES (index.html + nabidka.html) ===== */
  const vehicles = getData('jt_vehicles');
  if (vehicles) {

    /* SVG icon templates */
    const svgCalendar = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
    const svgClock = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>';
    const svgBolt = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
    const svgFuel = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>';
    const svgGear = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>';
    const svgDoc = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    const svgVin = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>';

    const inStock = vehicles.filter(v => v.status === 'Skladem' || v.status === 'Rezervováno');

    /* INDEX — featured vehicle cards */
    if (page === 'index.html' || page === '') {
      const grid = document.querySelector('#nabidka .grid--3');
      if (grid && inStock.length) {
        const featured = inStock.slice(0, 3);
        grid.innerHTML = featured.map(v => `
          <article class="vehicle-card card--lift stagger-item">
            <div class="vehicle-card__img img-overlay">
              <img src="${escapeHtml(v.image)}" alt="${escapeHtml(v.title)}" width="800" height="533" loading="lazy">
              <span class="vehicle-card__badge">${escapeHtml(v.status)}</span>
            </div>
            <div class="vehicle-card__body">
              <h3 class="vehicle-card__title">${escapeHtml(v.title)}</h3>
              <div class="vehicle-card__price">${escapeHtml(v.price)}</div>
              <div class="vehicle-card__specs">
                <span class="vehicle-card__spec">${svgCalendar} ${v.year}</span>
                <span class="vehicle-card__spec">${svgClock} ${escapeHtml(v.km)}</span>
                <span class="vehicle-card__spec">${svgBolt} ${escapeHtml(v.power)}</span>
                <span class="vehicle-card__spec">${svgFuel} ${escapeHtml(v.fuel)}</span>
              </div>
              <div class="vehicle-card__actions">
                <a href="nabidka.html#${v.id}" class="btn btn--primary btn--sm btn--block">Zobrazit detail</a>
              </div>
            </div>
          </article>
        `).join('');
      }
    }

    /* NABIDKA — full vehicle details */
    if (page === 'nabidka.html') {
      const container = document.querySelector('.vehicles-section .container');
      if (container) {
        const ctaBox = container.querySelector('.cta-box');
        const legalText = container.querySelector('.legal-text');

        // Remove existing vehicle articles
        container.querySelectorAll('.vehicle-card--detail').forEach(el => el.remove());

        // Build new ones
        const fragment = document.createDocumentFragment();
        inStock.forEach(v => {
          const article = document.createElement('article');
          article.id = v.id;
          article.className = 'vehicle-card vehicle-card--detail card--lift';
          article.setAttribute('data-reveal', '');

          const galleryHtml = (v.gallery || []).map((src, i) =>
            `<a href="${escapeHtml(src)}" data-lightbox class="stagger-item"><img src="${escapeHtml(src)}" alt="${escapeHtml(v.title)} detail ${i+1}" loading="lazy"></a>`
          ).join('');

          const badgeClass = v.status === 'Skladem' ? 'vehicle-card__badge' :
                             v.status === 'Rezervováno' ? 'vehicle-card__badge' :
                             'vehicle-card__badge vehicle-card__badge--sold';

          article.innerHTML = `
            <div class="vehicle-card__img img-overlay">
              <img src="${escapeHtml(v.image)}" alt="${escapeHtml(v.title)}" width="800" height="533" loading="lazy">
              <span class="${badgeClass}">${escapeHtml(v.status)}</span>
            </div>
            <div class="vehicle-card__body">
              <h2 class="vehicle-card__title">${escapeHtml(v.title)}</h2>
              ${v.desc ? `<p class="text-muted text-sm">${escapeHtml(v.desc)}</p>` : ''}
              <div class="vehicle-card__price">${escapeHtml(v.price)}</div>
              <div class="vehicle-card__specs">
                <span class="vehicle-card__spec">${svgCalendar} Rok ${v.year}</span>
                <span class="vehicle-card__spec">${svgClock} ${escapeHtml(v.km)}</span>
                <span class="vehicle-card__spec">${svgBolt} ${escapeHtml(v.power)} / ${escapeHtml(v.fuel)}</span>
                <span class="vehicle-card__spec">${svgGear} ${escapeHtml(v.transmission || 'Manuál')}</span>
                <span class="vehicle-card__spec">${svgDoc} Servisní knížka</span>
                ${v.vin ? `<span class="vehicle-card__spec">${svgVin} VIN: ${escapeHtml(v.vin)}</span>` : ''}
              </div>
              ${galleryHtml ? `<div class="gallery-grid mt-lg">${galleryHtml}</div>` : ''}
              <div class="vehicle-card__actions mt-lg">
                <a href="tel:+420776210220" class="btn btn--primary btn--magnetic">Zavolat a domluvit prohlídku</a>
                <a href="kontakt.html" class="btn btn--secondary">Napsat dotaz</a>
              </div>
            </div>
          `;
          fragment.appendChild(article);
        });

        // Insert before CTA box
        if (ctaBox) {
          container.insertBefore(fragment, ctaBox);
        } else if (legalText) {
          container.insertBefore(fragment, legalText);
        } else {
          container.appendChild(fragment);
        }

        // Re-init lightbox for new elements
        reinitLightbox();
      }
    }
  }

  /* ===== CONTACT DATA (all pages with footer) ===== */
  const contact = getData('jt_contact');
  if (contact) {
    // Update footer contact on all pages
    const footerContact = document.querySelector('.site-footer__contact');
    if (footerContact) {
      const phoneClean = contact.phone.replace(/\s/g, '');
      footerContact.innerHTML = `
        <h4>Kontakt</h4>
        <p><strong>${escapeHtml(contact.name)}</strong></p>
        <p>${escapeHtml(contact.address).replace(',', '<br>')}</p>
        <p><a href="tel:${phoneClean}">${escapeHtml(contact.phone)}</a></p>
        <p><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></p>
        <p class="text-sm mt-sm">IČ: ${escapeHtml(contact.ico)} | DIČ: ${escapeHtml(contact.dic)}</p>
      `;
    }

    // Update kontakt.html specific elements
    if (page === 'kontakt.html') {
      const cards = document.querySelectorAll('.contact-info-card');
      if (cards.length >= 4) {
        const phoneClean = contact.phone.replace(/\s/g, '');
        // Phone card
        const phoneLink = cards[0].querySelector('a');
        if (phoneLink) { phoneLink.href = 'tel:' + phoneClean; phoneLink.textContent = contact.phone; }
        // Email card
        const emailLink = cards[1].querySelector('a');
        if (emailLink) { emailLink.href = 'mailto:' + contact.email; emailLink.textContent = contact.email; }
        // Address card
        const addrP = cards[2].querySelector('p');
        if (addrP) addrP.innerHTML = contact.address.replace(',', '<br>');
        // Showroom card
        const showP = cards[3].querySelector('p');
        if (showP) showP.innerHTML = contact.showroom.replace(',', '<br>');
      }
    }
  }

  /* ===== RE-INIT LIGHTBOX ===== */
  function reinitLightbox() {
    const lbDialog = document.getElementById('lightbox');
    if (!lbDialog) return;
    const lbImg = lbDialog.querySelector('.lightbox__img');
    const items = [...document.querySelectorAll('[data-lightbox]')];
    let currentIdx = 0;

    function show(idx) {
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
      el.removeEventListener('click', el._lbHandler);
      el._lbHandler = (e) => { e.preventDefault(); show(i); };
      el.addEventListener('click', el._lbHandler);
    });
  }
})();
