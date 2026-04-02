/* ============================================================
   Genesis Mobile: The Sovereign Shield — app.js
   WebRTC Mesh Simulation, RWL Credits, Sovereign Identity,
   Offline Ledger, SDG Node Switching
   ============================================================ */

'use strict';

/* ── Constants ── */
const DB_NAME     = 'genesis-mobile';
const DB_VERSION  = 2;
const STORE_CREDITS = 'credits';
const STORE_LEDGER  = 'ledger';
const STORE_PEERS   = 'peers';
const STORE_LERR    = 'lerr-cache';

/* ── SDG Pantheon Definition ── */
const PANTHEON = [
  { id: 'cassai',    name: 'CassAi',     emoji: '💰', sdg: 1,  title: 'No Poverty',              color: '#f0c040', rgb: '240,192,64',  panel: 'panel-cassai' },
  { id: 'odin',      name: 'Odin',        emoji: '🌾', sdg: 2,  title: 'Zero Hunger',             color: '#f97316', rgb: '249,115,22',  panel: 'panel-odin' },
  { id: 'aesir',     name: 'Aesir',       emoji: '⚕️', sdg: 3,  title: 'Good Health',             color: '#10b981', rgb: '16,185,129',  panel: 'panel-aesir' },
  { id: 'kong',      name: 'Kong',        emoji: '🧠', sdg: 4,  title: 'Quality Education',       color: '#7c3aed', rgb: '124,58,237',  panel: 'panel-kong' },
  { id: 'freya',     name: 'Freya',       emoji: '⚖️', sdg: 5,  title: 'Gender Equality',         color: '#ec4899', rgb: '236,72,153',  panel: 'panel-freya' },
  { id: 'poseidon',  name: 'Poseidon',    emoji: '💧', sdg: 6,  title: 'Clean Water',             color: '#0ea5e9', rgb: '14,165,233',  panel: 'panel-placeholder' },
  { id: 'helios',    name: 'Helios',      emoji: '☀️', sdg: 7,  title: 'Affordable Energy',       color: '#eab308', rgb: '234,179,8',   panel: 'panel-helios' },
  { id: 'hephaestus',name: 'Hephaestus', emoji: '⚙️', sdg: 8,  title: 'Decent Work',             color: '#f97316', rgb: '249,115,22',  panel: 'panel-placeholder' },
  { id: 'prometheus',name: 'Prometheus', emoji: '🔥', sdg: 9,  title: 'Industry & Innovation',   color: '#ef4444', rgb: '239,68,68',   panel: 'panel-placeholder' },
  { id: 'themis',    name: 'Themis',      emoji: '🏛️', sdg: 10, title: 'Reduced Inequalities',    color: '#a855f7', rgb: '168,85,247',  panel: 'panel-placeholder' },
  { id: 'athena',    name: 'Athena',      emoji: '🦉', sdg: 11, title: 'Sustainable Cities',      color: '#6366f1', rgb: '99,102,241',  panel: 'panel-athena' },
  { id: 'gaia',      name: 'Gaia',        emoji: '♻️', sdg: 12, title: 'Responsible Consumption', color: '#22c55e', rgb: '34,197,94',   panel: 'panel-placeholder' },
  { id: 'iris',      name: 'Iris',        emoji: '🌍', sdg: 13, title: 'Climate Action',          color: '#00e5ff', rgb: '0,229,255',   panel: 'panel-iris' },
  { id: 'nereid',    name: 'Nereid',      emoji: '🐋', sdg: 14, title: 'Life Below Water',        color: '#0369a1', rgb: '3,105,161',   panel: 'panel-placeholder' },
  { id: 'artemis',   name: 'Artemis',     emoji: '🌿', sdg: 15, title: 'Life on Land',            color: '#16a34a', rgb: '22,163,74',   panel: 'panel-placeholder' },
  { id: 'maat',      name: 'Maat',        emoji: '⚖️', sdg: 16, title: 'Peace & Justice',         color: '#c084fc', rgb: '192,132,252', panel: 'panel-placeholder' },
  { id: 'hermes',    name: 'Hermes',      emoji: '🤝', sdg: 17, title: 'Partnerships',            color: '#38bdf8', rgb: '56,189,248',  panel: 'panel-placeholder' },
];

/* ── App State ── */
const state = {
  db:            null,
  identity:      null,    // { did, publicKey, publicKeyJwk, privateKeyJwk, algorithm, createdAt }
  meshActive:    false,
  peers:         [],
  rwlBalance:    0,
  pendingCredits:[],
  isOnline:      navigator.onLine,
  activeNode:    null,
  meshAnimFrame: null,
  meshNodes:     [],
  meshEdges:     [],
  sessionStart:  Date.now(),
  lerrStats:     { totalQueries: 0, localHits: 0, cacheHits: 0 },
};

/* ── IndexedDB Setup ── */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_CREDITS)) {
        db.createObjectStore(STORE_CREDITS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_LEDGER)) {
        db.createObjectStore(STORE_LEDGER, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_PEERS)) {
        db.createObjectStore(STORE_PEERS, { keyPath: 'peerId' });
      }
      if (!db.objectStoreNames.contains(STORE_LERR)) {
        db.createObjectStore(STORE_LERR, { keyPath: 'key' });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function dbPut(store, record) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function dbGetAll(store) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/* ── Crypto Utilities ── */
function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

/* ── Sovereign Identity (real SubtleCrypto ECDSA P-256) ── */
async function generateCryptoIdentity() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  const pubJwk  = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  // DID derived from the public x-coordinate (first 22 chars of base64url)
  const did = `did:genesis:${pubJwk.x.slice(0, 22)}`;

  return {
    did,
    publicKey:     pubJwk.x,        // base64url x-coordinate for display
    publicKeyJwk:  pubJwk,
    privateKeyJwk: privJwk,
    algorithm:     'ECDSA-P256',
    createdAt:     new Date().toISOString(),
  };
}

async function signCredit(credit) {
  if (!state.identity || !state.identity.privateKeyJwk) return null;
  try {
    const privKey = await crypto.subtle.importKey(
      'jwk', state.identity.privateKeyJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false, ['sign']
    );
    const payload = new TextEncoder().encode(
      JSON.stringify({ label: credit.label, amount: credit.amount, timestamp: credit.timestamp })
    );
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, payload);
    return bufToBase64(sig);
  } catch {
    return null;
  }
}

function loadIdentity() {
  const raw = localStorage.getItem('genesis-identity');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveIdentity(identity) {
  localStorage.setItem('genesis-identity', JSON.stringify(identity));
}

async function initIdentity(passphrase) {
  if (!passphrase || passphrase.trim().length < 8) {
    showToast('Passphrase must be at least 8 characters.', 'error');
    return;
  }
  const identity = await generateCryptoIdentity();
  saveIdentity(identity);
  state.identity = identity;
  renderIdentity();
  updateDIDDisplays();
  showToast('🛡️ Sovereign Identity created!', 'success');
  awardCredit({ label: 'Identity Established', amount: 100, type: 'genesis', icon: '🛡️' });
}

/* ── RWL Credits ── */
async function awardCredit({ label, amount, type, icon }) {
  const timestamp = Date.now();
  const entry = {
    label,
    amount,
    type,
    icon:      icon || '⭐',
    timestamp,
    synced:    state.isOnline,
    pending:   !state.isOnline,
  };
  entry.signature = await signCredit(entry);
  if (!state.isOnline) {
    state.pendingCredits.push(entry);
    localStorage.setItem('genesis-pending', JSON.stringify(state.pendingCredits));
    entry.pending = true;
  }
  await dbPut(STORE_CREDITS, entry);
  state.rwlBalance += amount;
  localStorage.setItem('genesis-balance', state.rwlBalance);
  renderCreditsTab();
  updateBalanceDisplays();
  showToast(`+${amount} RWL — ${label}`, 'success');
}

async function loadCredits() {
  const credits = await dbGetAll(STORE_CREDITS);
  state.rwlBalance = parseInt(localStorage.getItem('genesis-balance') || '0', 10);
  return credits.sort((a, b) => b.timestamp - a.timestamp);
}

async function syncLedger() {
  if (!state.isOnline || state.pendingCredits.length === 0) return;
  const pending = [...state.pendingCredits];
  for (const entry of pending) {
    entry.synced = true;
    entry.pending = false;
    await dbPut(STORE_CREDITS, entry);
  }
  state.pendingCredits = [];
  localStorage.removeItem('genesis-pending');
  renderCreditsTab();
  showToast('📡 Ledger synced to mesh!', 'info');
}

/* ── Mesh / WebRTC Simulation ── */
const PEER_NAMES = ['Anansi', 'Kwame', 'Zara', 'Tunde', 'Amara', 'Kesi', 'Jomo', 'Nia'];
const PEER_EMOJIS = ['👩🏾‍💻','👨🏿‍💻','🧑🏽‍💻','👩🏽‍💻','👨🏾‍💻','🧑🏿‍💻','👩🏿‍💻','👨🏽‍💻'];

function generatePeerId() {
  return 'peer-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

function createSimulatedPeer() {
  const idx = Math.floor(Math.random() * PEER_NAMES.length);
  return {
    peerId:    generatePeerId(),
    name:      PEER_NAMES[idx],
    emoji:     PEER_EMOJIS[idx],
    signal:    Math.floor(Math.random() * 3) + 2,
    latency:   Math.floor(Math.random() * 80) + 10,
    connectedAt: Date.now(),
  };
}

function toggleMesh(active) {
  state.meshActive = active;
  if (active) {
    state.peers = [createSimulatedPeer(), createSimulatedPeer()];
    simulateMeshDiscovery();
    buildMeshNodes();
    startMeshAnimation();
    showToast('🕸️ Mesh handshake initiated…', 'info');
    awardCredit({ label: 'Mesh Node Connected', amount: 25, type: 'mesh', icon: '🕸️' });
  } else {
    state.peers = [];
    stopMeshAnimation();
    clearMeshCanvas();
    showToast('Mesh disconnected.', 'warning');
  }
  updateMeshUI();
}

function simulateMeshDiscovery() {
  let added = 0;
  const interval = setInterval(() => {
    if (!state.meshActive || added >= 3) { clearInterval(interval); return; }
    const peer = createSimulatedPeer();
    state.peers.push(peer);
    dbPut(STORE_PEERS, peer);
    updateMeshUI();
    showToast(`🔗 ${peer.name} joined the mesh`, 'info');
    added++;
  }, 2500);
}

function updateMeshUI() {
  const peerList = document.getElementById('peer-list');
  const peerCount = document.getElementById('peer-count');
  const meshStatus = document.getElementById('mesh-status-text');
  if (peerCount)  peerCount.textContent = state.peers.length;
  if (meshStatus) meshStatus.textContent = state.meshActive ? `${state.peers.length} node${state.peers.length !== 1 ? 's' : ''} connected` : 'Offline';

  const dashPeers = document.getElementById('dash-peers');
  if (dashPeers) dashPeers.textContent = state.peers.length;

  if (!peerList) return;
  peerList.innerHTML = '';
  if (state.peers.length === 0) {
    peerList.innerHTML = '<div class="text-dim fs-12" style="padding:16px;text-align:center;">No peers discovered. Activate mesh to begin.</div>';
    return;
  }
  state.peers.forEach(peer => {
    const bars = Array.from({ length: 4 }, (_, i) =>
      `<div class="signal-bar ${i < peer.signal ? 'active' : ''}"></div>`
    ).join('');
    peerList.insertAdjacentHTML('beforeend', `
      <div class="peer-item">
        <div class="peer-avatar">${peer.emoji}</div>
        <div class="peer-info">
          <div class="peer-name">${peer.name}</div>
          <div class="peer-id text-mono">${peer.peerId} · ${peer.latency}ms</div>
        </div>
        <div class="peer-signal">${bars}</div>
      </div>
    `);
  });
  buildMeshNodes();
}

/* ── Canvas Mesh Animation ── */
function buildMeshNodes() {
  const canvas = document.getElementById('mesh-canvas');
  if (!canvas) return;
  const w = canvas.offsetWidth || 340;
  const h = canvas.offsetHeight || 220;
  canvas.width  = w;
  canvas.height = h;
  const cx = w / 2, cy = h / 2;
  const selfNode = { x: cx, y: cy, label: 'YOU', isself: true, vx: 0, vy: 0 };
  const peerNodes = state.peers.map((p, i) => {
    const angle = (2 * Math.PI * i) / state.peers.length;
    const r = Math.min(w, h) * 0.32;
    return {
      x:  cx + r * Math.cos(angle),
      y:  cy + r * Math.sin(angle),
      label: p.name,
      isself: false,
      vx: (Math.random() - .5) * .4,
      vy: (Math.random() - .5) * .4,
    };
  });
  state.meshNodes = [selfNode, ...peerNodes];
  state.meshEdges = peerNodes.map((_, i) => ({ from: 0, to: i + 1 }));
}

function drawMesh() {
  const canvas = document.getElementById('mesh-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const nodes = state.meshNodes;
  if (nodes.length < 2) {
    ctx.fillStyle = 'rgba(80,80,106,.4)';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Activate mesh to visualize', w / 2, h / 2);
    return;
  }

  /* Animate peer nodes */
  const t = Date.now() * 0.001;
  nodes.forEach((n, i) => {
    if (n.isself) return;
    n.x += Math.sin(t * .7 + i * 1.3) * .3;
    n.y += Math.cos(t * .5 + i * 2.1) * .3;
    n.x = Math.max(24, Math.min(w - 24, n.x));
    n.y = Math.max(20, Math.min(h - 20, n.y));
  });

  /* Draw edges */
  state.meshEdges.forEach(e => {
    const a = nodes[e.from], b = nodes[e.to];
    const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    grad.addColorStop(0, 'rgba(240,192,64,.6)');
    grad.addColorStop(.5, 'rgba(0,229,255,.4)');
    grad.addColorStop(1, 'rgba(124,58,237,.5)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -t * 12;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    /* Data packet */
    const progress = (t * .4) % 1;
    const px = a.x + (b.x - a.x) * progress;
    const py = a.y + (b.y - a.y) * progress;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();
  });
  ctx.setLineDash([]);

  /* Draw nodes */
  nodes.forEach(n => {
    /* Glow ring */
    const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 18);
    grd.addColorStop(0, n.isself ? 'rgba(240,192,64,.35)' : 'rgba(124,58,237,.25)');
    grd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(n.x, n.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* Circle */
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.isself ? 12 : 8, 0, Math.PI * 2);
    ctx.fillStyle = n.isself ? '#f0c040' : '#7c3aed';
    ctx.fill();

    /* Label */
    ctx.fillStyle = n.isself ? '#f0c040' : '#e8e8f0';
    ctx.font = `bold ${n.isself ? 10 : 9}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(n.label, n.x, n.y + 22);
  });
}

function startMeshAnimation() {
  function loop() {
    drawMesh();
    state.meshAnimFrame = requestAnimationFrame(loop);
  }
  loop();
}

function stopMeshAnimation() {
  if (state.meshAnimFrame) {
    cancelAnimationFrame(state.meshAnimFrame);
    state.meshAnimFrame = null;
  }
}

function clearMeshCanvas() {
  const canvas = document.getElementById('mesh-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(80,80,106,.4)';
  ctx.font = '12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Mesh offline', canvas.width / 2, canvas.height / 2);
  state.meshNodes = [];
  state.meshEdges = [];
}

/* ── Pantheon / SDG Nodes ── */
function activateNode(nodeId) {
  const node = PANTHEON.find(n => n.id === nodeId);
  if (!node) return;

  state.activeNode = nodeId;

  /* Update grid cards */
  document.querySelectorAll('.node-card').forEach(card => {
    const active = card.dataset.nodeId === nodeId;
    card.classList.toggle('active', active);
    const statusEl = card.querySelector('.node-status');
    if (statusEl) {
      statusEl.textContent = active ? '● ACTIVE' : '';
      statusEl.className = 'node-status' + (active ? ' active-label' : '');
    }
  });

  /* Show correct panel */
  document.querySelectorAll('.node-panel').forEach(p => p.classList.remove('active'));
  const panelEl = document.getElementById(node.panel);
  if (panelEl) panelEl.classList.add('active');
  else {
    const placeholder = document.getElementById('panel-placeholder');
    if (placeholder) placeholder.classList.add('active');
  }

  /* Update panel header */
  const hdr = document.getElementById('node-panel-header');
  if (hdr) {
    hdr.innerHTML = `
      <div class="node-panel-icon">${node.emoji}</div>
      <div class="node-panel-info">
        <h3 style="color:${node.color}">${node.name}</h3>
        <p>SDG ${node.sdg} — ${node.title}</p>
      </div>
      <div class="badge badge-gold">ACTIVE</div>
    `;
  }

  /* Refresh environmental data if Iris */
  if (nodeId === 'iris')   refreshEnvData();
  /* Refresh vault if CassAi */
  if (nodeId === 'cassai') refreshVaultData();
  /* Refresh food if Odin */
  if (nodeId === 'odin')   refreshFoodData();
  /* Refresh new full panels */
  if (nodeId === 'aesir')  refreshAesirData();
  if (nodeId === 'freya')  refreshFreyaData();
  if (nodeId === 'helios') refreshHeliosData();
  if (nodeId === 'athena') refreshAthenaData();

  /* LERR: log node access as a local-resolved query */
  lerrQuery(`${nodeId} node`);

  showToast(`${node.emoji} ${node.name} activated — SDG ${node.sdg}`, 'info');
  awardCredit({ label: `${node.name} Node Accessed`, amount: 10, type: 'pantheon', icon: node.emoji });
}

/* ── Iris: Carbon + Battery Dashboard ── */
async function refreshEnvData() {
  const el = document.getElementById('env-metrics');
  if (!el) return;
  el.innerHTML = '<div class="text-dim fs-12" style="padding:12px;text-align:center">Loading…</div>';

  const metrics = [];
  const sessionMins = Math.max(1, Math.round((Date.now() - state.sessionStart) / 60000));

  /* Battery API */
  if ('getBattery' in navigator) {
    try {
      const bat = await navigator.getBattery();
      metrics.push({
        label: `Battery Level ${bat.charging ? '⚡ Charging' : '🔋'}`,
        value: Math.round(bat.level * 100),
        max: 100, unit: '%',
      });
    } catch { /* API unavailable */ }
  }

  /* Session carbon estimates */
  const dataMB     = parseFloat((sessionMins * 0.06 + state.peers.length * 0.02).toFixed(2));
  const p2pCO2     = (dataMB * 0.002).toFixed(4);
  const cloudCO2   = (dataMB * 0.006).toFixed(4);
  const savedCO2   = (dataMB * 0.004).toFixed(4);

  metrics.push(
    { label: 'Session Active',        value: sessionMins,                                    max: 120, unit: 'min' },
    { label: 'Est. Data Used',        value: Math.min(100, Math.round(dataMB * 10)),          max: 100, unit: `${dataMB} MB`,    rawUnit: true },
    { label: 'Mesh CO₂ Cost',         value: Math.min(100, Math.round(parseFloat(p2pCO2)  * 10000)), max: 100, unit: `${p2pCO2} kg CO₂`,   rawUnit: true },
    { label: 'Cloud Equivalent CO₂',  value: Math.min(100, Math.round(parseFloat(cloudCO2) * 10000)), max: 100, unit: `${cloudCO2} kg CO₂`, rawUnit: true, cls: 'warn' },
    { label: '🌱 Carbon Saved',        value: Math.min(100, Math.round(parseFloat(savedCO2) * 10000)), max: 100, unit: `${savedCO2} kg CO₂`, rawUnit: true }
  );

  /* LERR efficiency */
  const { totalQueries, localHits, cacheHits } = state.lerrStats;
  if (totalQueries > 0) {
    const eff = Math.round(((localHits + cacheHits) / totalQueries) * 100);
    metrics.push({ label: 'LERR Cache Efficiency', value: eff, max: 100, unit: '%' });
  }

  el.innerHTML = metrics.map(m => {
    const pct = Math.min(100, Math.round((m.value / m.max) * 100));
    return `
      <div class="metric-row">
        <div class="metric-label">${m.label}</div>
        <div class="metric-bar-wrap"><div class="metric-bar ${m.cls || ''}" style="width:${pct}%"></div></div>
        <div class="metric-value">${m.rawUnit ? m.unit : m.value + ' <span style="font-size:9px;opacity:.6">' + m.unit + '</span>'}</div>
      </div>
    `;
  }).join('');
}

/* ── Aesir (SDG 3) — Health Data ── */
function refreshAesirData() {
  const metrics = [
    { label: 'Community Wellness Score', value: 72, max: 100, unit: '/100' },
    { label: 'Mental Health Reports',    value: 45, max: 100, unit: 'filed' },
    { label: 'Physical Activity Index',  value: 63, max: 100, unit: '%' },
    { label: 'Healthcare Access',        value: 81, max: 100, unit: '%' },
  ];
  const el = document.getElementById('aesir-metrics');
  if (!el) return;
  el.innerHTML = metrics.map(m => {
    const pct = Math.round((m.value / m.max) * 100);
    return `<div class="metric-row">
      <div class="metric-label">${m.label}</div>
      <div class="metric-bar-wrap"><div class="metric-bar" style="width:${pct}%"></div></div>
      <div class="metric-value">${m.value}<span style="font-size:9px;opacity:.6"> ${m.unit}</span></div>
    </div>`;
  }).join('');
}

function logWellness(score, emoji) {
  showToast(`${emoji} Wellness score ${score}/5 logged!`, 'success');
  awardCredit({ label: `Wellness Check-In (${score}/5)`, amount: score * 5, type: 'aesir', icon: emoji });
}

/* ── Freya (SDG 5) — Equality Data ── */
function refreshFreyaData() {
  const metrics = [
    { label: 'Safety Reports This Week', value: 12, max: 50,  unit: 'reports' },
    { label: 'Community Allies Active',  value: 34, max: 100, unit: 'allies' },
    { label: 'Resource Shares',          value: 78, max: 100, unit: '%' },
    { label: 'Equality Audits Filed',    value: 5,  max: 20,  unit: 'audits' },
  ];
  const el = document.getElementById('freya-metrics');
  if (!el) return;
  el.innerHTML = metrics.map(m => {
    const pct = Math.round((m.value / m.max) * 100);
    return `<div class="metric-row">
      <div class="metric-label">${m.label}</div>
      <div class="metric-bar-wrap"><div class="metric-bar" style="width:${pct}%"></div></div>
      <div class="metric-value">${m.value}<span style="font-size:9px;opacity:.6"> ${m.unit}</span></div>
    </div>`;
  }).join('');
}

/* ── Helios (SDG 7) — Energy Data ── */
function refreshHeliosData() {
  const metrics = [
    { label: 'Renewables on Grid',   value: Math.floor(Math.random() * 20) + 55, max: 100, unit: '%' },
    { label: 'Solar Contribution',   value: Math.floor(Math.random() * 15) + 30, max: 100, unit: '%' },
    { label: 'Energy Savings Today', value: Math.floor(Math.random() * 30) + 20, max: 100, unit: 'kWh' },
    { label: 'Carbon Offset',        value: Math.floor(Math.random() * 50) + 40, max: 100, unit: 'kg CO₂' },
  ];
  const el = document.getElementById('helios-metrics');
  if (!el) return;
  el.innerHTML = metrics.map(m => {
    const pct = Math.round((m.value / m.max) * 100);
    return `<div class="metric-row">
      <div class="metric-label">${m.label}</div>
      <div class="metric-bar-wrap"><div class="metric-bar" style="width:${pct}%"></div></div>
      <div class="metric-value">${m.value}<span style="font-size:9px;opacity:.6"> ${m.unit}</span></div>
    </div>`;
  }).join('');
}

/* ── Athena (SDG 11) — Urban Data ── */
function refreshAthenaData() {
  const metrics = [
    { label: 'Infrastructure Reports', value: 23, max: 50,  unit: 'open' },
    { label: 'Active Transport Use',   value: Math.floor(Math.random() * 20) + 60, max: 100, unit: '%' },
    { label: 'Green Space Coverage',   value: Math.floor(Math.random() * 10) + 30, max: 100, unit: '%' },
    { label: 'Shared Spaces Active',   value: 8,  max: 20,  unit: 'spaces' },
  ];
  const el = document.getElementById('athena-metrics');
  if (!el) return;
  el.innerHTML = metrics.map(m => {
    const pct = Math.round((m.value / m.max) * 100);
    return `<div class="metric-row">
      <div class="metric-label">${m.label}</div>
      <div class="metric-bar-wrap"><div class="metric-bar" style="width:${pct}%"></div></div>
      <div class="metric-value">${m.value}<span style="font-size:9px;opacity:.6"> ${m.unit}</span></div>
    </div>`;
  }).join('');
}

/* ── LERR: Local Energy-Efficient Request Resolution (Algoalgo) ── */
const LERR_PATTERNS = [
  { re: /balance|rwl|credit/i,     key: 'balance',   fn: () => ({ balance: state.rwlBalance, pending: state.pendingCredits.length }) },
  { re: /peer|mesh|node count/i,   key: 'peers',     fn: () => ({ peers: state.peers.length, active: state.meshActive }) },
  { re: /identity|did|who am i/i,  key: 'identity',  fn: () => ({ did: state.identity ? state.identity.did : null }) },
  { re: /sdg|pantheon|god|node/i,  key: 'pantheon',  fn: () => ({ count: PANTHEON.length, active: state.activeNode }) },
  { re: /session|time|duration/i,  key: 'session',   fn: () => ({ mins: Math.round((Date.now() - state.sessionStart) / 60000) }) },
];

async function lerrQuery(rawQuery) {
  state.lerrStats.totalQueries++;

  // Phase 1: In-memory pattern match — 0% network cost
  for (const p of LERR_PATTERNS) {
    if (p.re.test(rawQuery)) {
      state.lerrStats.localHits++;
      return { result: p.fn(), source: 'local-memory', energySaved: 100 };
    }
  }

  // Phase 2: IndexedDB cache — 80% energy saved vs cloud
  try {
    const cacheKey = rawQuery.toLowerCase().trim().slice(0, 50);
    const tx  = state.db.transaction(STORE_LERR, 'readonly');
    const req = tx.objectStore(STORE_LERR).get(cacheKey);
    const cached = await new Promise(r => { req.onsuccess = () => r(req.result); req.onerror = () => r(null); });
    if (cached && (Date.now() - cached.ts) < 3_600_000) {
      state.lerrStats.cacheHits++;
      return { result: cached.value, source: 'idb-cache', energySaved: 80 };
    }
  } catch { /* cache unavailable — proceed */ }

  // Phase 3: Cache miss — would go to network; return null (offline-first)
  return { result: null, source: 'cache-miss', energySaved: 0 };
}

async function lerrCacheSet(key, value) {
  if (!state.db) return;
  try {
    const tx = state.db.transaction(STORE_LERR, 'readwrite');
    tx.objectStore(STORE_LERR).put({ key: key.slice(0, 50), value, ts: Date.now() });
  } catch { /* ignore */ }
}

/* ── Real WebRTC P2P (manual SDP exchange, no signalling server) ── */
const RTC_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const rtcPeers   = {};     // peerId → { conn, dc, state }
let   rtcCurrentOffer = null;

function _rtcGatherSDP(pc) {
  return new Promise(resolve => {
    const check = () => {
      if (pc.iceGatheringState === 'complete') {
        resolve(btoa(JSON.stringify({ type: pc.localDescription.type, sdp: pc.localDescription.sdp })));
      }
    };
    pc.onicegatheringstatechange = check;
    pc.onicecandidate = e => { if (!e.candidate) check(); };
    setTimeout(() => {
      if (pc.localDescription) {
        resolve(btoa(JSON.stringify({ type: pc.localDescription.type, sdp: pc.localDescription.sdp })));
      }
    }, 6000);
  });
}

function _setupRTCDataChannel(dc, peerId) {
  dc.onopen = () => {
    const idx  = Math.floor(Math.random() * PEER_NAMES.length);
    const name = PEER_NAMES[idx];
    rtcPeers[peerId].name = name;
    const peer = { peerId, name, emoji: PEER_EMOJIS[idx], signal: 4, latency: 0, connectedAt: Date.now(), realRtc: true };
    state.peers.push(peer);
    dbPut(STORE_PEERS, peer);
    buildMeshNodes();
    updateMeshUI();
    showToast(`🔗 ${name} connected via WebRTC!`, 'success');
    awardCredit({ label: 'Real P2P Connection Established', amount: 50, type: 'mesh', icon: '🔗' });
    dc.send(JSON.stringify({ type: 'ping', t: Date.now() }));
  };
  dc.onclose = () => {
    state.peers = state.peers.filter(p => p.peerId !== peerId);
    delete rtcPeers[peerId];
    buildMeshNodes();
    updateMeshUI();
    showToast('Peer disconnected from mesh.', 'warning');
  };
  dc.onerror = err => console.warn('[Genesis] DataChannel error', err);
  dc.onmessage = e => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'ping') {
        dc.send(JSON.stringify({ type: 'pong', t: msg.t }));
      } else if (msg.type === 'pong') {
        const lat  = Date.now() - msg.t;
        const peer = state.peers.find(p => p.peerId === peerId);
        if (peer) { peer.latency = lat; peer.signal = lat < 50 ? 4 : lat < 100 ? 3 : lat < 200 ? 2 : 1; updateMeshUI(); }
      }
    } catch { /* ignore malformed */ }
  };
}

async function createWebRTCOffer() {
  const peerId = generatePeerId();
  const pc = new RTCPeerConnection(RTC_CONFIG);
  const dc = pc.createDataChannel('genesis-mesh', { ordered: true });
  rtcPeers[peerId] = { conn: pc, dc, state: 'offering' };
  rtcCurrentOffer  = peerId;
  _setupRTCDataChannel(dc, peerId);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return _rtcGatherSDP(pc);
}

async function acceptWebRTCOffer(encodedOffer) {
  const offerData = JSON.parse(atob(encodedOffer));
  const peerId    = generatePeerId();
  const pc        = new RTCPeerConnection(RTC_CONFIG);
  rtcPeers[peerId] = { conn: pc, dc: null, state: 'answering' };
  pc.ondatachannel = e => { rtcPeers[peerId].dc = e.channel; _setupRTCDataChannel(e.channel, peerId); };
  await pc.setRemoteDescription(new RTCSessionDescription(offerData));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return _rtcGatherSDP(pc);
}

async function completeWebRTCConnection(encodedAnswer) {
  if (!rtcCurrentOffer || !rtcPeers[rtcCurrentOffer]) {
    showToast('No pending offer to complete.', 'error');
    return;
  }
  const answerData = JSON.parse(atob(encodedAnswer));
  await rtcPeers[rtcCurrentOffer].conn.setRemoteDescription(new RTCSessionDescription(answerData));
  showToast('🔗 Completing WebRTC handshake…', 'info');
}

/* ── CassAi Vault Data ── */
function refreshVaultData() {
  const balance = state.rwlBalance;
  document.getElementById('vault-rwl-balance')
    && (document.getElementById('vault-rwl-balance').textContent = balance.toLocaleString() + ' RWL');
  document.getElementById('vault-equity')
    && (document.getElementById('vault-equity').textContent = (balance * 0.35).toFixed(0) + ' RWL');
  document.getElementById('vault-reserves')
    && (document.getElementById('vault-reserves').textContent = (balance * 0.45).toFixed(0) + ' RWL');
  document.getElementById('vault-staked')
    && (document.getElementById('vault-staked').textContent = (balance * 0.20).toFixed(0) + ' RWL');
}

/* ── Odin Food Logistics Data ── */
function refreshFoodData() {
  const routes = [
    { from: 'FoodWorX Hub A', to: 'Shelter 12', qty: '340 kg' },
    { from: 'Community Farm', to: 'Outreach Center', qty: '120 kg' },
    { from: 'Surplus Depot', to: 'District 7', qty: '85 kg' },
    { from: 'FoodWorX Hub B', to: 'Family Network', qty: '210 kg' },
  ];
  const el = document.getElementById('food-routes');
  if (!el) return;
  el.innerHTML = routes.map(r => `
    <div class="route-item">
      <div class="route-item-from">${r.from}</div>
      <div class="route-item-arrow">→</div>
      <div class="route-item-to">${r.to}</div>
      <div class="route-item-qty">${r.qty}</div>
    </div>
  `).join('');
}

/* ── UI Renderers ── */
function renderIdentity() {
  const identity = state.identity;
  const setupSection  = document.getElementById('identity-setup');
  const displaySection = document.getElementById('identity-display');
  if (!setupSection || !displaySection) return;

  if (identity) {
    setupSection.style.display  = 'none';
    displaySection.style.display = 'block';
    const didEl = document.getElementById('identity-did');
    if (didEl) didEl.textContent = identity.did;
    const pubEl = document.getElementById('identity-pubkey');
    if (pubEl) pubEl.textContent = identity.publicKey;
    const dateEl = document.getElementById('identity-date');
    if (dateEl) dateEl.textContent = new Date(identity.createdAt).toLocaleDateString();
    const algoEl = document.getElementById('identity-algo');
    if (algoEl) algoEl.textContent = identity.algorithm || 'legacy';
  } else {
    setupSection.style.display  = 'block';
    displaySection.style.display = 'none';
  }
}

function updateDIDDisplays() {
  const did = state.identity ? state.identity.did : 'No identity — go to Identity tab';
  document.querySelectorAll('.did-value').forEach(el => { el.textContent = did; });
}

function updateBalanceDisplays() {
  document.querySelectorAll('.rwl-balance').forEach(el => {
    el.textContent = state.rwlBalance.toLocaleString();
  });
}

async function renderCreditsTab() {
  const credits = await loadCredits();
  const logEl = document.getElementById('credit-log');
  if (!logEl) return;
  if (credits.length === 0) {
    logEl.innerHTML = '<div class="text-dim fs-12" style="padding:16px;text-align:center;">No credits yet. Mint your first RWL!</div>';
    return;
  }
  logEl.innerHTML = credits.slice(0, 50).map(c => `
    <div class="credit-entry ${c.pending ? 'pending' : ''}">
      <div class="credit-icon">${c.icon || '⭐'}</div>
      <div class="credit-info">
        <div class="credit-title">${escHtml(c.label)}</div>
        <div class="credit-meta">${new Date(c.timestamp).toLocaleString()} ${c.pending ? '· <span class="text-gold">Pending sync</span>' : ''} ${c.signature ? '· <span class="text-cyan" title="' + escHtml(c.signature.slice(0, 20)) + '…">🔏 signed</span>' : ''}</div>
      </div>
      <div class="credit-amount">+${c.amount}</div>
    </div>
  `).join('');

  /* Sync banner */
  const banner = document.getElementById('sync-banner');
  if (banner) {
    if (!state.isOnline) {
      banner.className = 'sync-banner offline';
      banner.innerHTML = '🔴 &nbsp;Offline — credits vaulted locally';
    } else if (state.pendingCredits.length > 0) {
      banner.className = 'sync-banner pending';
      banner.innerHTML = `⏳ &nbsp;${state.pendingCredits.length} pending sync — tap Sync to flush`;
    } else {
      banner.className = 'sync-banner synced';
      banner.innerHTML = '✅ &nbsp;Ledger fully synced';
    }
  }
}

function renderPantheonGrid() {
  const grid = document.getElementById('pantheon-grid');
  if (!grid) return;
  grid.innerHTML = PANTHEON.map(node => `
    <div class="node-card" data-node-id="${node.id}"
         style="--node-color:${node.color};--node-rgb:${node.rgb}"
         onclick="activateNode('${node.id}')">
      <div class="node-emoji">${node.emoji}</div>
      <div class="node-name">${node.name}</div>
      <div class="node-sdg">SDG ${node.sdg}</div>
      <div class="node-status"></div>
    </div>
  `).join('');
}

function updateOnlineStatus() {
  state.isOnline = navigator.onLine;
  const bar = document.getElementById('offline-bar');
  if (bar) bar.classList.toggle('visible', !state.isOnline);

  const dot = document.querySelector('.status-dot');
  if (dot) {
    dot.className = 'status-dot ' + (state.isOnline ? (state.meshActive ? 'online' : 'partial') : 'offline');
  }
  const label = document.getElementById('status-label');
  if (label) label.textContent = state.isOnline ? (state.meshActive ? 'MESH LIVE' : 'ONLINE') : 'OFFLINE';

  if (state.isOnline && state.pendingCredits.length > 0) syncLedger();
  renderCreditsTab();
}

/* ── Navigation ── */
function switchTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    const active = t.dataset.tab === tabId;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));

  /* Resize canvas when switching to mesh tab */
  if (tabId === 'mesh') {
    setTimeout(() => {
      const canvas = document.getElementById('mesh-canvas');
      if (canvas) {
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        if (state.meshActive) buildMeshNodes();
        else clearMeshCanvas();
      }
    }, 50);
  }

  if (tabId === 'credits') renderCreditsTab();
  if (tabId === 'identity') renderIdentity();
}

/* ── Toast Notifications ── */
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: '💬', warning: '⚠️' };
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${escHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut .25s ease forwards';
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

/* ── Utility ── */
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!', 'success'));
  } else {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    el.remove();
    showToast('Copied!', 'success');
  }
}

/* ── Boot Sequence ── */
async function boot() {
  /* Open DB */
  state.db = await openDB();

  /* Load identity */
  state.identity = loadIdentity();

  /* Load pending credits */
  const pending = localStorage.getItem('genesis-pending');
  if (pending) {
    try { state.pendingCredits = JSON.parse(pending); } catch { state.pendingCredits = []; }
  }

  /* Load balance */
  state.rwlBalance = parseInt(localStorage.getItem('genesis-balance') || '0', 10);

  /* Build Pantheon grid */
  renderPantheonGrid();

  /* Render identity state */
  renderIdentity();
  updateDIDDisplays();
  updateBalanceDisplays();
  updateOnlineStatus();

  /* Initialize mesh canvas */
  const canvas = document.getElementById('mesh-canvas');
  if (canvas) {
    canvas.width  = canvas.offsetWidth;
    canvas.height = 220;
    clearMeshCanvas();
  }

  /* Load credits for dashboard */
  const credits = await loadCredits();
  const activityEl = document.getElementById('recent-activity');
  if (activityEl) {
    if (credits.length === 0) {
      activityEl.innerHTML = '<div class="text-dim fs-12" style="padding:8px;text-align:center;">No activity yet</div>';
    } else {
      activityEl.innerHTML = credits.slice(0, 3).map(c => `
        <div class="credit-entry" style="margin-bottom:6px">
          <div class="credit-icon">${c.icon || '⭐'}</div>
          <div class="credit-info">
            <div class="credit-title">${escHtml(c.label)}</div>
            <div class="credit-meta">${new Date(c.timestamp).toLocaleString()}</div>
          </div>
          <div class="credit-amount">+${c.amount}</div>
        </div>
      `).join('');
    }
  }

  /* Service worker registration */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('[Genesis] SW registered', reg.scope);
        reg.addEventListener('updatefound', () => {
          showToast('📦 App update available — reload to activate', 'info');
        });
      })
      .catch(err => console.warn('[Genesis] SW registration failed:', err));

    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'LEDGER_SYNC_TRIGGER') syncLedger();
    });
  }

  /* Online/offline events */
  window.addEventListener('online',  updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  /* First-time greeting */
  if (!state.identity) {
    setTimeout(() => showToast('👋 Welcome! Set up your Sovereign Identity to begin.', 'info'), 800);
  } else {
    setTimeout(() => showToast(`🛡️ Welcome back, ${state.identity.did.slice(0, 28)}…`, 'success'), 600);
  }

  /* Periodic mesh heartbeat */
  setInterval(() => {
    if (state.meshActive && state.peers.length > 0) {
      const peer = state.peers[Math.floor(Math.random() * state.peers.length)];
      peer.latency = Math.floor(Math.random() * 80) + 10;
    }
  }, 5000);
}

/* ── Event Wiring (called after DOM ready) ── */
function wireEvents() {
  /* Tab navigation */
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  /* Mesh toggle */
  const meshToggle = document.getElementById('mesh-toggle');
  if (meshToggle) {
    meshToggle.addEventListener('change', e => toggleMesh(e.target.checked));
  }

  /* Mint RWL button */
  const mintBtn = document.getElementById('btn-mint');
  if (mintBtn) {
    mintBtn.addEventListener('click', () => {
      if (!state.identity) { showToast('Set up Sovereign Identity first!', 'error'); return; }
      const types = [
        { label: 'Learning Module Completed', amount: 50, icon: '📚' },
        { label: 'Community Action Verified',  amount: 75, icon: '🤝' },
        { label: 'Mesh Relay Contribution',    amount: 30, icon: '🕸️' },
        { label: 'Environmental Log Submitted',amount: 40, icon: '🌍' },
        { label: 'Peer Review Completed',      amount: 60, icon: '⭐' },
      ];
      const t = types[Math.floor(Math.random() * types.length)];
      awardCredit(t);
    });
  }

  /* Sync ledger button */
  const syncBtn = document.getElementById('btn-sync');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      if (!state.isOnline) { showToast('Cannot sync — offline', 'error'); return; }
      syncLedger();
    });
  }

  /* Identity form submit — async since initIdentity uses SubtleCrypto */
  const identityForm = document.getElementById('identity-form');
  if (identityForm) {
    identityForm.addEventListener('submit', async e => {
      e.preventDefault();
      const pp  = document.getElementById('passphrase-input');
      const btn = identityForm.querySelector('[type="submit"]');
      if (!pp) return;
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating keys…'; }
      try {
        await initIdentity(pp.value);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🛡️ Generate Sovereign Identity'; }
      }
    });
  }

  /* Reset identity */
  const resetBtn = document.getElementById('btn-reset-identity');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('Reset your Sovereign Identity? This cannot be undone.')) return;
      localStorage.removeItem('genesis-identity');
      localStorage.removeItem('genesis-balance');
      localStorage.removeItem('genesis-pending');
      state.identity = null;
      state.rwlBalance = 0;
      state.pendingCredits = [];
      renderIdentity();
      updateDIDDisplays();
      updateBalanceDisplays();
      showToast('Identity reset.', 'warning');
    });
  }

  /* Export identity */
  const exportBtn = document.getElementById('btn-export-identity');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (!state.identity) { showToast('No identity to export', 'error'); return; }
      const keyBox = document.getElementById('key-box');
      if (keyBox) {
        keyBox.textContent = JSON.stringify({
          did:       state.identity.did,
          publicKey: state.identity.publicKey,
          created:   state.identity.createdAt,
        }, null, 2);
        keyBox.parentElement.style.display = 'block';
      }
      showToast('Keys displayed — store safely!', 'warning');
    });
  }

  /* Copy DID buttons */
  document.querySelectorAll('.btn-copy-did').forEach(btn => {
    btn.addEventListener('click', () => {
      const did = state.identity ? state.identity.did : '';
      if (did) copyToClipboard(did);
    });
  });

  /* Refresh env data */
  const envRefresh = document.getElementById('btn-env-refresh');
  if (envRefresh) envRefresh.addEventListener('click', refreshEnvData);

  /* Mental Printer button (Kong) */
  const printerBtn = document.getElementById('btn-mental-printer');
  if (printerBtn) {
    printerBtn.addEventListener('click', () => {
      showToast('🧠 Mental Printer activated — adaptive session started!', 'success');
      awardCredit({ label: 'Mental Printer Session', amount: 35, type: 'kong', icon: '🧠' });
    });
  }

  /* Vault distribute button */
  const vaultBtn = document.getElementById('btn-vault-distribute');
  if (vaultBtn) {
    vaultBtn.addEventListener('click', () => {
      if (state.rwlBalance < 50) { showToast('Insufficient RWL balance', 'error'); return; }
      showToast('💰 Equity distribution initiated via Sovereign Vault', 'success');
      refreshVaultData();
    });
  }

  /* Canvas resize */
  window.addEventListener('resize', () => {
    const canvas = document.getElementById('mesh-canvas');
    if (canvas && document.getElementById('tab-mesh').classList.contains('active')) {
      canvas.width = canvas.offsetWidth;
      if (state.meshActive) buildMeshNodes();
    }
  });

  /* WebRTC manual signaling */
  const createOfferBtn = document.getElementById('btn-create-offer');
  if (createOfferBtn) {
    createOfferBtn.addEventListener('click', async () => {
      createOfferBtn.disabled = true;
      createOfferBtn.textContent = '⏳ Generating…';
      try {
        const encoded = await createWebRTCOffer();
        document.getElementById('webrtc-offer-box').value = encoded;
        document.getElementById('webrtc-offer-section').style.display = 'block';
        showToast('📡 Offer created — share with a peer!', 'success');
      } catch (err) {
        showToast('WebRTC not supported in this browser.', 'error');
        console.error('[Genesis] WebRTC offer error', err);
      } finally {
        createOfferBtn.disabled = false;
        createOfferBtn.textContent = '📡 Create Connection Offer';
      }
    });
  }

  const copyOfferBtn = document.getElementById('btn-copy-offer');
  if (copyOfferBtn) {
    copyOfferBtn.addEventListener('click', () => {
      const val = document.getElementById('webrtc-offer-box').value;
      if (val) copyToClipboard(val);
    });
  }

  const acceptSdpBtn = document.getElementById('btn-accept-sdp');
  if (acceptSdpBtn) {
    acceptSdpBtn.addEventListener('click', async () => {
      const pasted = document.getElementById('webrtc-paste-box').value.trim();
      if (!pasted) { showToast('Paste a peer code first.', 'error'); return; }
      acceptSdpBtn.disabled = true;
      acceptSdpBtn.textContent = '⏳ Connecting…';
      try {
        const decoded = JSON.parse(atob(pasted));
        if (decoded.type === 'offer') {
          const answer = await acceptWebRTCOffer(pasted);
          document.getElementById('webrtc-answer-box').value = answer;
          document.getElementById('webrtc-answer-section').style.display = 'block';
          showToast('✅ Answer generated — send back to initiator!', 'success');
        } else if (decoded.type === 'answer') {
          await completeWebRTCConnection(pasted);
        } else {
          showToast('Invalid peer code format.', 'error');
        }
      } catch (err) {
        showToast('Invalid peer code or WebRTC error.', 'error');
        console.error('[Genesis] WebRTC accept error', err);
      } finally {
        acceptSdpBtn.disabled = false;
        acceptSdpBtn.textContent = '🔗 Connect';
      }
    });
  }

  const copyAnswerBtn = document.getElementById('btn-copy-answer');
  if (copyAnswerBtn) {
    copyAnswerBtn.addEventListener('click', () => {
      const val = document.getElementById('webrtc-answer-box').value;
      if (val) copyToClipboard(val);
    });
  }
}

/* ── DOM Ready ── */
document.addEventListener('DOMContentLoaded', () => {
  wireEvents();
  boot();
});
