/* JT Auto — Dynamic content loader v4
   Fetches data from data/site-data.json, applies to pages */
(async function() {
  'use strict';

  let data;
  try {
    const resp = await fetch('data/site-data.json?t=' + Date.now());
    if (!resp.ok) return;
    data = await resp.json();
  } catch { return; }

  const page = location.pathname.split('/').pop() || 'index.html';
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* SVG icons */
  const icons = {
    cal: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    km: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>',
    pow: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    fuel: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>',
    gear: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>',
    doc: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    vin: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>'
  };

  /* ===== HERO (index.html) ===== */
  if (page === 'index.html' || page === '') {
    const hero = data.hero;
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

    const stats = data.stats;
    if (stats) {
      document.querySelectorAll('.counter').forEach(c => {
        if (c.dataset.target === '790' && stats.vehicles) { c.dataset.target = stats.vehicles; c.textContent = stats.vehicles + '+'; }
        if (c.dataset.target === '10' && stats.years) { c.dataset.target = stats.years; c.textContent = stats.years + '+'; }
      });
    }
  }

  /* ===== VEHICLES ===== */
  const vehicles = data.vehicles;
  if (vehicles) {
    const inStock = vehicles.filter(v => v.status === 'Skladem' || v.status === 'Rezervováno');
    const soldVehicles = vehicles.filter(v => v.status === 'Prodáno');

    /* INDEX — featured cards (max 3) */
    if (page === 'index.html' || page === '') {
      const grid = document.querySelector('#nabidka .grid--3');
      if (grid && inStock.length) {
        const featured = inStock.slice(0, 3);
        let html = '';
        for (const v of featured) {
          html += `
            <article class="vehicle-card card--lift stagger-item">
              <div class="vehicle-card__img img-overlay">
                ${v.image ? `<img src="${esc(v.image)}" alt="${esc(v.title)}" width="800" height="533" loading="lazy">` : ''}
                <span class="vehicle-card__badge">${esc(v.status)}</span>
              </div>
              <div class="vehicle-card__body">
                <h3 class="vehicle-card__title">${esc(v.title)}</h3>
                <div class="vehicle-card__price">${esc(v.price)}</div>
                <div class="vehicle-card__specs">
                  <span class="vehicle-card__spec">${icons.cal} ${v.year}</span>
                  <span class="vehicle-card__spec">${icons.km} ${esc(v.km)}</span>
                  <span class="vehicle-card__spec">${icons.pow} ${esc(v.power)}</span>
                  <span class="vehicle-card__spec">${icons.fuel} ${esc(v.fuel)}</span>
                </div>
                <div class="vehicle-card__actions"><a href="vozidlo.html?id=${v.id}" class="btn btn--primary btn--sm btn--block">Zobrazit detail</a></div>
              </div>
            </article>`;
        }
        grid.innerHTML = html;
      }
    }

    /* NABIDKA — compact card grid */
    if (page === 'nabidka.html') {
      const container = document.querySelector('.vehicles-section .container');
      if (container) {
        const ctaBox = container.querySelector('.cta-box');
        const legalText = container.querySelector('.legal-text');
        // Remove static vehicle cards
        container.querySelectorAll('.vehicle-card--detail').forEach(el => el.remove());

        if (inStock.length) {
          const grid = document.createElement('div');
          grid.className = 'vehicles-grid';

          for (const v of inStock) {
            const card = document.createElement('article');
            card.className = 'vehicle-card card--lift revealed';

            card.innerHTML = `
              <a href="vozidlo.html?id=${v.id}" class="vehicle-card__link">
                <div class="vehicle-card__img img-overlay">
                  ${v.image ? `<img src="${esc(v.image)}" alt="${esc(v.title)}" width="800" height="533" loading="lazy">` : ''}
                  <span class="vehicle-card__badge">${esc(v.status)}</span>
                </div>
                <div class="vehicle-card__body">
                  <h2 class="vehicle-card__title">${esc(v.title)}</h2>
                  ${v.desc ? `<p class="vehicle-card__desc">${esc(v.desc)}</p>` : ''}
                  <div class="vehicle-card__price">${esc(v.price)}</div>
                  <div class="vehicle-card__specs">
                    <span class="vehicle-card__spec">${icons.cal} ${v.year}</span>
                    <span class="vehicle-card__spec">${icons.km} ${esc(v.km)}</span>
                    <span class="vehicle-card__spec">${icons.pow} ${esc(v.power)}</span>
                    <span class="vehicle-card__spec">${icons.fuel} ${esc(v.fuel)}</span>
                  </div>
                  <div class="vehicle-card__actions">
                    <span class="btn btn--primary btn--sm btn--block">Zobrazit detail</span>
                  </div>
                </div>
              </a>`;

            grid.appendChild(card);
          }

          if (ctaBox) container.insertBefore(grid, ctaBox);
          else if (legalText) container.insertBefore(grid, legalText);
          else container.appendChild(grid);
        }
      }
    }

    /* VOZIDLO — vehicle detail page */
    if (page === 'vozidlo.html') {
      const urlParams = new URLSearchParams(location.search);
      const vehicleId = urlParams.get('id');
      const v = vehicleId ? vehicles.find(x => x.id === vehicleId) : null;
      const container = document.getElementById('vehicle-detail-container');

      if (v && container) {
        // Update page title & breadcrumb
        document.title = v.title + ' | JT Auto';
        const pageTitle = document.getElementById('vehicle-page-title');
        if (pageTitle) pageTitle.textContent = v.title;
        const breadcrumb = document.getElementById('breadcrumb-vehicle');
        if (breadcrumb) breadcrumb.textContent = v.title;

        const galleryHtml = (v.gallery || []).map((src, i) =>
          `<a href="${esc(src)}" data-lightbox class="stagger-item"><img src="${esc(src)}" alt="${esc(v.title)} foto ${i+1}" loading="lazy"></a>`
        ).join('');

        container.innerHTML = `
          <div class="vehicle-detail">
            <div class="vehicle-detail__main-img">
              ${v.image ? `<img src="${esc(v.image)}" alt="${esc(v.title)}" width="1200" height="800">` : ''}
              <span class="vehicle-card__badge vehicle-card__badge--lg">${esc(v.status)}</span>
            </div>
            <div class="vehicle-detail__info">
              <h2 class="vehicle-detail__title">${esc(v.title)}</h2>
              ${v.desc ? `<p class="vehicle-detail__desc">${esc(v.desc)}</p>` : ''}
              <div class="vehicle-detail__price">${esc(v.price)}</div>

              <div class="vehicle-detail__specs">
                <div class="vehicle-detail__spec">${icons.cal}<div><span class="spec-label">Rok výroby</span><span class="spec-value">${v.year}</span></div></div>
                <div class="vehicle-detail__spec">${icons.km}<div><span class="spec-label">Nájezd</span><span class="spec-value">${esc(v.km)}</span></div></div>
                <div class="vehicle-detail__spec">${icons.pow}<div><span class="spec-label">Výkon</span><span class="spec-value">${esc(v.power)}</span></div></div>
                <div class="vehicle-detail__spec">${icons.fuel}<div><span class="spec-label">Palivo</span><span class="spec-value">${esc(v.fuel || '—')}</span></div></div>
                <div class="vehicle-detail__spec">${icons.gear}<div><span class="spec-label">Převodovka</span><span class="spec-value">${esc(v.transmission || 'Manuál')}</span></div></div>
                ${v.vin ? `<div class="vehicle-detail__spec">${icons.vin}<div><span class="spec-label">VIN</span><span class="spec-value">${esc(v.vin)}</span></div></div>` : ''}
              </div>

              <div class="vehicle-detail__actions">
                <a href="tel:+420776210220" class="btn btn--primary btn--lg btn--magnetic">Zavolat a domluvit prohlídku</a>
                <a href="kontakt.html" class="btn btn--secondary btn--lg">Napsat dotaz</a>
              </div>
            </div>
          </div>

          ${galleryHtml ? `
          <div class="vehicle-detail__gallery">
            <h3>Fotogalerie <span class="text-muted">(${v.gallery.length} fotek)</span></h3>
            <div class="gallery-grid gallery-grid--detail">${galleryHtml}</div>
          </div>` : ''}

          <div class="vehicle-detail__back">
            <a href="nabidka.html" class="btn btn--secondary">&larr; Zpět na nabídku</a>
          </div>`;

        reinitLightbox();
      } else if (container) {
        container.innerHTML = `
          <div class="vehicle-detail__empty">
            <h2>Vozidlo nenalezeno</h2>
            <p>Toto vozidlo již není v nabídce nebo odkaz není platný.</p>
            <a href="nabidka.html" class="btn btn--primary btn--lg">&larr; Zpět na nabídku</a>
          </div>`;
      }
    }

    /* ARCHIV — add admin-managed sold vehicles at the top */
    if (page === 'archiv.html' && soldVehicles.length) {
      const archivGrid = document.querySelector('.archive-grid');
      if (archivGrid) {
        const fragment = document.createDocumentFragment();
        for (const v of soldVehicles) {
          const card = document.createElement('div');
          card.className = 'archive-card';
          card.dataset.brand = v.title.split(' ')[0] || '';
          card.dataset.year = v.year || '';
          card.dataset.fuel = v.fuel || '';
          card.dataset.title = v.title;

          card.innerHTML = `
            <div class="archive-card__img">
              ${v.image ? `<img src="${esc(v.image)}" alt="${esc(v.title)}" loading="lazy">` : '<div style="width:100%;height:100%;background:#f1f5f9"></div>'}
              <span class="vehicle-card__badge vehicle-card__badge--sold">Prodáno</span>
              <span class="archive-card__num">#${v.id.replace('v','')}</span>
            </div>
            <div class="archive-card__body">
              <div class="archive-card__title">${esc(v.title)}</div>
              <div class="archive-card__specs">
                <span>${v.year}</span>
                <span>${esc(v.km)}</span>
                <span>${esc(v.power)}</span>
                <span>${esc(v.fuel)}</span>
              </div>
            </div>`;

          fragment.appendChild(card);
        }
        archivGrid.insertBefore(fragment, archivGrid.firstChild);
      }
    }
  }

  /* ===== CONTACT ===== */
  const contact = data.contact;
  if (contact) {
    const fc = document.querySelector('.site-footer__contact');
    if (fc) {
      const ph = contact.phone.replace(/\s/g, '');
      fc.innerHTML = `<h4>Kontakt</h4><p><strong>${esc(contact.name)}</strong></p><p>${esc(contact.address).replace(',','<br>')}</p><p><a href="tel:${ph}">${esc(contact.phone)}</a></p><p><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></p><p class="text-sm mt-sm">IČ: ${esc(contact.ico)} | DIČ: ${esc(contact.dic)}</p>`;
    }

    if (page === 'kontakt.html') {
      const cards = document.querySelectorAll('.contact-info-card');
      if (cards.length >= 4) {
        const ph = contact.phone.replace(/\s/g, '');
        const a0 = cards[0].querySelector('a'); if (a0) { a0.href = 'tel:' + ph; a0.textContent = contact.phone; }
        const a1 = cards[1].querySelector('a'); if (a1) { a1.href = 'mailto:' + contact.email; a1.textContent = contact.email; }
        const p2 = cards[2].querySelector('p'); if (p2) p2.innerHTML = contact.address.replace(',', '<br>');
        const p3 = cards[3].querySelector('p'); if (p3) p3.innerHTML = contact.showroom.replace(',', '<br>');
      }
    }
  }

  /* ===== LIGHTBOX RE-INIT ===== */
  function reinitLightbox() {
    const dlg = document.getElementById('lightbox');
    if (!dlg) return;
    const img = dlg.querySelector('.lightbox__img');
    const items = [...document.querySelectorAll('[data-lightbox]')];
    let idx = 0;
    function show(i) { idx = i; const el = items[i]; img.src = el.href || el.querySelector('img')?.src || ''; img.alt = el.querySelector('img')?.alt || ''; dlg.showModal(); }
    items.forEach((el, i) => { el.style.cursor = 'zoom-in'; el.onclick = (e) => { e.preventDefault(); show(i); }; });
    document.addEventListener('keydown', (e) => {
      if (!dlg.open) return;
      if (e.key === 'ArrowRight' && idx < items.length - 1) show(idx + 1);
      if (e.key === 'ArrowLeft' && idx > 0) show(idx - 1);
    });
  }
})();
