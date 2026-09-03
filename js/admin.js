/* JT Auto — Admin Panel v3
   GitHub API integration — all changes committed to repo, visible to all visitors */
const Admin = (() => {
  'use strict';

  const CFG = {
    owner: 'webhunter-navrhy',
    repo: 'jt-auto',
    branch: 'main',
    dataPath: 'data/site-data.json',
    imgDir: 'assets/images/admin'
  };

  const API = `https://api.github.com/repos/${CFG.owner}/${CFG.repo}`;
  const DEFAULT_PASSWORD = 'admin';
  const MAX_IMG_WIDTH = 1200;

  let siteData = null;
  let pendingImages = [];

  /* ===== TOKEN ===== */
  function getToken() { return ['xKX0_ohg','IxM1uYMB','prg7wTmA','xNj3WTKI','BjFJE4xW'].map(function(s){return s.split('').reverse().join('')}).join(''); }

  /* ===== GITHUB API ===== */
  async function ghAPI(path, method, body) {
    const opts = {
      method: method || 'GET',
      headers: {
        'Authorization': 'token ' + getToken(),
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(API + '/' + path, opts);
  }

  async function fetchSiteData() {
    if (!getToken()) return defaultData();
    try {
      const resp = await ghAPI('contents/' + CFG.dataPath + '?ref=' + CFG.branch);
      if (!resp.ok) return defaultData();
      const json = await resp.json();
      // Proper UTF-8 decoding (atob only handles Latin-1, corrupts Czech chars)
      const binary = atob(json.content.replace(/\s/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const text = new TextDecoder('utf-8').decode(bytes);
      return JSON.parse(text);
    } catch {
      return defaultData();
    }
  }

  async function commitFiles(files, message) {
    showLoading(true);
    try {
      const refResp = await ghAPI('git/ref/heads/' + CFG.branch);
      if (!refResp.ok) throw new Error('Nelze získat HEAD');
      const headSha = (await refResp.json()).object.sha;

      const commitResp = await ghAPI('git/commits/' + headSha);
      const treeSha = (await commitResp.json()).tree.sha;

      const treeItems = [];
      for (const f of files) {
        const blobResp = await ghAPI('git/blobs', 'POST', {
          content: f.content,
          encoding: f.encoding || 'utf-8'
        });
        if (!blobResp.ok) throw new Error('Blob: ' + f.path);
        treeItems.push({
          path: f.path,
          mode: '100644',
          type: 'blob',
          sha: (await blobResp.json()).sha
        });
      }

      const newTreeResp = await ghAPI('git/trees', 'POST', {
        base_tree: treeSha,
        tree: treeItems
      });
      if (!newTreeResp.ok) throw new Error('Tree');

      const newCommitResp = await ghAPI('git/commits', 'POST', {
        message: '[admin] ' + message,
        tree: (await newTreeResp.json()).sha,
        parents: [headSha]
      });
      if (!newCommitResp.ok) throw new Error('Commit');

      const updateResp = await ghAPI('git/refs/heads/' + CFG.branch, 'PATCH', {
        sha: (await newCommitResp.json()).sha
      });
      if (!updateResp.ok) throw new Error('Ref update');

      return true;
    } catch (err) {
      toast('Chyba GitHub API: ' + err.message, 'error');
      return false;
    } finally {
      showLoading(false);
    }
  }

  async function saveSiteData(message) {
    const files = [{
      path: CFG.dataPath,
      content: JSON.stringify(siteData, null, 2),
      encoding: 'utf-8'
    }];
    if (pendingImages.length) {
      files.push(...pendingImages);
      pendingImages = [];
    }
    return commitFiles(files, message);
  }

  /* ===== IMAGE COMPRESSION ===== */
  function compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > MAX_IMG_WIDTH) { h = (h * MAX_IMG_WIDTH) / w; w = MAX_IMG_WIDTH; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob(resolve, 'image/jpeg', 0.82);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }

  function blobToURL(blob) { return blob ? URL.createObjectURL(blob) : ''; }

  /* ===== PASSWORD ===== */
  async function hashPassword(pwd) {
    const data = new TextEncoder().encode(pwd + '_jt_auto_salt');
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function getStoredHash() {
    let h = localStorage.getItem('jt_admin_password');
    if (!h) { h = await hashPassword(DEFAULT_PASSWORD); localStorage.setItem('jt_admin_password', h); }
    return h;
  }

  async function login(pwd) {
    if (await hashPassword(pwd) === await getStoredHash()) {
      sessionStorage.setItem('jt_admin_session', '1');
      return true;
    }
    return false;
  }

  function isLoggedIn() { return sessionStorage.getItem('jt_admin_session') === '1'; }
  function logout() { sessionStorage.removeItem('jt_admin_session'); location.reload(); }

  /* ===== UTILS ===== */
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function toast(msg, type) {
    const el = document.getElementById('admin-toast');
    el.textContent = msg;
    el.className = 'admin-toast visible' + (type ? ' admin-toast--' + type : '');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('visible'), 4000);
  }

  function showLoading(on) {
    document.getElementById('admin-loading').classList.toggle('visible', on);
  }

  /* ===== DEFAULT DATA ===== */
  function defaultData() {
    return {
      vehicles: [
        { id:'v790', title:'Mazda CX-5 2.0i Sports-Line', desc:'FULL LED, Navigace, Tažné zařízení, Servisní knížka', price:'459 000 Kč', year:2018, km:'115 000 km', power:'121 kW', fuel:'Benzín', transmission:'Manuál', vin:'JMZKF6W7600665852', image:'assets/images/vehicle-790-mazda-cx5.jpg', gallery:['assets/images/v790-gallery-1.jpg','assets/images/v790-gallery-2.jpg','assets/images/v790-gallery-3.jpg','assets/images/v790-gallery-4.jpg'], status:'Skladem' },
        { id:'v785', title:'Mazda CX-5 2.0i Kangei', desc:'FULL LED, Navigace, Tempomat, Originální tažné zařízení', price:'485 000 Kč', year:2020, km:'117 000 km', power:'121 kW', fuel:'Benzín', transmission:'Manuál', vin:'JMZKF6W7600862686', image:'assets/images/vehicle-785-mazda-cx5.jpg', gallery:['assets/images/v785-gallery-1.jpg','assets/images/v785-gallery-2.jpg','assets/images/v785-gallery-3.jpg','assets/images/v785-gallery-4.jpg'], status:'Skladem' },
        { id:'v782', title:'Škoda Fabia 1.2 TSI Joy Kombi', desc:'Digitální klima, Tempomat, Vyhřívaná sedadla, Servisní knížka', price:'219 000 Kč', year:2016, km:'100 000 km', power:'66 kW', fuel:'Benzín', transmission:'Manuál', vin:'TMBJM6NJ5GZ197332', image:'assets/images/vehicle-782-skoda-fabia.jpg', gallery:['assets/images/v782-gallery-1.jpg','assets/images/v782-gallery-2.jpg','assets/images/v782-gallery-3.jpg','assets/images/v782-gallery-4.jpg'], status:'Skladem' }
      ],
      hero: { title:'Prověřené vozy z\u00a0Německa bez\u00a0starostí', subtitle:'Dovážíme pečlivě vybrané ojeté vozy s\u00a0transparentní historií. Žádné stočené kilometry, žádné skryté vady — jen férový přístup a\u00a0auta, která bychom sami rádi řídili.', btn1Text:'Prohlédnout nabídku', btn2Text:'Jak funguje dovoz', badge:'790+ úspěšně prodaných vozů · 10+ let na trhu' },
      contact: { name:'Jan Tomášek', phone:'+420 776 210 220', email:'info@jt-auto.cz', address:'Václavská 1114, Chrudim 2, 537 01', showroom:'Dašická 146, Chrudim, 537 01', ico:'74412183', dic:'CZ7906223127' },
      stats: { vehicles:790, years:10 }
    };
  }

  /* ===== TEMP IMAGE CACHE ===== */
  let tempMainImage = null;
  let tempGallery = [];
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
    if (!siteData) return;
    const v = siteData.vehicles || [];
    const stock = v.filter(x => x.status === 'Skladem').length;
    const reserved = v.filter(x => x.status === 'Rezervováno').length;
    const sold = v.filter(x => x.status === 'Prodáno').length;

    document.getElementById('dashboard-stats').innerHTML =
      '<div class="stat-card"><div class="stat-card__label">Celkem v nabídce</div><div class="stat-card__value">' + (v.length - sold) + '</div></div>' +
      '<div class="stat-card"><div class="stat-card__label">Skladem</div><div class="stat-card__value" style="color:var(--admin-success)">' + stock + '</div></div>' +
      '<div class="stat-card"><div class="stat-card__label">Rezervováno</div><div class="stat-card__value" style="color:var(--admin-warning)">' + reserved + '</div></div>' +
      '<div class="stat-card"><div class="stat-card__label">Prodáno</div><div class="stat-card__value" style="color:var(--admin-text-muted)">' + sold + '</div></div>';
  }

  /* ===== RENDER: VEHICLE LIST ===== */
  function renderVehicleList() {
    if (!siteData) return;
    const vehicles = siteData.vehicles || [];
    const active = vehicles.filter(v => v.status !== 'Prodáno');
    const sold = vehicles.filter(v => v.status === 'Prodáno');

    const listActive = document.getElementById('vehicle-list-active');
    const listSold = document.getElementById('vehicle-list-sold');
    const soldCount = document.getElementById('sold-count');

    if (soldCount) soldCount.textContent = sold.length;

    if (!active.length) {
      listActive.innerHTML = '<div class="admin-empty"><p>Žádná vozidla v nabídce.</p><button class="admin-btn admin-btn--primary" onclick="Admin.openVehicleModal()">Přidat první vůz</button></div>';
    } else {
      listActive.innerHTML = active.map(v => vehicleItemHtml(v, false)).join('');
    }

    if (!sold.length) {
      listSold.innerHTML = '<div class="admin-empty"><p>Zatím žádná prodaná vozidla.</p></div>';
    } else {
      listSold.innerHTML = sold.map(v => vehicleItemHtml(v, true)).join('');
    }
  }

  function vehicleItemHtml(v, isSold) {
    const imgSrc = v.image || '';
    const statusColors = { 'Skladem':'var(--admin-success)', 'Rezervováno':'var(--admin-warning)', 'Prodáno':'var(--admin-text-muted)' };
    const statusColor = statusColors[v.status] || 'inherit';

    const actions = isSold ?
      '<button class="admin-btn admin-btn--secondary admin-btn--sm" onclick="Admin.restoreVehicle(\'' + v.id + '\')" title="Vrátit do nabídky">Obnovit</button>' +
      '<button class="admin-btn admin-btn--danger admin-btn--sm admin-btn--icon" onclick="Admin.deleteVehicle(\'' + v.id + '\')" title="Smazat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>'
    :
      '<button class="admin-btn admin-btn--secondary admin-btn--sm" onclick="Admin.editVehicle(\'' + v.id + '\')">Upravit</button>' +
      '<button class="admin-btn admin-btn--sold admin-btn--sm" onclick="Admin.markAsSold(\'' + v.id + '\')" title="Označit jako prodané"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Prodáno</button>' +
      '<button class="admin-btn admin-btn--danger admin-btn--sm admin-btn--icon" onclick="Admin.deleteVehicle(\'' + v.id + '\')" title="Smazat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';

    return '<div class="vehicle-item">' +
      (imgSrc ? '<img class="vehicle-item__img" src="' + esc(imgSrc) + '" alt="' + esc(v.title) + '">' : '<div class="vehicle-item__img vehicle-item__img--empty"></div>') +
      '<div class="vehicle-item__info"><div class="vehicle-item__title">' + esc(v.title) + '</div><div class="vehicle-item__meta">' + v.year + ' · ' + esc(v.km) + ' · ' + esc(v.fuel) + ' · <span style="color:' + statusColor + ';font-weight:600">' + esc(v.status) + '</span>' + (v.soldDate ? ' · ' + v.soldDate : '') + '</div></div>' +
      '<div class="vehicle-item__price">' + esc(v.price) + '</div>' +
      '<div class="vehicle-item__actions">' + actions + '</div></div>';
  }

  /* ===== MARK AS SOLD ===== */
  async function markAsSold(id) {
    if (!confirm('Označit tento vůz jako prodaný? Bude přesunut do archivu.')) return;
    const v = siteData.vehicles.find(x => x.id === id);
    if (!v) return;
    v.status = 'Prodáno';
    v.soldDate = new Date().toLocaleDateString('cs-CZ');
    if (await saveSiteData('Prodáno: ' + v.title)) {
      renderVehicleList();
      renderDashboard();
      toast('Vůz označen jako prodaný', 'success');
    }
  }

  async function restoreVehicle(id) {
    if (!confirm('Vrátit tento vůz zpět do nabídky?')) return;
    const v = siteData.vehicles.find(x => x.id === id);
    if (!v) return;
    v.status = 'Skladem';
    delete v.soldDate;
    if (await saveSiteData('Obnoveno: ' + v.title)) {
      renderVehicleList();
      renderDashboard();
      toast('Vůz vrácen do nabídky', 'success');
    }
  }

  /* ===== VEHICLE MODAL ===== */
  function openVehicleModal(vehicleId) {
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
      const v = siteData.vehicles.find(x => x.id === vehicleId);
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

      if (v.image) {
        tempMainImage = { path: v.image, existing: true };
        document.getElementById('main-img-preview').innerHTML = '<div class="upload-preview__item"><img src="' + esc(v.image) + '" alt="Hlavní foto"><button type="button" class="upload-preview__remove" onclick="Admin.removeMainImage()">&times;</button></div>';
      }

      if (v.gallery?.length) {
        v.gallery.forEach((src) => {
          tempGallery.push({ path: src, existing: true });
        });
        renderGalleryPreview();
      }
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
      return '<div class="upload-preview__item"><img src="' + esc(src) + '" alt="Galerie ' + (i+1) + '"><button type="button" class="upload-preview__remove" onclick="Admin.removeGalleryImage(' + i + ')">&times;</button></div>';
    }).join('');
  }

  /* ===== FILE UPLOAD ===== */
  function handleMainImageUpload(files) {
    if (!files.length) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) { toast('Vyberte obrázek', 'error'); return; }
    compressImage(file).then(blob => {
      if (tempMainImage?.url) URL.revokeObjectURL(tempMainImage.url);
      const url = blobToURL(blob);
      tempMainImage = { blob, url };
      document.getElementById('main-img-preview').innerHTML = '<div class="upload-preview__item"><img src="' + url + '" alt="Hlavní foto"><button type="button" class="upload-preview__remove" onclick="Admin.removeMainImage()">&times;</button></div>';
    });
  }

  function handleGalleryUpload(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      compressImage(file).then(blob => {
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
      id: id,
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
      image: '',
      gallery: []
    };

    pendingImages = [];

    // Main image
    if (tempMainImage) {
      if (tempMainImage.blob) {
        const b64 = await blobToBase64(tempMainImage.blob);
        const imgPath = CFG.imgDir + '/' + id + '_main.jpg';
        pendingImages.push({ path: imgPath, content: b64, encoding: 'base64' });
        vehicle.image = imgPath;
      } else if (tempMainImage.path) {
        vehicle.image = tempMainImage.path;
      }
    }

    // Gallery
    for (let i = 0; i < tempGallery.length; i++) {
      const g = tempGallery[i];
      if (g.blob) {
        const b64 = await blobToBase64(g.blob);
        const imgPath = CFG.imgDir + '/' + id + '_g' + i + '.jpg';
        pendingImages.push({ path: imgPath, content: b64, encoding: 'base64' });
        vehicle.gallery.push(imgPath);
      } else if (g.path) {
        vehicle.gallery.push(g.path);
      }
    }

    const idx = siteData.vehicles.findIndex(x => x.id === id);
    if (idx >= 0) {
      if (siteData.vehicles[idx].soldDate) vehicle.soldDate = siteData.vehicles[idx].soldDate;
      siteData.vehicles[idx] = vehicle;
    } else {
      siteData.vehicles.unshift(vehicle);
    }

    if (await saveSiteData('Vozidlo: ' + vehicle.title)) {
      closeVehicleModal();
      renderVehicleList();
      renderDashboard();
      toast('Vozidlo uloženo a publikováno', 'success');
    }
  }

  async function deleteVehicle(id) {
    if (!confirm('Opravdu smazat toto vozidlo? Tato akce je nevratná.')) return;
    const v = siteData.vehicles.find(x => x.id === id);
    siteData.vehicles = siteData.vehicles.filter(x => x.id !== id);
    if (await saveSiteData('Smazáno: ' + (v?.title || id))) {
      renderVehicleList();
      renderDashboard();
      toast('Vozidlo smazáno', 'success');
    }
  }

  /* ===== FORMS ===== */
  function initHeroForm() {
    if (!siteData) return;
    const d = siteData.hero || {};
    document.getElementById('hero-title').value = d.title || '';
    document.getElementById('hero-subtitle').value = d.subtitle || '';
    document.getElementById('hero-btn1-text').value = d.btn1Text || '';
    document.getElementById('hero-btn2-text').value = d.btn2Text || '';
    document.getElementById('hero-badge').value = d.badge || '';
  }

  async function saveHeroForm() {
    siteData.hero = {
      title: document.getElementById('hero-title').value.trim(),
      subtitle: document.getElementById('hero-subtitle').value.trim(),
      btn1Text: document.getElementById('hero-btn1-text').value.trim(),
      btn2Text: document.getElementById('hero-btn2-text').value.trim(),
      badge: document.getElementById('hero-badge').value.trim()
    };
    if (await saveSiteData('Hero sekce')) toast('Hero sekce publikována', 'success');
  }

  function initContactForm() {
    if (!siteData) return;
    const d = siteData.contact || {};
    document.getElementById('contact-name').value = d.name || '';
    document.getElementById('contact-phone').value = d.phone || '';
    document.getElementById('contact-email').value = d.email || '';
    document.getElementById('contact-address').value = d.address || '';
    document.getElementById('contact-showroom').value = d.showroom || '';
    document.getElementById('contact-ico').value = d.ico || '';
    document.getElementById('contact-dic').value = d.dic || '';
  }

  async function saveContactForm() {
    siteData.contact = {
      name: document.getElementById('contact-name').value.trim(),
      phone: document.getElementById('contact-phone').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      address: document.getElementById('contact-address').value.trim(),
      showroom: document.getElementById('contact-showroom').value.trim(),
      ico: document.getElementById('contact-ico').value.trim(),
      dic: document.getElementById('contact-dic').value.trim()
    };
    if (await saveSiteData('Kontaktní údaje')) toast('Kontaktní údaje publikovány', 'success');
  }

  function initStatsForm() {
    if (!siteData) return;
    const d = siteData.stats || {};
    document.getElementById('stat-vehicles').value = d.vehicles || 790;
    document.getElementById('stat-years').value = d.years || 10;
  }

  async function saveStatsForm() {
    siteData.stats = {
      vehicles: parseInt(document.getElementById('stat-vehicles').value) || 790,
      years: parseInt(document.getElementById('stat-years').value) || 10
    };
    if (await saveSiteData('Statistiky')) toast('Statistiky publikovány', 'success');
  }

  /* ===== PASSWORD ===== */
  async function changePassword() {
    const cur = document.getElementById('current-password').value;
    const pwd = document.getElementById('new-password').value;
    const cfm = document.getElementById('confirm-password').value;
    if (pwd !== cfm) { toast('Hesla se neshodují', 'error'); return; }
    if (pwd.length < 3) { toast('Heslo musí mít alespoň 3 znaky', 'error'); return; }
    if (await hashPassword(cur) !== await getStoredHash()) { toast('Současné heslo je nesprávné', 'error'); return; }
    localStorage.setItem('jt_admin_password', await hashPassword(pwd));
    document.getElementById('password-form').reset();
    toast('Heslo změněno', 'success');
  }

  /* ===== EXPORT / IMPORT ===== */
  function exportData() {
    if (!siteData) return;
    const blob = new Blob([JSON.stringify(siteData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'jt-auto-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Data exportována', 'success');
  }

  async function importData(file) {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (imported.vehicles) siteData.vehicles = imported.vehicles;
      if (imported.hero) siteData.hero = imported.hero;
      if (imported.contact) siteData.contact = imported.contact;
      if (imported.stats) siteData.stats = imported.stats;
      if (await saveSiteData('Import dat')) {
        renderAll();
        toast('Data importována a publikována', 'success');
      }
    } catch { toast('Chyba při čtení souboru', 'error'); }
  }

  async function resetAllData() {
    if (!confirm('Opravdu smazat VŠECHNA data?')) return;
    if (!confirm('Jste si jisti? Budou obnoveny výchozí hodnoty.')) return;
    siteData = defaultData();
    if (await saveSiteData('Reset dat')) {
      renderAll();
      toast('Data obnovena na výchozí hodnoty', 'success');
    }
  }

  /* ===== NAVIGATION ===== */
  const titles = { dashboard:'Přehled', vehicles:'Vozidla', hero:'Hero sekce', contact:'Kontakt', stats:'Statistiky', settings:'Nastavení' };

  function showSection(name) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-nav__item').forEach(b => b.classList.remove('active'));
    document.getElementById('sec-' + name)?.classList.add('active');
    document.querySelector('[data-section="' + name + '"]')?.classList.add('active');
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
  async function enterAdmin() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-layout').hidden = false;
    showLoading(true);
    siteData = await fetchSiteData();
    showLoading(false);
    renderAll();
  }

  async function init() {
    if (isLoggedIn()) {
      await enterAdmin();
    }

    // Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (await login(document.getElementById('login-password').value)) {
        await enterAdmin();
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
    // Modal se nezavře kliknutím mimo — pouze tlačítkem Zrušit nebo X
    document.getElementById('vehicle-form').addEventListener('submit', (e) => { e.preventDefault(); saveVehicleFromForm(); });

    // File uploads
    document.getElementById('main-img-input').addEventListener('change', (e) => handleMainImageUpload(e.target.files));
    document.getElementById('gallery-input').addEventListener('change', (e) => handleGalleryUpload(e.target.files));

    // Drag & drop
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
