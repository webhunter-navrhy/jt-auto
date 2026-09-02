/* JT Auto — Admin Panel */
const Admin = (() => {
  const STORAGE_KEYS = {
    password: 'jt_admin_password',
    vehicles: 'jt_vehicles',
    hero: 'jt_hero',
    contact: 'jt_contact',
    stats: 'jt_stats',
    session: 'jt_admin_session'
  };

  const DEFAULT_PASSWORD = 'admin';

  /* ===== PASSWORD HASHING ===== */
  async function hashPassword(pwd) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd + '_jt_auto_salt');
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function getStoredHash() {
    const stored = localStorage.getItem(STORAGE_KEYS.password);
    if (stored) return stored;
    const defaultHash = await hashPassword(DEFAULT_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.password, defaultHash);
    return defaultHash;
  }

  /* ===== AUTH ===== */
  async function login(password) {
    const hash = await hashPassword(password);
    const storedHash = await getStoredHash();
    if (hash === storedHash) {
      sessionStorage.setItem(STORAGE_KEYS.session, 'true');
      return true;
    }
    return false;
  }

  function isLoggedIn() {
    return sessionStorage.getItem(STORAGE_KEYS.session) === 'true';
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEYS.session);
    location.reload();
  }

  /* ===== DATA STORAGE ===== */
  function getData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  function setData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ===== TOAST ===== */
  function toast(message, type = '') {
    const el = document.getElementById('admin-toast');
    el.textContent = message;
    el.className = 'admin-toast visible' + (type ? ' admin-toast--' + type : '');
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('visible'), 3000);
  }

  /* ===== DEFAULT VEHICLES ===== */
  function getDefaultVehicles() {
    return [
      {
        id: 'v790',
        title: 'Mazda CX-5 2.0i Sports-Line',
        desc: 'FULL LED, Navigace, Tažné zařízení, Servisní knížka',
        price: '459 000 Kč',
        year: 2018,
        km: '115 000 km',
        power: '121 kW',
        fuel: 'Benzín',
        transmission: 'Manuál',
        vin: 'JMZKF6W7600665852',
        image: 'assets/images/vehicle-790-mazda-cx5.jpg',
        gallery: ['assets/images/v790-gallery-1.jpg','assets/images/v790-gallery-2.jpg','assets/images/v790-gallery-3.jpg','assets/images/v790-gallery-4.jpg'],
        status: 'Skladem'
      },
      {
        id: 'v785',
        title: 'Mazda CX-5 2.0i Kangei',
        desc: 'FULL LED, Navigace, Tempomat, Originální tažné zařízení',
        price: '485 000 Kč',
        year: 2020,
        km: '117 000 km',
        power: '121 kW',
        fuel: 'Benzín',
        transmission: 'Manuál',
        vin: 'JMZKF6W7600862686',
        image: 'assets/images/vehicle-785-mazda-cx5.jpg',
        gallery: ['assets/images/v785-gallery-1.jpg','assets/images/v785-gallery-2.jpg','assets/images/v785-gallery-3.jpg','assets/images/v785-gallery-4.jpg'],
        status: 'Skladem'
      },
      {
        id: 'v782',
        title: 'Škoda Fabia 1.2 TSI Joy Kombi',
        desc: 'Digitální klima, Tempomat, Vyhřívaná sedadla, Servisní knížka',
        price: '219 000 Kč',
        year: 2016,
        km: '100 000 km',
        power: '66 kW',
        fuel: 'Benzín',
        transmission: 'Manuál',
        vin: 'TMBJM6NJ5GZ197332',
        image: 'assets/images/vehicle-782-skoda-fabia.jpg',
        gallery: ['assets/images/v782-gallery-1.jpg','assets/images/v782-gallery-2.jpg','assets/images/v782-gallery-3.jpg','assets/images/v782-gallery-4.jpg'],
        status: 'Skladem'
      }
    ];
  }

  function getVehicles() {
    return getData(STORAGE_KEYS.vehicles) || getDefaultVehicles();
  }

  function saveVehicles(vehicles) {
    setData(STORAGE_KEYS.vehicles, vehicles);
  }

  /* ===== DEFAULT DATA ===== */
  function getHeroData() {
    return getData(STORAGE_KEYS.hero) || {
      title: 'Prověřené vozy z\u00a0Německa bez\u00a0starostí',
      subtitle: 'Dovážíme pečlivě vybrané ojeté vozy s\u00a0transparentní historií. Žádné stočené kilometry, žádné skryté vady — jen férový přístup a\u00a0auta, která bychom sami rádi řídili.',
      btn1Text: 'Prohlédnout nabídku',
      btn2Text: 'Jak funguje dovoz',
      badge: '790+ úspěšně prodaných vozů · 10+ let na trhu'
    };
  }

  function getContactData() {
    return getData(STORAGE_KEYS.contact) || {
      name: 'Jan Tomášek',
      phone: '+420 776 210 220',
      email: 'info@jt-auto.cz',
      address: 'Václavská 1114, Chrudim 2, 537 01',
      showroom: 'Dašická 146, Chrudim, 537 01',
      ico: '74412183',
      dic: 'CZ7906223127'
    };
  }

  function getStatsData() {
    return getData(STORAGE_KEYS.stats) || {
      vehicles: 790,
      years: 10
    };
  }

  /* ===== RENDER: DASHBOARD ===== */
  function renderDashboard() {
    const vehicles = getVehicles();
    const inStock = vehicles.filter(v => v.status === 'Skladem').length;
    const reserved = vehicles.filter(v => v.status === 'Rezervováno').length;
    const sold = vehicles.filter(v => v.status === 'Prodáno').length;

    document.getElementById('dashboard-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-card__label">Vozidel celkem</div>
        <div class="stat-card__value">${vehicles.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Skladem</div>
        <div class="stat-card__value" style="color:var(--admin-success);">${inStock}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Rezervováno</div>
        <div class="stat-card__value" style="color:var(--admin-warning);">${reserved}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Prodáno</div>
        <div class="stat-card__value" style="color:var(--admin-text-muted);">${sold}</div>
      </div>
    `;
  }

  /* ===== RENDER: VEHICLES ===== */
  function renderVehicleList() {
    const vehicles = getVehicles();
    const list = document.getElementById('vehicle-list');

    if (!vehicles.length) {
      list.innerHTML = `
        <div class="admin-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          <p>Zatím nemáte žádná vozidla.</p>
          <button class="admin-btn admin-btn--primary" onclick="Admin.openVehicleModal()">Přidat první vůz</button>
        </div>
      `;
      return;
    }

    const statusColors = {
      'Skladem': 'var(--admin-success)',
      'Rezervováno': 'var(--admin-warning)',
      'Prodáno': 'var(--admin-text-muted)'
    };

    list.innerHTML = vehicles.map(v => `
      <div class="vehicle-item">
        <img class="vehicle-item__img" src="${escapeHtml(v.image)}" alt="${escapeHtml(v.title)}" onerror="this.style.display='none'">
        <div class="vehicle-item__info">
          <div class="vehicle-item__title">${escapeHtml(v.title)}</div>
          <div class="vehicle-item__meta">
            ${escapeHtml(v.year + '')} · ${escapeHtml(v.km)} · ${escapeHtml(v.fuel)} ·
            <span style="color:${statusColors[v.status] || 'inherit'};font-weight:600;">${escapeHtml(v.status)}</span>
          </div>
        </div>
        <div class="vehicle-item__price">${escapeHtml(v.price)}</div>
        <div class="vehicle-item__actions">
          <button class="admin-btn admin-btn--secondary admin-btn--sm" onclick="Admin.editVehicle('${v.id}')">Upravit</button>
          <button class="admin-btn admin-btn--danger admin-btn--sm" onclick="Admin.deleteVehicle('${v.id}')">Smazat</button>
        </div>
      </div>
    `).join('');
  }

  /* ===== VEHICLE MODAL ===== */
  function openVehicleModal(vehicleId) {
    const modal = document.getElementById('vehicle-modal');
    const form = document.getElementById('vehicle-form');
    form.reset();

    if (vehicleId) {
      const vehicle = getVehicles().find(v => v.id === vehicleId);
      if (!vehicle) return;
      document.getElementById('vehicle-modal-title').textContent = 'Upravit vozidlo';
      document.getElementById('vf-id').value = vehicle.id;
      document.getElementById('vf-title').value = vehicle.title;
      document.getElementById('vf-desc').value = vehicle.desc || '';
      document.getElementById('vf-price').value = vehicle.price;
      document.getElementById('vf-year').value = vehicle.year;
      document.getElementById('vf-km').value = vehicle.km;
      document.getElementById('vf-power').value = vehicle.power;
      document.getElementById('vf-fuel').value = vehicle.fuel;
      document.getElementById('vf-transmission').value = vehicle.transmission || 'Manuál';
      document.getElementById('vf-vin').value = vehicle.vin || '';
      document.getElementById('vf-image').value = vehicle.image || '';
      document.getElementById('vf-gallery').value = (vehicle.gallery || []).join(', ');
      document.getElementById('vf-status').value = vehicle.status || 'Skladem';
    } else {
      document.getElementById('vehicle-modal-title').textContent = 'Přidat vozidlo';
      document.getElementById('vf-id').value = '';
    }

    modal.classList.add('visible');
  }

  function closeVehicleModal() {
    document.getElementById('vehicle-modal').classList.remove('visible');
  }

  function saveVehicleFromForm() {
    const id = document.getElementById('vf-id').value || 'v' + Date.now();
    const galleryRaw = document.getElementById('vf-gallery').value;
    const gallery = galleryRaw ? galleryRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const vehicle = {
      id,
      title: document.getElementById('vf-title').value.trim(),
      desc: document.getElementById('vf-desc').value.trim(),
      price: document.getElementById('vf-price').value.trim(),
      year: parseInt(document.getElementById('vf-year').value),
      km: document.getElementById('vf-km').value.trim(),
      power: document.getElementById('vf-power').value.trim(),
      fuel: document.getElementById('vf-fuel').value,
      transmission: document.getElementById('vf-transmission').value,
      vin: document.getElementById('vf-vin').value.trim(),
      image: document.getElementById('vf-image').value.trim(),
      gallery,
      status: document.getElementById('vf-status').value
    };

    const vehicles = getVehicles();
    const existingIdx = vehicles.findIndex(v => v.id === id);
    if (existingIdx >= 0) {
      vehicles[existingIdx] = vehicle;
    } else {
      vehicles.unshift(vehicle);
    }

    saveVehicles(vehicles);
    closeVehicleModal();
    renderVehicleList();
    renderDashboard();
    toast('Vozidlo uloženo', 'success');
  }

  function deleteVehicle(id) {
    if (!confirm('Opravdu chcete smazat toto vozidlo?')) return;
    const vehicles = getVehicles().filter(v => v.id !== id);
    saveVehicles(vehicles);
    renderVehicleList();
    renderDashboard();
    toast('Vozidlo smazáno', 'success');
  }

  function editVehicle(id) {
    openVehicleModal(id);
  }

  /* ===== FORMS ===== */
  function initHeroForm() {
    const data = getHeroData();
    document.getElementById('hero-title').value = data.title;
    document.getElementById('hero-subtitle').value = data.subtitle;
    document.getElementById('hero-btn1-text').value = data.btn1Text;
    document.getElementById('hero-btn2-text').value = data.btn2Text;
    document.getElementById('hero-badge').value = data.badge;
  }

  function saveHeroForm() {
    const data = {
      title: document.getElementById('hero-title').value.trim(),
      subtitle: document.getElementById('hero-subtitle').value.trim(),
      btn1Text: document.getElementById('hero-btn1-text').value.trim(),
      btn2Text: document.getElementById('hero-btn2-text').value.trim(),
      badge: document.getElementById('hero-badge').value.trim()
    };
    setData(STORAGE_KEYS.hero, data);
    toast('Hero sekce uložena', 'success');
  }

  function initContactForm() {
    const data = getContactData();
    document.getElementById('contact-name').value = data.name;
    document.getElementById('contact-phone').value = data.phone;
    document.getElementById('contact-email').value = data.email;
    document.getElementById('contact-address').value = data.address;
    document.getElementById('contact-showroom').value = data.showroom;
    document.getElementById('contact-ico').value = data.ico;
    document.getElementById('contact-dic').value = data.dic;
  }

  function saveContactForm() {
    const data = {
      name: document.getElementById('contact-name').value.trim(),
      phone: document.getElementById('contact-phone').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      address: document.getElementById('contact-address').value.trim(),
      showroom: document.getElementById('contact-showroom').value.trim(),
      ico: document.getElementById('contact-ico').value.trim(),
      dic: document.getElementById('contact-dic').value.trim()
    };
    setData(STORAGE_KEYS.contact, data);
    toast('Kontaktní údaje uloženy', 'success');
  }

  function initStatsForm() {
    const data = getStatsData();
    document.getElementById('stat-vehicles').value = data.vehicles;
    document.getElementById('stat-years').value = data.years;
  }

  function saveStatsForm() {
    const data = {
      vehicles: parseInt(document.getElementById('stat-vehicles').value) || 790,
      years: parseInt(document.getElementById('stat-years').value) || 10
    };
    setData(STORAGE_KEYS.stats, data);
    toast('Statistiky uloženy', 'success');
  }

  /* ===== PASSWORD CHANGE ===== */
  async function changePassword() {
    const current = document.getElementById('current-password').value;
    const newPwd = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;

    if (newPwd !== confirm) {
      toast('Hesla se neshodují', 'error');
      return;
    }
    if (newPwd.length < 3) {
      toast('Heslo musí mít alespoň 3 znaky', 'error');
      return;
    }

    const currentHash = await hashPassword(current);
    const storedHash = await getStoredHash();

    if (currentHash !== storedHash) {
      toast('Současné heslo je nesprávné', 'error');
      return;
    }

    const newHash = await hashPassword(newPwd);
    localStorage.setItem(STORAGE_KEYS.password, newHash);
    document.getElementById('password-form').reset();
    toast('Heslo změněno', 'success');
  }

  /* ===== EXPORT / IMPORT ===== */
  function exportData() {
    const data = {
      vehicles: getVehicles(),
      hero: getHeroData(),
      contact: getContactData(),
      stats: getStatsData(),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jt-auto-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Data exportována', 'success');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.vehicles) setData(STORAGE_KEYS.vehicles, data.vehicles);
        if (data.hero) setData(STORAGE_KEYS.hero, data.hero);
        if (data.contact) setData(STORAGE_KEYS.contact, data.contact);
        if (data.stats) setData(STORAGE_KEYS.stats, data.stats);
        renderAll();
        toast('Data importována', 'success');
      } catch {
        toast('Chyba při čtení souboru', 'error');
      }
    };
    reader.readAsText(file);
  }

  function resetAllData() {
    if (!confirm('Opravdu chcete smazat VŠECHNA data? Tato akce je nevratná.')) return;
    if (!confirm('Jste si jisti? Budou smazána všechna vozidla, kontakt, hero i statistiky.')) return;
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.password && key !== STORAGE_KEYS.session) {
        localStorage.removeItem(key);
      }
    });
    renderAll();
    toast('Všechna data smazána', 'success');
  }

  /* ===== NAVIGATION ===== */
  const sectionNames = {
    dashboard: 'Přehled',
    vehicles: 'Vozidla',
    hero: 'Hero sekce',
    contact: 'Kontakt',
    stats: 'Statistiky',
    settings: 'Nastavení'
  };

  function showSection(name) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-nav__item').forEach(b => b.classList.remove('active'));

    const section = document.getElementById('sec-' + name);
    const btn = document.querySelector(`[data-section="${name}"]`);
    if (section) section.classList.add('active');
    if (btn) btn.classList.add('active');

    document.getElementById('section-title').textContent = sectionNames[name] || name;

    // Close mobile sidebar
    document.getElementById('admin-sidebar').classList.remove('is-open');
    document.getElementById('sidebar-overlay').classList.remove('visible');
  }

  /* ===== UTILS ===== */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderAll() {
    renderDashboard();
    renderVehicleList();
    initHeroForm();
    initContactForm();
    initStatsForm();
  }

  /* ===== INIT ===== */
  function init() {
    const loginScreen = document.getElementById('login-screen');
    const adminLayout = document.getElementById('admin-layout');
    const loginForm = document.getElementById('login-form');

    if (isLoggedIn()) {
      loginScreen.style.display = 'none';
      adminLayout.hidden = false;
      renderAll();
    }

    // Login
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwd = document.getElementById('login-password').value;
      const ok = await login(pwd);
      if (ok) {
        loginScreen.style.display = 'none';
        adminLayout.hidden = false;
        renderAll();
      } else {
        document.getElementById('login-error').classList.add('visible');
      }
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', logout);

    // Sidebar navigation
    document.querySelectorAll('.admin-nav__item').forEach(btn => {
      btn.addEventListener('click', () => showSection(btn.dataset.section));
    });

    // Mobile sidebar
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('admin-sidebar').classList.toggle('is-open');
      document.getElementById('sidebar-overlay').classList.toggle('visible');
    });
    document.getElementById('sidebar-overlay').addEventListener('click', () => {
      document.getElementById('admin-sidebar').classList.remove('is-open');
      document.getElementById('sidebar-overlay').classList.remove('visible');
    });

    // Vehicle modal
    document.getElementById('btn-add-vehicle').addEventListener('click', () => openVehicleModal());
    document.getElementById('vehicle-modal-close').addEventListener('click', closeVehicleModal);
    document.getElementById('vehicle-modal-cancel').addEventListener('click', closeVehicleModal);
    document.getElementById('vehicle-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeVehicleModal();
    });
    document.getElementById('vehicle-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveVehicleFromForm();
    });

    // Hero form
    document.getElementById('hero-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveHeroForm();
    });

    // Contact form
    document.getElementById('contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveContactForm();
    });

    // Stats form
    document.getElementById('stats-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveStatsForm();
    });

    // Password form
    document.getElementById('password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      changePassword();
    });

    // Export / Import / Reset
    document.getElementById('btn-export').addEventListener('click', exportData);
    document.getElementById('btn-import').addEventListener('change', (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
    });
    document.getElementById('btn-reset-data').addEventListener('click', resetAllData);
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    showSection,
    openVehicleModal,
    editVehicle,
    deleteVehicle
  };
})();
