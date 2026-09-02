/* JT Auto — Admin Panel v2
   IndexedDB image storage, file upload, sold management */
const Admin = (() => {
  'use strict';

  const STORAGE = {
    password: 'jt_admin_password',
    vehicles: 'jt_vehicles',
    hero: 'jt_hero',
    contact: 'jt_contact',
    stats: 'jt_stats',
    session: 'jt_admin_session'
  };
  const DB_NAME = 'jt_auto_db';
  const DB_VERSION = 1;
  const IMG_STORE = 'images';
  const DEFAULT_PASSWORD = 'admin';
  const MAX_IMG_WIDTH = 1200;
  const THUMB_WIDTH = 400;

  let db = null;

  /* ===== IndexedDB ===== */
  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(IMG_STORE)) {
          d.createObjectStore(IMG_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => { db = e.target.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }

  async function saveImage(id, blob) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(IMG_STORE, 'readwrite');
      tx.objectStore(IMG_STORE).put({ id, blob, ts: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getImage(id) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(IMG_STORE, 'readonly');
      const req = tx.objectStore(IMG_STORE).get(id);
      req.onsuccess = () => resolve(req.result?.blob || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteImage(id) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(IMG_STORE, 'readwrite');
      tx.objectStore(IMG_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getAllImageKeys() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(IMG_STORE, 'readonly');
      const req = tx.objectStore(IMG_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /* ===== IMAGE COMPRESSION ===== */
  function compressImage(file, maxWidth) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.82);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function blobToURL(blob) {
    return blob ? URL.createObjectURL(blob) : '';
  }

  /* ===== PASSWORD ===== */
  async function hashPassword(pwd) {
    const data = new TextEncoder().encode(pwd + '_jt_auto_salt');
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function getStoredHash() {
    let h = localStorage.getItem(STORAGE.password);
    if (!h) { h = await hashPassword(DEFAULT_PASSWORD); localStorage.setItem(STORAGE.password, h); }
    return h;
  }

  async function login(pwd) {
    if (await hashPassword(pwd) === await getStoredHash()) {
      sessionStorage.setItem(STORAGE.session, '1');
      return true;
    }
    return false;
  }

  function isLoggedIn() { return sessionStorage.getItem(STORAGE.session) === '1'; }
  function logout() { sessionStorage.removeItem(STORAGE.session); location.reload(); }

  /* ===== DATA ===== */
  function getData(k) { try { const d = localStorage.getItem(k); return d ? JSON.parse(d) : null; } catch { return null; } }
  function setData(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function toast(msg, type = '') {
    const el = document.getElementById('admin-toast');
    el.textContent = msg;
    el.className = 'admin-toast visible' + (type ? ' admin-toast--' + type : '');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('visible'), 3000);
  }

  /* ===== VEHICLES DATA ===== */
  function defaultVehicles() {
    return [
      { id:'v790', title:'Mazda CX-5 2.0i Sports-Line', desc:'FULL LED, Navigace, Tažné zařízení, Servisní knížka', price:'459 000 Kč', year:2018, km:'115 000 km', power:'121 kW', fuel:'Benzín', transmission:'Manuál', vin:'JMZKF6W7600665852', image:'assets/images/vehicle-790-mazda-cx5.jpg', gallery:['assets/images/v790-gallery-1.jpg','assets/images/v790-gallery-2.jpg','assets/images/v790-gallery-3.jpg','assets/images/v790-gallery-4.jpg'], status:'Skladem', imageType:'path' },
      { id:'v785', title:'Mazda CX-5 2.0i Kangei', desc:'FULL LED, Navigace, Tempomat, Originální tažné zařízení', price:'485 000 Kč', year:2020, km:'117 000 km', power:'121 kW', fuel:'Benzín', transmission:'Manuál', vin:'JMZKF6W7600862686', image:'assets/images/vehicle-785-mazda-cx5.jpg', gallery:['assets/images/v785-gallery-1.jpg','assets/images/v785-gallery-2.jpg','assets/images/v785-gallery-3.jpg','assets/images/v785-gallery-4.jpg'], status:'Skladem', imageType:'path' },
      { id:'v782', title:'Škoda Fabia 1.2 TSI Joy Kombi', desc:'Digitální klima, Tempomat, Vyhřívaná sedadla, Servisní knížka', price:'219 000 Kč', year:2016, km:'100 000 km', power:'66 kW', fuel:'Benzín', transmission:'Manuál', vin:'TMBJM6NJ5GZ197332', image:'assets/images/vehicle-782-skoda-fabia.jpg', gallery:['assets/images/v782-gallery-1.jpg','assets/images/v782-gallery-2.jpg','assets/images/v782-gallery-3.jpg','assets/images/v782-gallery-4.jpg'], status:'Skladem', imageType:'path' }
    ];
  }

  function getVehicles() { return getData(STORAGE.vehicles) || defaultVehicles(); }
  function saveVehicles(v) { setData(STORAGE.vehicles, v); }

  function getHero() {
    return getData(STORAGE.hero) || { title:'Prověřené vozy z\u00a0Německa bez\u00a0starostí', subtitle:'Dovážíme pečlivě vybrané ojeté vozy s\u00a0transparentní historií. Žádné stočené kilometry, žádné skryté vady — jen férový přístup a\u00a0auta, která bychom sami rádi řídili.', btn1Text:'Prohlédnout nabídku', btn2Text:'Jak funguje dovoz', badge:'790+ úspěšně prodaných vozů · 10+ let na trhu' };
  }
  function getContact() {
    return getData(STORAGE.contact) || { name:'Jan Tomášek', phone:'+420 776 210 220', email:'info@jt-auto.cz', address:'Václavská 1114, Chrudim 2, 537 01', showroom:'Dašická 146, Chrudim, 537 01', ico:'74412183', dic:'CZ7906223127' };
  }
  function getStats() {
    return getData(STORAGE.stats) || { vehicles:790, years:10 };
  }

  /* ===== TEMP IMAGE CACHE (for form) ===== */
  let tempMainImage = null;   // { blob, url }
  let tempGallery = [];       // [{ blob, url }]
  let editingVehicleId = null;

  function clearTempImages() {
    if (tempMainImage?.url) URL.revokeObjectURL(tempMainImage.url);
    tempGallery.forEach(g => { if (g.url) URL.revokeObjectURL(g.url); });
    tempMainImage = null;
    tempGallery = [];
    editingVehicleId = null;
  }

  /* ===== RENDER: DASHBOARD ===== */
  function renderDashboard() {
    const v = getVehicles();
    const stock = v.filter(x => x.status === 'Skladem').length;
    const reserved = v.filter(x => x.status === 'Rezervováno').length;
    const sold = v.filter(x => x.status === 'Prodáno').length;

    document.getElementById('dashboard-stats').innerHTML = `
      <div class="stat-card"><div class="stat-card__label">Celkem v nabídce</div><div class="stat-card__value">${v.length - sold}</div></div>
      <div class="stat-card"><div class="stat-card__label">Skladem</div><div class="stat-card__value" style="color:var(--admin-success)">${stock}</div></div>
      <div class="stat-card"><div class="stat-card__label">Rezervováno</div><div class="stat-card__value" style="color:var(--admin-warning)">${reserved}</div></div>
      <div class="stat-card"><div class="stat-card__label">Prodáno</div><div class="stat-card__value" style="color:var(--admin-text-muted)">${sold}</div></div>
    `;
  }

  /* ===== RENDER: VEHICLE LIST ===== */
  async function renderVehicleList() {
    const vehicles = getVehicles();
    const active = vehicles.filter(v => v.status !== 'Prodáno');
    const sold = vehicles.filter(v => v.status === 'Prodáno');

    const listActive = document.getElementById('vehicle-list-active');
    const listSold = document.getElementById('vehicle-list-sold');
    const soldCount = document.getElementById('sold-count');

    if (soldCount) soldCount.textContent = sold.length;

    // Active vehicles
    if (!active.length) {
      listActive.innerHTML = '<div class="admin-empty"><p>Žádná vozidla v nabídce.</p><button class="admin-btn admin-btn--primary" onclick="Admin.openVehicleModal()">Přidat první vůz</button></div>';
    } else {
      listActive.innerHTML = '';
      for (const v of active) {
        const imgUrl = await getVehicleImageUrl(v);
        listActive.innerHTML += vehicleItemHtml(v, imgUrl, false);
      }
    }

    // Sold vehicles
    if (!sold.length) {
      listSold.innerHTML = '<div class="admin-empty"><p>Zatím žádná prodaná vozidla.</p></div>';
    } else {
      listSold.innerHTML = '';
      for (const v of sold) {
        const imgUrl = await getVehicleImageUrl(v);
        listSold.innerHTML += vehicleItemHtml(v, imgUrl, true);
      }
    }
  }

  async function getVehicleImageUrl(v) {
    if (v.imageType === 'db') {
      const blob = await getImage(v.id + '_main');
      return blob ? blobToURL(blob) : '';
    }
    return v.image || '';
  }

  function vehicleItemHtml(v, imgUrl, isSold) {
    const statusColors = { 'Skladem':'var(--admin-success)', 'Rezervováno':'var(--admin-warning)', 'Prodáno':'var(--admin-text-muted)' };
    const statusColor = statusColors[v.status] || 'inherit';

    const actions = isSold ? `
      <button class="admin-btn admin-btn--secondary admin-btn--sm" onclick="Admin.restoreVehicle('${v.id}')" title="Vrátit do nabídky">Obnovit</button>
      <button class="admin-btn admin-btn--danger admin-btn--sm admin-btn--icon" onclick="Admin.deleteVehicle('${v.id}')" title="Smazat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    ` : `
      <button class="admin-btn admin-btn--secondary admin-btn--sm" onclick="Admin.editVehicle('${v.id}')">Upravit</button>
      <button class="admin-btn admin-btn--sold admin-btn--sm" onclick="Admin.markAsSold('${v.id}')" title="Označit jako prodané">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
        Prodáno
      </button>
      <button class="admin-btn admin-btn--danger admin-btn--sm admin-btn--icon" onclick="Admin.deleteVehicle('${v.id}')" title="Smazat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    `;

    return `
      <div class="vehicle-item">
        ${imgUrl ? `<img class="vehicle-item__img" src="${esc(imgUrl)}" alt="${esc(v.title)}">` : '<div class="vehicle-item__img vehicle-item__img--empty"></div>'}
        <div class="vehicle-item__info">
          <div class="vehicle-item__title">${esc(v.title)}</div>
          <div class="vehicle-item__meta">${v.year} · ${esc(v.km)} · ${esc(v.fuel)} · <span style="color:${statusColor};font-weight:600">${esc(v.status)}</span>${v.soldDate ? ' · ' + v.soldDate : ''}</div>
        </div>
        <div class="vehicle-item__price">${esc(v.price)}</div>
        <div class="vehicle-item__actions">${actions}</div>
      </div>
    `;
  }

  /* ===== MARK AS SOLD ===== */
  function markAsSold(id) {
    if (!confirm('Označit tento vůz jako prodaný? Bude přesunut do archivu.')) return;
    const vehicles = getVehicles();
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    v.status = 'Prodáno';
    v.soldDate = new Date().toLocaleDateString('cs-CZ');
    saveVehicles(vehicles);
    renderVehicleList();
    renderDashboard();
    toast('Vůz označen jako prodaný a přesunut do archivu', 'success');
  }

  function restoreVehicle(id) {
    if (!confirm('Vrátit tento vůz zpět do nabídky?')) return;
    const vehicles = getVehicles();
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    v.status = 'Skladem';
    delete v.soldDate;
    saveVehicles(vehicles);
    renderVehicleList();
    renderDashboard();
    toast('Vůz vrácen do nabídky', 'success');
  }

  /* ===== VEHICLE MODAL ===== */
  async function openVehicleModal(vehicleId) {
    clearTempImages();
    const modal = document.getElementById('vehicle-modal');
    const form = document.getElementById('vehicle-form');
    form.reset();

    document.getElementById('main-img-preview').innerHTML = '';
    document.getElementById('gallery-preview').innerHTML = '';
    document.getElementById('main-img-input').value = '';
    document.getElementById('gallery-input').value = '';

    if (vehicleId) {
      editingVehicleId = vehicleId;
      const v = getVehicles().find(x => x.id === vehicleId);
      if (!v) return;
      document.getElementById('vehicle-modal-title').textContent = 'Upravit vozidlo';
      document.getElementById('vf-id').value = v.id;
      document.getElementById('vf-title').value = v.title;
      document.getElementById('vf-desc').value = v.desc || '';
      document.getElementById('vf-price').value = v.price;
      document.getElementById('vf-year').value = v.year;
      document.getElementById('vf-km').value = v.km;
      document.getElementById('vf-power').value = v.power;
      document.getElementById('vf-fuel').value = v.fuel;
      document.getElementById('vf-transmission').value = v.transmission || 'Manuál';
      document.getElementById('vf-vin').value = v.vin || '';
      document.getElementById('vf-status').value = v.status || 'Skladem';

      // Load existing main image
      if (v.imageType === 'db') {
        const blob = await getImage(v.id + '_main');
        if (blob) {
          const url = blobToURL(blob);
          tempMainImage = { blob, url, existing: true };
          document.getElementById('main-img-preview').innerHTML = `<div class="upload-preview__item"><img src="${url}" alt="Hlavní foto"><button type="button" class="upload-preview__remove" onclick="Admin.removeMainImage()">&times;</button></div>`;
        }
      } else if (v.image) {
        tempMainImage = { path: v.image, existing: true };
        document.getElementById('main-img-preview').innerHTML = `<div class="upload-preview__item"><img src="${esc(v.image)}" alt="Hlavní foto"><button type="button" class="upload-preview__remove" onclick="Admin.removeMainImage()">&times;</button></div>`;
      }

      // Load existing gallery
      if (v.imageType === 'db') {
        const galleryCount = v.galleryCount || 0;
        for (let i = 0; i < galleryCount; i++) {
          const blob = await getImage(v.id + '_gallery_' + i);
          if (blob) {
            const url = blobToURL(blob);
            tempGallery.push({ blob, url, existing: true, idx: i });
          }
        }
      } else if (v.gallery?.length) {
        v.gallery.forEach((src, i) => {
          tempGallery.push({ path: src, existing: true, idx: i });
        });
      }
      renderGalleryPreview();

    } else {
      editingVehicleId = null;
      document.getElementById('vehicle-modal-title').textContent = 'Přidat vozidlo';
      document.getElementById('vf-id').value = '';
    }

    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeVehicleModal() {
    document.getElementById('vehicle-modal').classList.remove('visible');
    document.body.style.overflow = '';
    clearTempImages();
  }

  function removeMainImage() {
    if (tempMainImage?.url) URL.revokeObjectURL(tempMainImage.url);
    tempMainImage = null;
    document.getElementById('main-img-preview').innerHTML = '';
    document.getElementById('main-img-input').value = '';
  }

  function removeGalleryImage(idx) {
    if (tempGallery[idx]?.url) URL.revokeObjectURL(tempGallery[idx].url);
    tempGallery.splice(idx, 1);
    renderGalleryPreview();
  }

  function renderGalleryPreview() {
    const container = document.getElementById('gallery-preview');
    container.innerHTML = tempGallery.map((g, i) => {
      const src = g.url || g.path || '';
      return `<div class="upload-preview__item"><img src="${esc(src)}" alt="Galerie ${i+1}"><button type="button" class="upload-preview__remove" onclick="Admin.removeGalleryImage(${i})">&times;</button></div>`;
    }).join('');
  }

  /* ===== FILE UPLOAD HANDLERS ===== */
  function handleMainImageUpload(files) {
    if (!files.length) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) { toast('Vyberte obrázek', 'error'); return; }

    compressImage(file, MAX_IMG_WIDTH).then(blob => {
      if (tempMainImage?.url) URL.revokeObjectURL(tempMainImage.url);
      const url = blobToURL(blob);
      tempMainImage = { blob, url };
      document.getElementById('main-img-preview').innerHTML = `<div class="upload-preview__item"><img src="${url}" alt="Hlavní foto"><button type="button" class="upload-preview__remove" onclick="Admin.removeMainImage()">&times;</button></div>`;
    });
  }

  function handleGalleryUpload(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      compressImage(file, MAX_IMG_WIDTH).then(blob => {
        const url = blobToURL(blob);
        tempGallery.push({ blob, url });
        renderGalleryPreview();
      });
    });
  }

  /* ===== SAVE VEHICLE ===== */
  async function saveVehicleFromForm() {
    const id = document.getElementById('vf-id').value || 'v' + Date.now();
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
      status: document.getElementById('vf-status').value,
      imageType: 'path',
      image: '',
      gallery: [],
      galleryCount: 0
    };

    // Save main image
    if (tempMainImage) {
      if (tempMainImage.blob) {
        await saveImage(id + '_main', tempMainImage.blob);
        vehicle.imageType = 'db';
        vehicle.image = '';
      } else if (tempMainImage.path) {
        vehicle.image = tempMainImage.path;
        vehicle.imageType = 'path';
      }
    }

    // Save gallery images
    if (tempGallery.length) {
      let hasBlobs = false;
      for (let i = 0; i < tempGallery.length; i++) {
        const g = tempGallery[i];
        if (g.blob) {
          await saveImage(id + '_gallery_' + i, g.blob);
          hasBlobs = true;
        } else if (g.path) {
          vehicle.gallery.push(g.path);
        }
      }
      if (hasBlobs) {
        vehicle.imageType = 'db';
        vehicle.galleryCount = tempGallery.length;
      }
    }

    // If we had db images before editing but now imageType is path, keep db
    if (tempMainImage?.blob || tempGallery.some(g => g.blob)) {
      vehicle.imageType = 'db';
      vehicle.galleryCount = tempGallery.length;
    }

    const vehicles = getVehicles();
    const idx = vehicles.findIndex(v => v.id === id);
    if (idx >= 0) {
      // Preserve soldDate if exists
      if (vehicles[idx].soldDate) vehicle.soldDate = vehicles[idx].soldDate;
      vehicles[idx] = vehicle;
    } else {
      vehicles.unshift(vehicle);
    }

    saveVehicles(vehicles);
    closeVehicleModal();
    renderVehicleList();
    renderDashboard();
    toast('Vozidlo uloženo', 'success');
  }

  async function deleteVehicle(id) {
    if (!confirm('Opravdu smazat toto vozidlo? Tato akce je nevratná.')) return;
    const vehicles = getVehicles().filter(v => v.id !== id);
    saveVehicles(vehicles);

    // Clean up images from IndexedDB
    const keys = await getAllImageKeys();
    for (const key of keys) {
      if (key.startsWith(id + '_')) await deleteImage(key);
    }

    renderVehicleList();
    renderDashboard();
    toast('Vozidlo smazáno', 'success');
  }

  /* ===== FORMS ===== */
  function initHeroForm() {
    const d = getHero();
    document.getElementById('hero-title').value = d.title;
    document.getElementById('hero-subtitle').value = d.subtitle;
    document.getElementById('hero-btn1-text').value = d.btn1Text;
    document.getElementById('hero-btn2-text').value = d.btn2Text;
    document.getElementById('hero-badge').value = d.badge;
  }

  function saveHeroForm() {
    setData(STORAGE.hero, {
      title: document.getElementById('hero-title').value.trim(),
      subtitle: document.getElementById('hero-subtitle').value.trim(),
      btn1Text: document.getElementById('hero-btn1-text').value.trim(),
      btn2Text: document.getElementById('hero-btn2-text').value.trim(),
      badge: document.getElementById('hero-badge').value.trim()
    });
    toast('Hero sekce uložena', 'success');
  }

  function initContactForm() {
    const d = getContact();
    document.getElementById('contact-name').value = d.name;
    document.getElementById('contact-phone').value = d.phone;
    document.getElementById('contact-email').value = d.email;
    document.getElementById('contact-address').value = d.address;
    document.getElementById('contact-showroom').value = d.showroom;
    document.getElementById('contact-ico').value = d.ico;
    document.getElementById('contact-dic').value = d.dic;
  }

  function saveContactForm() {
    setData(STORAGE.contact, {
      name: document.getElementById('contact-name').value.trim(),
      phone: document.getElementById('contact-phone').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      address: document.getElementById('contact-address').value.trim(),
      showroom: document.getElementById('contact-showroom').value.trim(),
      ico: document.getElementById('contact-ico').value.trim(),
      dic: document.getElementById('contact-dic').value.trim()
    });
    toast('Kontaktní údaje uloženy', 'success');
  }

  function initStatsForm() {
    const d = getStats();
    document.getElementById('stat-vehicles').value = d.vehicles;
    document.getElementById('stat-years').value = d.years;
  }

  function saveStatsForm() {
    setData(STORAGE.stats, {
      vehicles: parseInt(document.getElementById('stat-vehicles').value) || 790,
      years: parseInt(document.getElementById('stat-years').value) || 10
    });
    toast('Statistiky uloženy', 'success');
  }

  /* ===== PASSWORD ===== */
  async function changePassword() {
    const cur = document.getElementById('current-password').value;
    const pwd = document.getElementById('new-password').value;
    const cfm = document.getElementById('confirm-password').value;
    if (pwd !== cfm) { toast('Hesla se neshodují', 'error'); return; }
    if (pwd.length < 3) { toast('Heslo musí mít alespoň 3 znaky', 'error'); return; }
    if (await hashPassword(cur) !== await getStoredHash()) { toast('Současné heslo je nesprávné', 'error'); return; }
    localStorage.setItem(STORAGE.password, await hashPassword(pwd));
    document.getElementById('password-form').reset();
    toast('Heslo změněno', 'success');
  }

  /* ===== EXPORT / IMPORT ===== */
  async function exportData() {
    const data = { vehicles: getVehicles(), hero: getHero(), contact: getContact(), stats: getStats(), exportDate: new Date().toISOString() };

    // Export images as base64
    const keys = await getAllImageKeys();
    const images = {};
    for (const key of keys) {
      const blob = await getImage(key);
      if (blob) {
        images[key] = await new Promise(r => {
          const reader = new FileReader();
          reader.onload = () => r(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    }
    data.images = images;

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jt-auto-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Data exportována (včetně obrázků)', 'success');
  }

  async function importData(file) {
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (data.vehicles) setData(STORAGE.vehicles, data.vehicles);
      if (data.hero) setData(STORAGE.hero, data.hero);
      if (data.contact) setData(STORAGE.contact, data.contact);
      if (data.stats) setData(STORAGE.stats, data.stats);

      // Import images
      if (data.images) {
        for (const [key, dataUrl] of Object.entries(data.images)) {
          const resp = await fetch(dataUrl);
          const blob = await resp.blob();
          await saveImage(key, blob);
        }
      }

      renderAll();
      toast('Data importována', 'success');
    } catch { toast('Chyba při čtení souboru', 'error'); }
  }

  async function resetAllData() {
    if (!confirm('Opravdu smazat VŠECHNA data?')) return;
    if (!confirm('Jste si jisti? Budou smazána všechna vozidla včetně obrázků.')) return;
    Object.values(STORAGE).forEach(k => { if (k !== STORAGE.password && k !== STORAGE.session) localStorage.removeItem(k); });
    // Clear IndexedDB
    const keys = await getAllImageKeys();
    for (const key of keys) await deleteImage(key);
    renderAll();
    toast('Všechna data smazána', 'success');
  }

  /* ===== NAVIGATION ===== */
  const titles = { dashboard:'Přehled', vehicles:'Vozidla', hero:'Hero sekce', contact:'Kontakt', stats:'Statistiky', settings:'Nastavení' };

  function showSection(name) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-nav__item').forEach(b => b.classList.remove('active'));
    document.getElementById('sec-' + name)?.classList.add('active');
    document.querySelector(`[data-section="${name}"]`)?.classList.add('active');
    document.getElementById('section-title').textContent = titles[name] || name;
    document.getElementById('admin-sidebar').classList.remove('is-open');
    document.getElementById('sidebar-overlay').classList.remove('visible');
  }

  /* ===== DRAG & DROP ===== */
  function setupDropZone(el, handler) {
    ['dragenter','dragover'].forEach(e => el.addEventListener(e, (ev) => { ev.preventDefault(); el.classList.add('drag-over'); }));
    ['dragleave','drop'].forEach(e => el.addEventListener(e, () => el.classList.remove('drag-over')));
    el.addEventListener('drop', (ev) => { ev.preventDefault(); handler(ev.dataTransfer.files); });
  }

  /* ===== RENDER ALL ===== */
  function renderAll() {
    renderDashboard();
    renderVehicleList();
    initHeroForm();
    initContactForm();
    initStatsForm();
  }

  /* ===== INIT ===== */
  async function init() {
    await openDB();

    const loginScreen = document.getElementById('login-screen');
    const layout = document.getElementById('admin-layout');

    if (isLoggedIn()) {
      loginScreen.style.display = 'none';
      layout.hidden = false;
      renderAll();
    }

    // Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (await login(document.getElementById('login-password').value)) {
        loginScreen.style.display = 'none';
        layout.hidden = false;
        renderAll();
      } else {
        document.getElementById('login-error').classList.add('visible');
      }
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', logout);

    // Nav
    document.querySelectorAll('.admin-nav__item').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));

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
    document.getElementById('vehicle-modal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeVehicleModal(); });
    document.getElementById('vehicle-form').addEventListener('submit', (e) => { e.preventDefault(); saveVehicleFromForm(); });

    // File uploads
    const mainInput = document.getElementById('main-img-input');
    mainInput.addEventListener('change', (e) => handleMainImageUpload(e.target.files));
    const galleryInput = document.getElementById('gallery-input');
    galleryInput.addEventListener('change', (e) => handleGalleryUpload(e.target.files));

    // Drag & drop zones
    const mainZone = document.getElementById('main-img-zone');
    const galleryZone = document.getElementById('gallery-zone');
    if (mainZone) setupDropZone(mainZone, handleMainImageUpload);
    if (galleryZone) setupDropZone(galleryZone, handleGalleryUpload);

    // Forms
    document.getElementById('hero-form').addEventListener('submit', (e) => { e.preventDefault(); saveHeroForm(); });
    document.getElementById('contact-form').addEventListener('submit', (e) => { e.preventDefault(); saveContactForm(); });
    document.getElementById('stats-form').addEventListener('submit', (e) => { e.preventDefault(); saveStatsForm(); });
    document.getElementById('password-form').addEventListener('submit', (e) => { e.preventDefault(); changePassword(); });

    // Data management
    document.getElementById('btn-export').addEventListener('click', exportData);
    document.getElementById('btn-import').addEventListener('change', (e) => { if (e.target.files[0]) importData(e.target.files[0]); });
    document.getElementById('btn-reset-data').addEventListener('click', resetAllData);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { showSection, openVehicleModal, editVehicle: openVehicleModal, deleteVehicle, markAsSold, restoreVehicle, removeMainImage, removeGalleryImage, handleMainImageUpload, handleGalleryUpload };
})();
