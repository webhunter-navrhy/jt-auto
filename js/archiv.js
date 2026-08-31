/* Archive — filtering, search, load-more */
(function () {
  const grid = document.getElementById('archive-grid');
  if (!grid) return;

  const cards = [...grid.querySelectorAll('.archive-card')];
  const brandSelect = document.getElementById('filter-brand');
  const yearSelect = document.getElementById('filter-year');
  const fuelSelect = document.getElementById('filter-fuel');
  const searchInput = document.getElementById('filter-search');
  const resetBtn = document.getElementById('filter-reset');
  const countEl = document.getElementById('archive-count');
  const loadMoreBtn = document.getElementById('load-more');
  const loadMoreWrap = document.getElementById('load-more-wrap');

  const BATCH = 24;
  let visibleLimit = BATCH;

  function applyFilters() {
    const brand = brandSelect?.value || '';
    const year = yearSelect?.value || '';
    const fuel = fuelSelect?.value || '';
    const query = (searchInput?.value || '').toLowerCase().trim();

    let matched = 0;
    let shown = 0;

    cards.forEach(card => {
      const matchBrand = !brand || card.dataset.brand === brand;
      const matchYear = !year || card.dataset.year === year;
      const matchFuel = !fuel || card.dataset.fuel === fuel;
      const matchSearch = !query || card.textContent.toLowerCase().includes(query);

      const isMatch = matchBrand && matchYear && matchFuel && matchSearch;

      if (isMatch) {
        matched++;
        if (matched <= visibleLimit) {
          card.hidden = false;
          shown++;
        } else {
          card.hidden = true;
        }
      } else {
        card.hidden = true;
      }
    });

    if (countEl) {
      countEl.textContent = matched + (matched === 1 ? ' vozidlo' : matched < 5 ? ' vozidla' : ' vozidel');
    }

    if (loadMoreWrap) {
      loadMoreWrap.hidden = shown >= matched;
    }

    /* Show empty state */
    let empty = grid.querySelector('.archive-empty');
    if (matched === 0) {
      if (!empty) {
        empty = document.createElement('div');
        empty.className = 'archive-empty';
        empty.textContent = 'Žádné vozy neodpovídají zadaným filtrům.';
        grid.appendChild(empty);
      }
    } else if (empty) {
      empty.remove();
    }
  }

  /* Event listeners */
  [brandSelect, yearSelect, fuelSelect].forEach(sel => {
    sel?.addEventListener('change', () => { visibleLimit = BATCH; applyFilters(); });
  });

  let searchTimeout;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { visibleLimit = BATCH; applyFilters(); }, 200);
  });

  resetBtn?.addEventListener('click', () => {
    if (brandSelect) brandSelect.value = '';
    if (yearSelect) yearSelect.value = '';
    if (fuelSelect) fuelSelect.value = '';
    if (searchInput) searchInput.value = '';
    visibleLimit = BATCH;
    applyFilters();
  });

  loadMoreBtn?.addEventListener('click', () => {
    visibleLimit += BATCH;
    applyFilters();
    /* Scroll to first newly visible card */
    const visible = cards.filter(c => !c.hidden);
    const target = visible[visibleLimit - BATCH];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* Initial render — show first batch */
  applyFilters();
})();
