/**
 * cupidon.js
 * Commande Messenger: Cupidon — Analyseur de compatibilité premium
 *
 * Dépendances: canvas, axios, fs-extra
 * Fonts (optionnel): assets/font/BeVietnamPro.ttf, assets/font/NotoSans-Regular.ttf, assets/font/SerifElegant.ttf
 *
 * Usage:
 *   cupidon                 -> auto selection d'un/une partenaire dans le groupe (selon genre si disponible)
 *   cupidon @mention        -> analyse entre sender et mentionné
 *   cupidon <uid>           -> analyse entre sender et uid
 *
 * Conformité: module.exports.config + onStart({ api, event, args, usersData, threadsData })
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const axios = require('axios');
const { createCanvas, loadImage, registerFont } = require('canvas');

const CACHE_DIR = path.join(__dirname, 'cache', 'cupidon');
const ASSETS_DIR = path.join(__dirname, 'assets');
const FONT_DIR = path.join(ASSETS_DIR, 'font');

const DEFAULT_WIDTH = 1400; // image 1 width
const DEFAULT_HEIGHT = 800; // image 1 height
const CERT_WIDTH = 1200;    // certificate width
const CERT_HEIGHT = 1600;   // certificate height

// Ensure cache exists
fs.ensureDirSync(CACHE_DIR);

// Load fonts if exist; fail silently if not present
const tryRegisterFont = (file, family) => {
  try {
    const p = path.join(FONT_DIR, file);
    if (fs.existsSync(p)) registerFont(p, { family });
  } catch (e) {
    // ignore
  }
};

tryRegisterFont('BeVietnamPro.ttf', 'BeVietnamPro');
tryRegisterFont('NotoSans-Regular.ttf', 'NotoSans');
tryRegisterFont('SerifElegant.ttf', 'SerifElegant');

// Themes: at least 12 rich themes
const THEMES = [
  {
    id: 'sakura',
    name: 'Sakura Dream',
    primary: '#FFB7C5',
    secondary: '#FFF0F6',
    accent: '#FF6B9A',
    text: '#2B1B1F',
    glow: '#FFD7E2',
    gradient: ['#FFEFF4', '#FFD1DF', '#FFB7C5'],
    particles: 'petal',
    border: { color: '#FF9DB5', width: 8, style: 'rounded' },
    hearts: 'soft',
    background: 'radial',
  },
  {
    id: 'purple',
    name: 'Purple Galaxy',
    primary: '#8A5ED3',
    secondary: '#1B0037',
    accent: '#C78CFF',
    text: '#F5F1FF',
    glow: '#B88CFF',
    gradient: ['#1B0037', '#4B2A86', '#8A5ED3'],
    particles: 'stars',
    border: { color: '#C78CFF', width: 8, style: 'ornate' },
    hearts: 'neon',
    background: 'galaxy',
  },
  {
    id: 'ocean',
    name: 'Ocean Love',
    primary: '#2FB3E6',
    secondary: '#062F4F',
    accent: '#71E0FF',
    text: '#021926',
    glow: '#7FE9FF',
    gradient: ['#062F4F', '#0F77A6', '#2FB3E6'],
    particles: 'bubbles',
    border: { color: '#71E0FF', width: 6, style: 'wave' },
    hearts: 'glass',
    background: 'waves',
  },
  {
    id: 'crimson',
    name: 'Crimson Valentine',
    primary: '#D81E5B',
    secondary: '#2E0A0F',
    accent: '#FF6F9A',
    text: '#FFF6F8',
    glow: '#FF92B2',
    gradient: ['#2E0A0F', '#8B0B2A', '#D81E5B'],
    particles: 'sparks',
    border: { color: '#FF6F9A', width: 10, style: 'classic' },
    hearts: 'bold',
    background: 'velvet',
  },
  {
    id: 'sunset',
    name: 'Sunset Romance',
    primary: '#FF8C42',
    secondary: '#2B0B00',
    accent: '#FFD37A',
    text: '#2A1300',
    glow: '#FFC58A',
    gradient: ['#2B0B00', '#FF6038', '#FF8C42'],
    particles: 'flare',
    border: { color: '#FFD37A', width: 6, style: 'filigree' },
    hearts: 'flame',
    background: 'sunburst',
  },
  {
    id: 'golden',
    name: 'Golden Heart',
    primary: '#FFD36E',
    secondary: '#3C2F1F',
    accent: '#FFF3D1',
    text: '#2B1B00',
    glow: '#FFE9A8',
    gradient: ['#3C2F1F', '#B8842A', '#FFD36E'],
    particles: 'gold',
    border: { color: '#FFE9A8', width: 8, style: 'engraved' },
    hearts: 'gilded',
    background: 'marble',
  },
  {
    id: 'emerald',
    name: 'Emerald Love',
    primary: '#2EC4B6',
    secondary: '#052826',
    accent: '#8EFFF1',
    text: '#052826',
    glow: '#6FF0E4',
    gradient: ['#052826', '#0E9B8A', '#2EC4B6'],
    particles: 'leaf',
    border: { color: '#8EFFF1', width: 6, style: 'woven' },
    hearts: 'leafy',
    background: 'foliage',
  },
  {
    id: 'crystal',
    name: 'Crystal Romance',
    primary: '#CBE7FF',
    secondary: '#0E1B2A',
    accent: '#8FD1FF',
    text: '#071428',
    glow: '#C6F0FF',
    gradient: ['#0E1B2A', '#5A9AD9', '#CBE7FF'],
    particles: 'shards',
    border: { color: '#8FD1FF', width: 7, style: 'facet' },
    hearts: 'crystal',
    background: 'frost',
  },
  {
    id: 'rainbow',
    name: 'Rainbow Love',
    primary: '#FF5CA8',
    secondary: '#4B1B4F',
    accent: '#F8FF7F',
    text: '#1C0E18',
    glow: '#FFEE9E',
    gradient: ['#FF5CA8', '#7A5CFF', '#3FD1FF', '#7EFF95'],
    particles: 'confetti',
    border: { color: '#FFFFFF', width: 6, style: 'multicolor' },
    hearts: 'rainbow',
    background: 'spectrum',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Destiny',
    primary: '#0E84FF',
    secondary: '#000617',
    accent: '#7CDBFF',
    text: '#E9F8FF',
    glow: '#91E6FF',
    gradient: ['#000617', '#0E3A74', '#0E84FF'],
    particles: 'nebula',
    border: { color: '#7CDBFF', width: 8, style: 'cosmic' },
    hearts: 'stellar',
    background: 'nebula',
  },
  {
    id: 'roseNoir',
    name: 'Rose Noir',
    primary: '#3C1120',
    secondary: '#000000',
    accent: '#C24B6A',
    text: '#F6EDEB',
    glow: '#4B0F22',
    gradient: ['#000000', '#22060B', '#3C1120'],
    particles: 'smoke',
    border: { color: '#C24B6A', width: 10, style: 'lux' },
    hearts: 'vintage',
    background: 'velvet2',
  },
  {
    id: 'cyber',
    name: 'Cyber Cupid',
    primary: '#00F0FF',
    secondary: '#00121F',
    accent: '#8AFFD6',
    text: '#CFFAFE',
    glow: '#00F4FF',
    gradient: ['#00121F', '#006B95', '#00F0FF'],
    particles: 'grid',
    border: { color: '#8AFFD6', width: 6, style: 'tech' },
    hearts: 'pixel',
    background: 'matrix',
  },
  {
    id: 'midnight',
    name: 'Midnight Love',
    primary: '#0B0F1A',
    secondary: '#111827',
    accent: '#FF7AB6',
    text: '#E6E8EB',
    glow: '#2A2F59',
    gradient: ['#0B0F1A', '#1B2A4A', '#3B3F6B'],
    particles: 'stars2',
    border: { color: '#FF7AB6', width: 7, style: 'shadow' },
    hearts: 'shadow',
    background: 'night',
  },
  {
    id: 'holo',
    name: 'Holographic Love',
    primary: '#9FF7FF',
    secondary: '#1A0B1A',
    accent: '#FF9CFF',
    text: '#0B0B0B',
    glow: '#BFF1FF',
    gradient: ['#1A0B1A', '#5B2A6B', '#9FF7FF'],
    particles: 'holo',
    border: { color: '#FF9CFF', width: 6, style: 'prismatic' },
    hearts: 'holo',
    background: 'hologram',
  },
];

// Categories and phrases
const CATEGORIES = [
  { min: 1, max: 20, label: 'Connexion faible', key: 'weak' },
  { min: 21, max: 40, label: 'Lien fragile', key: 'fragile' },
  { min: 41, max: 60, label: "Bonne entente", key: 'good' },
  { min: 61, max: 75, label: 'Belle connexion', key: 'beautiful' },
  { min: 76, max: 89, label: 'Très forte connexion', key: 'veryStrong' },
  { min: 90, max: 99, label: 'Connexion exceptionnelle', key: 'exceptional' },
  { min: 100, max: 100, label: 'Âmes parfaitement connectées', key: 'perfect' },
];

const PHRASES = {
  weak: [
    "Les étoiles ne sont pas encore alignées.",
    "Une connexion timide se dessine.",
    "Les énergies sont un peu dissonantes.",
  ],
  fragile: [
    "Le lien est fragile, à cultiver doucement.",
    "Une base existe, mais attention aux différences.",
    "Les étoiles semblent hésiter...",
  ],
  good: [
    "Une belle connexion pourrait commencer ici.",
    "Vos deux énergies semblent s'accorder.",
    "Une entente naturelle se profile.",
  ],
  beautiful: [
    "Vos énergies semblent bien s'accorder.",
    "Une connexion chaleureuse est détectée.",
    "Le destin vous rapproche.",
  ],
  veryStrong: [
    "Une connexion rare vient d'être détectée.",
    "Vos tempéraments se complètent admirablement.",
    "Cupidon sourit fortement sur vous deux.",
  ],
  exceptional: [
    "Le système de Cupidon détecte une compatibilité exceptionnelle.",
    "Les étoiles conspirent en votre faveur.",
    "Un lien remarquable vient d'être relevé.",
  ],
  perfect: [
    "Connexion parfaite détectée. Même Cupidon est impressionné.",
    "Âmes soeurs ? Le verdict est sans appel.",
    "Un alignement parfait : presque mythique.",
  ],
};

// Utility: pick random element
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Utility: delay (ms)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Safe API wrappers for callback-based api.* functions
const promisifyApiCall = (fn, ...args) =>
  new Promise((resolve, reject) => {
    try {
      fn(...args, (err, data) => {
        if (err) return reject(err);
        return resolve(data);
      });
    } catch (e) {
      reject(e);
    }
  });

// Attempt to get thread members robustly
async function getThreadMembers(api, event, threadsData) {
  // Try api.getThreadInfo
  try {
    if (typeof api.getThreadInfo === 'function') {
      const info = await promisifyApiCall(api.getThreadInfo.bind(api), event.threadID);
      if (info && (info.participantIDs || info.userInfo || info.participant_ids)) {
        // Different libs have different fields
        const participants = info.participantIDs || info.participant_ids || (info.userInfo ? Object.keys(info.userInfo) : null);
        if (Array.isArray(participants)) return participants.map(String);
      }
    }
  } catch (e) {
    // ignore and fallback
  }

  // Try threadsData (if present)
  try {
    if (threadsData && typeof threadsData.get === 'function') {
      const t = await threadsData.get(event.threadID);
      if (t && t.participantIDs) return t.participantIDs.map(String);
      if (t && t.participants) return t.participants.map(String);
    }
  } catch (e) {}

  // Try event.participantIDs
  if (event.participantIDs && Array.isArray(event.participantIDs)) return event.participantIDs.map(String);

  // Fallback: include sender only
  return [String(event.senderID)];
}

// Get user info using api.getUserInfo if available
async function safeGetUserInfo(api, uid) {
  // Some frameworks: api.getUserInfo(uid, cb)
  try {
    if (typeof api.getUserInfo === 'function') {
      const info = await promisifyApiCall(api.getUserInfo.bind(api), uid);
      return info || {};
    }
  } catch (e) {
    // ignore
  }
  // Fallback: return minimal
  return { id: uid, name: String(uid) };
}

// Determine gender string normalized
function normalizeGender(info) {
  if (!info) return null;
  const g = (info.gender || info.sex || info.genderDisplayName || '').toString().toLowerCase();
  if (!g) return null;
  if (g.includes('male') || g.includes('homme') || g.includes('m')) return 'male';
  if (g.includes('female') || g.includes('femme') || g.includes('f')) return 'female';
  // numeric gender codes? e.g., 1 male, 2 female
  if (g === '1' || g === 'male' || g === 'm') return 'male';
  if (g === '2' || g === 'female' || g === 'f') return 'female';
  return null;
}

// Random percentage generator with controlled distribution
function generatePercentage() {
  const r = Math.random();
  // Rare chance of 100
  if (r < 0.02) return 100;
  // Small chance of 90-99
  if (r < 0.08) return 90 + Math.floor(Math.random() * 10);
  // Otherwise generate smoother distribution centered ~55 with sigma
  // Use sum of two uniforms to approximate triangular distribution
  const a = Math.random() * 60 + 20; // 20..80
  const b = Math.random() * 60 + 20;
  let v = Math.floor((a + b) / 2);
  v = Math.min(Math.max(v, 1), 99);
  return v;
}

function getCategoryForScore(score) {
  return CATEGORIES.find(c => score >= c.min && score <= c.max) || CATEGORIES[0];
}

function getPhraseForScore(score) {
  const cat = getCategoryForScore(score);
  const arr = PHRASES[cat.key] || [];
  return pick(arr) || '';
}

// File helpers: download avatar to cache, return path
async function downloadAvatar(url, uid) {
  try {
    const ext = (url.split('?')[0].split('.').pop() || 'jpg').split('/').pop();
    const filename = path.join(CACHE_DIR, `${Date.now()}_${uid}.${ext}`);
    const writer = fs.createWriteStream(filename);
    const res = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 15_000
    });
    await new Promise((resolve, reject) => {
      res.data.pipe(writer);
      let error = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) resolve();
      });
    });
    return filename;
  } catch (e) {
    return null;
  }
}

// Clean up temporary files
async function cleanupFiles(files = []) {
  for (const f of files) {
    try {
      if (f && fs.existsSync(f)) await fs.unlink(f);
    } catch (e) {
      // ignore
    }
  }
}

// Canvas drawing helpers (reusable)
function roundedRect(ctx, x, y, w, h, r) {
  const radius = r || 12;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawGlowText(ctx, text, x, y, font, fillStyle, glowColor, glowBlur = 16, align = 'left') {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowBlur;
  ctx.fillStyle = fillStyle;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawGradientText(ctx, text, x, y, font, gradientColors, align = 'left') {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  const metrics = ctx.measureText(text);
  const gw = metrics.width || 400;
  const grad = ctx.createLinearGradient(x - gw / 2, y - 50, x + gw / 2, y + 50);
  const step = 1 / Math.max(gradientColors.length - 1, 1);
  gradientColors.forEach((c, i) => grad.addColorStop(i * step, c));
  ctx.fillStyle = grad;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Draw circular avatar with rings and glow
async function drawAvatarDecor(ctx, img, cx, cy, radius, theme) {
  // Avatar clip
  ctx.save();
  // Outer glow ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = theme.glow || 'rgba(255,255,255,0.12)';
  ctx.shadowColor = theme.glow || '#fff';
  ctx.shadowBlur = 28;
  ctx.fill();
  ctx.restore();

  // Multiple rings
  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = theme.primary;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Circular clipping for avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Draw image centered and cover
  const iw = img.width, ih = img.height;
  // cover logic
  const aspect = iw / ih;
  let dw = radius * 2, dh = radius * 2, dx = cx - radius, dy = cy - radius;
  if (aspect > 1) { // wide
    const h = dh;
    const w = Math.ceil(h * aspect);
    const sx = Math.floor((iw - ih * aspect) / 2);
    ctx.drawImage(img, (iw - ih * aspect) / 2, 0, ih * aspect, ih, dx - (w - dw) / 2, dy, w, h);
  } else {
    const w = dw;
    const h = Math.ceil(w / aspect);
    ctx.drawImage(img, 0, (ih - iw / aspect) / 2, iw, iw / aspect, dx, dy - (h - dh) / 2, w, h);
  }
  ctx.restore();

  // small particles / sparkles around avatar
  ctx.save();
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = radius + 60 + Math.random() * 40;
    const px = cx + Math.cos(angle) * rad;
    const py = cy + Math.sin(angle) * rad;
    ctx.beginPath();
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = Math.random() * 0.8;
    ctx.arc(px, py, 2 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Draw hearts, lines, seal, particles etc (simplified helpers)
function drawHearts(ctx, theme, w, h) {
  // floating hearts top-right and bottom-left
  ctx.save();
  ctx.globalAlpha = 0.7;
  for (let i = 0; i < 8; i++) {
    const x = (Math.random() * 0.6 + 0.2) * w;
    const y = Math.random() * h * 0.4;
    drawHeart(ctx, x, y, 12 + Math.random() * 18, theme.accent);
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, size = 20, color = '#FF5A7A') {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  ctx.bezierCurveTo(0, topCurveHeight - size / 2, -size / 2, topCurveHeight - size / 2, -size / 2, topCurveHeight);
  ctx.bezierCurveTo(-size / 2, topCurveHeight + size / 2, 0, topCurveHeight + size * 0.75, 0, topCurveHeight + size);
  ctx.bezierCurveTo(0, topCurveHeight + size * 0.75, size / 2, topCurveHeight + size / 2, size / 2, topCurveHeight);
  ctx.bezierCurveTo(size / 2, topCurveHeight - size / 2, 0, topCurveHeight - size / 2, 0, topCurveHeight);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// Draw progress bar (compatibility)
function drawProgressBar(ctx, x, y, w, h, pct, theme) {
  // Background rounded
  roundedRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();

  // Gradient fill
  const innerW = Math.max(4, Math.floor((pct / 100) * (w - 4)));
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  const gcolors = (theme.gradient && theme.gradient.length) ? theme.gradient : [theme.primary, theme.accent];
  // pick mid colors
  for (let i = 0; i < gcolors.length; i++) {
    grad.addColorStop(i / (gcolors.length - 1 || 1), gcolors[i]);
  }
  roundedRect(ctx, x + 2, y + 2, innerW, h - 4, (h - 4) / 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Glow overlay
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.4;
  roundedRect(ctx, x + 2, y + 2, innerW, h - 4, (h - 4) / 2);
  ctx.fillStyle = theme.glow || '#ffffff';
  ctx.fill();
  ctx.restore();
}

// Create Analyzer Image (image 1)
async function createAnalyzerImage(opts) {
  const {
    width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT,
    userA, userB, score, categoryLabel, phrase, theme
  } = opts;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  const gcolors = theme.gradient && theme.gradient.length ? theme.gradient : [theme.primary, theme.secondary];
  for (let i = 0; i < gcolors.length; i++) {
    grad.addColorStop(i / (gcolors.length - 1 || 1), gcolors[i]);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Overlay patterns (simple: vignette)
  ctx.save();
  const vg = ctx.createRadialGradient(width / 2, height / 2, width / 6, width / 2, height / 2, Math.max(width, height));
  vg.addColorStop(0, 'rgba(255,255,255,0.04)');
  vg.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Decorative hearts/particles
  drawHearts(ctx, theme, width, height);

  // Place avatars
  const radius = Math.floor(Math.min(width, height) * 0.16);
  const cy = Math.floor(height * 0.45);
  const ax = Math.floor(width * 0.26);
  const bx = Math.floor(width * 0.74);

  try {
    // Load avatars might be buffered images passed in user objects
    const imgA = userA.canvasImage;
    const imgB = userB.canvasImage;
    if (imgA) await drawAvatarDecor(ctx, imgA, ax, cy, radius, theme);
    if (imgB) await drawAvatarDecor(ctx, imgB, bx, cy, radius, theme);
  } catch (e) {
    // ignore avatar draw errors
  }

  // Names
  ctx.save();
  const titleFont = 'bold 38px BeVietnamPro, NotoSans, Sans';
  ctx.fillStyle = theme.text;
  ctx.textAlign = 'center';
  ctx.font = '700 36px BeVietnamPro, NotoSans, Sans';
  // Name A
  ctx.fillStyle = theme.text;
  drawGradientText(ctx, userA.displayName || userA.name || 'Utilisateur A', ax, cy + radius + 60, '700 30px BeVietnamPro, NotoSans, Sans', [theme.accent, theme.primary]);
  drawGradientText(ctx, userB.displayName || userB.name || 'Utilisateur B', bx, cy + radius + 60, '700 30px BeVietnamPro, NotoSans, Sans', [theme.accent, theme.primary]);
  ctx.restore();

  // Symbol connection
  ctx.save();
  // draw a glowing connector between avatars
  ctx.beginPath();
  ctx.moveTo(ax + radius + 10, cy);
  ctx.quadraticCurveTo(width / 2, cy - 120, bx - radius - 10, cy);
  ctx.lineWidth = 6;
  ctx.strokeStyle = theme.accent;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 20;
  ctx.stroke();

  // place a heart in the middle
  drawHeart(ctx, width / 2, cy - 70, 36 + Math.round(score / 10), theme.accent);
  ctx.restore();

  // Percentage big display
  ctx.save();
  const pct = `${score}%`;
  ctx.textAlign = 'center';
  // big gradient text with glow
  drawGradientText(ctx, pct, width / 2, height * 0.2, '800 96px BeVietnamPro, NotoSans, Sans', [theme.accent, theme.primary, theme.glow]);
  drawGlowText(ctx, pct, width / 2, height * 0.2, '800 96px BeVietnamPro, NotoSans, Sans', theme.text, theme.glow, 40, 'center');
  ctx.restore();

  // Category label
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '700 28px BeVietnamPro, NotoSans, Sans';
  ctx.fillStyle = theme.text;
  ctx.fillText(categoryLabel, width / 2, height * 0.27 + 50);
  ctx.restore();

  // Progress bar
  ctx.save();
  const pbW = Math.floor(width * 0.56);
  const pbX = Math.floor((width - pbW) / 2);
  const pbY = Math.floor(height * 0.32 + 70);
  drawProgressBar(ctx, pbX, pbY, pbW, 34, score, theme);
  ctx.restore();

  // Phrase (personalized)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '600 26px NotoSans, Sans';
  ctx.fillStyle = theme.text;
  drawGlowText(ctx, `"${phrase}"`, width / 2, pbY + 70, '600 26px NotoSans, Sans', theme.text, theme.glow, 12, 'center');
  ctx.restore();

  // Small details: date/time and signature
  ctx.save();
  const dateStr = new Date().toLocaleString();
  ctx.font = '400 18px NotoSans, Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, width - 40, height - 40);

  // signature
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '700 16px SerifElegant, NotoSans, Sans';
  ctx.fillText('— Cupidon', 40, height - 40);
  ctx.restore();

  // subtle watermark center
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.font = '900 72px BeVietnamPro, NotoSans, Sans';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('ANALYSEUR DE LIENS', width / 2, height - 120);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

// Create Certificate Image (image 2)
async function createCertificateImage(opts) {
  const {
    width = CERT_WIDTH, height = CERT_HEIGHT,
    userA, userB, score, categoryLabel, phrase, theme
  } = opts;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background: elegant parchment-like or gradient depending theme
  ctx.fillStyle = '#F7F5F2';
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.save();
  ctx.lineWidth = 12;
  ctx.strokeStyle = theme.border ? theme.border.color : theme.accent;
  roundedRect(ctx, 40, 40, width - 80, height - 80, 28);
  ctx.stroke();
  ctx.restore();

  // Ornamental header
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.primary;
  ctx.font = '700 28px SerifElegant, NotoSans, Sans';
  ctx.fillText('— Déclaration Officielle —', width / 2, 160);
  ctx.restore();

  // Title
  ctx.save();
  ctx.font = '900 46px SerifElegant, NotoSans, Sans';
  ctx.fillStyle = theme.text;
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICAT DE COMPATIBILITÉ', width / 2, 220);
  ctx.restore();

  // Names
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '700 38px BeVietnamPro, NotoSans, Sans';
  ctx.fillStyle = theme.accent;
  ctx.fillText(`${userA.displayName || userA.name}`, width / 2, 360);
  ctx.fillStyle = theme.text;
  ctx.font = '400 20px NotoSans, Sans';
  ctx.fillText('&', width / 2, 400);
  ctx.font = '700 38px BeVietnamPro, NotoSans, Sans';
  ctx.fillStyle = theme.accent;
  ctx.fillText(`${userB.displayName || userB.name}`, width / 2, 460);
  ctx.restore();

  // Score block
  ctx.save();
  const blockX = width / 2 - 220;
  const blockY = 520;
  const blockW = 440;
  const blockH = 220;
  roundedRect(ctx, blockX, blockY, blockW, blockH, 18);
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Score
  ctx.font = '900 80px BeVietnamPro, NotoSans, Sans';
  ctx.fillStyle = theme.primary;
  ctx.textAlign = 'center';
  ctx.fillText(`${score}%`, width / 2, blockY + 140);

  // label
  ctx.font = '600 20px NotoSans, Sans';
  ctx.fillStyle = theme.text;
  ctx.fillText('Score de Compatibilité', width / 2, blockY + 180);
  ctx.restore();

  // Category and phrase
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '700 26px BeVietnamPro, NotoSans, Sans';
  ctx.fillStyle = theme.text;
  ctx.fillText(categoryLabel, width / 2, blockY + blockH + 80);
  ctx.font = '500 20px NotoSans, Sans';
  ctx.fillStyle = '#333';
  ctx.fillText(`"${phrase}"`, width / 2, blockY + blockH + 120);
  ctx.restore();

  // Seal
  ctx.save();
  const sealX = width / 2;
  const sealY = height - 420;
  const sealR = 90;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
  ctx.fillStyle = theme.gradient && theme.gradient[0] ? theme.gradient[0] : theme.primary;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = theme.accent;
  ctx.stroke();

  // seal text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = '700 18px NotoSans, Sans';
  ctx.fillText('✓ CERTIFIÉ PAR', sealX, sealY - 6);
  ctx.font = '900 22px SerifElegant, NotoSans, Sans';
  ctx.fillText('CUPIDON', sealX, sealY + 24);
  ctx.restore();

  // Ornamental corners (simple stars/hearts)
  ctx.save();
  drawHeart(ctx, 110, 120, 28, theme.accent);
  drawHeart(ctx, width - 110, 120, 28, theme.accent);
  ctx.restore();

  // Footer date
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#444';
  ctx.font = '400 18px NotoSans, Sans';
  ctx.fillText(`Émis le ${new Date().toLocaleString()}`, width / 2, height - 80);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

module.exports = {
  config: {
    name: "cupidon",
    author: "Shade",
    role: 0,
    description: "Analyse avancée de compatibilité entre deux utilisateurs (Cupidon premium).",
    category: "fun",
    guide: {
      fr: "Utilisation: cupidon | cupidon @mention | cupidon <uid>",
      en: "Usage: cupidon | cupidon @mention | cupidon <uid>"
    }
  },

  onStart: async function ({ api, event, args = [], usersData = null, threadsData = null }) {
    // Wrap the whole logic with try/catch to handle errors gracefully
    const threadID = event.threadID;
    const senderID = String(event.senderID);

    // Helper to send message as promise
    const sendMessage = (msg, tid, callback) =>
      new Promise((resolve) => {
        try {
          api.sendMessage(msg, tid, (err, info) => {
            resolve({ err, info });
            if (typeof callback === 'function') callback(err, info);
          });
        } catch (e) {
          resolve({ err: e });
        }
      });

    // Get bot id if available
    let botID = null;
    try {
      if (typeof api.getCurrentUserID === 'function') {
        botID = await api.getCurrentUserID();
      } else if (typeof api.getCurrentUserID === 'number' || typeof api.getCurrentUserID === 'string') {
        botID = String(api.getCurrentUserID);
      } else if (api.getCurrentUserID) {
        botID = String(api.getCurrentUserID);
      }
    } catch (e) {
      botID = null;
    }

    // Step 1: parse args for mention or uid
    let targetId = null;
    try {
      if (event.mentions && Object.keys(event.mentions).length > 0 && args.length > 0) {
        // If user used a mention, event.mentions maps names->id
        // select first mention that matches argument
        const mentionKeys = Object.keys(event.mentions);
        // find first mentioned ID
        const firstMentionId = event.mentions[mentionKeys[0]];
        if (firstMentionId) targetId = String(firstMentionId);
      } else if (args.length > 0) {
        const first = args[0].replace(/[<>@]/g, '').trim();
        if (/^\d+$/.test(first)) {
          targetId = String(first);
        }
      }
    } catch (e) {
      targetId = null;
    }

    // Step 2: get list of thread members
    let members = [];
    try {
      members = await getThreadMembers(api, event, threadsData);
      // Ensure strings
      members = members.map(String);
    } catch (e) {
      members = [senderID];
    }

    // filter: remove bot and sender from candidate pool when searching automatically
    const excludeIDs = new Set([String(senderID)]);
    if (botID) excludeIDs.add(String(botID));

    // Attempt to resolve users info for sender
    let senderInfo = {};
    try {
      senderInfo = await safeGetUserInfo(api, senderID);
    } catch (e) {
      senderInfo = { id: senderID, name: `Utilisateur ${senderID}` };
    }

    // If target specified, attempt to use that; else select automatically
    let partnerID = null;
    let partnerInfo = null;

    // Priority: mention/uid
    if (targetId) {
      try {
        // Ensure we don't pick sender or bot
        if (String(targetId) === String(senderID)) {
          // treat as invalid: pick auto later
          targetId = null;
        } else if (botID && String(targetId) === String(botID)) {
          targetId = null;
        } else {
          partnerID = String(targetId);
          partnerInfo = await safeGetUserInfo(api, partnerID);
        }
      } catch (e) {
        partnerID = null;
        partnerInfo = null;
      }
    }

    // Automatic selection if no partner from args
    if (!partnerID) {
      // Get genders if possible
      let senderGender = normalizeGender(senderInfo);

      // Search for candidates according to gender rules
      let candidates = members.filter(id => !excludeIDs.has(String(id)));
      // If no members, show friendly message
      if (!candidates || candidates.length === 0) {
        await sendMessage({ body: "Aucun autre participant trouvé dans ce groupe pour effectuer l'analyse.", }, threadID);
        return;
      }

      // If sender_gender known -> prefer opposite
      const opp = senderGender === 'male' ? 'female' : senderGender === 'female' ? 'male' : null;

      if (opp) {
        // filter by gender
        const candidatesWithGender = [];
        for (const id of candidates) {
          try {
            const info = await safeGetUserInfo(api, id);
            const g = normalizeGender(info);
            if (g) candidatesWithGender.push({ id, info, gender: g });
          } catch (e) { /* ignore */ }
        }
        const opps = candidatesWithGender.filter(c => c.gender === opp);
        if (opps.length > 0) {
          const pickOne = pick(opps);
          partnerID = String(pickOne.id);
          partnerInfo = pickOne.info;
        }
      }

      // Fallback: pick random from candidates (if not set)
      if (!partnerID) {
        // random among candidates; ensure not pick bot or sender
        const pool = candidates.filter(id => id !== senderID && (!botID || id !== String(botID)));
        if (!pool || pool.length === 0) {
          await sendMessage({ body: "Désolé, je n'ai trouvé personne d'adapté dans ce groupe.", }, threadID);
          return;
        }
        partnerID = pick(pool);
        try {
          partnerInfo = await safeGetUserInfo(api, partnerID);
        } catch (e) {
          partnerInfo = { id: partnerID, name: `Utilisateur ${partnerID}` };
        }
      }
    }

    if (!partnerID || !partnerInfo) {
      await sendMessage({ body: "Impossible de déterminer la personne à analyser. Essayez `cupidon @mention` ou `cupidon <uid>`.", }, threadID);
      return;
    }

    // Prepare user objects
    const userA = {
      id: senderID,
      name: senderInfo.name || senderInfo.displayName || `Utilisateur ${senderID}`,
      displayName: senderInfo.name || senderInfo.displayName || senderInfo.nickname || senderInfo.firstName || null,
      pictureUrl: senderInfo.profileUrl || senderInfo.profilePic || senderInfo.avatar || senderInfo.profilePicUrl || null
    };
    const userB = {
      id: partnerID,
      name: partnerInfo.name || partnerInfo.displayName || `Utilisateur ${partnerID}`,
      displayName: partnerInfo.name || partnerInfo.displayName || partnerInfo.nickname || partnerInfo.firstName || null,
      pictureUrl: partnerInfo.profileUrl || partnerInfo.profilePic || partnerInfo.avatar || partnerInfo.profilePicUrl || null
    };

    // If profile photo missing, attempt to get via graph? We won't embed tokens here; the caller's api.getUserInfo should provide a URL.
    // If still missing, use a default avatar in assets/default_avatar.png (optional)
    const defaultAvatarPath = path.join(ASSETS_DIR, 'default_avatar.png');

    // Download avatars (use axios), store paths to cleanup
    const tmpFiles = [];
    try {
      // Determine URLs or fallback to graph endpoints if info contained id
      let aUrl = userA.pictureUrl;
      let bUrl = userB.pictureUrl;

      // If not provided, try graph.facebook.com fallback (do not embed token)
      if (!aUrl) {
        aUrl = `https://graph.facebook.com/${userA.id}/picture?type=large`;
      }
      if (!bUrl) {
        bUrl = `https://graph.facebook.com/${userB.id}/picture?type=large`;
      }

      const aPath = await downloadAvatar(aUrl, `a_${userA.id}`);
      const bPath = await downloadAvatar(bUrl, `b_${userB.id}`);

      let aImg = null, bImg = null;
      if (aPath) {
        tmpFiles.push(aPath);
        aImg = await loadImage(aPath);
      } else if (fs.existsSync(defaultAvatarPath)) {
        aImg = await loadImage(defaultAvatarPath);
      }

      if (bPath) {
        tmpFiles.push(bPath);
        bImg = await loadImage(bPath);
      } else if (fs.existsSync(defaultAvatarPath)) {
        bImg = await loadImage(defaultAvatarPath);
      }

      userA.canvasImage = aImg;
      userB.canvasImage = bImg;
    } catch (err) {
      // ignore avatar issues, continue with null images
    }

    // Choose random theme
    const theme = pick(THEMES);

    // Generate score
    const score = generatePercentage();
    const category = getCategoryForScore(score);
    const phrase = getPhraseForScore(score);

    // Prepare options for canvas creation
    const createOpts = {
      userA, userB, score, categoryLabel: category.label, phrase, theme
    };

    // Create analyzer image buffer
    let img1Buffer = null;
    try {
      img1Buffer = await createAnalyzerImage(createOpts);
    } catch (e) {
      // handle canvas error
      await sendMessage({ body: "Une erreur est survenue lors de la génération de l'image. Réessayez plus tard." }, threadID);
      await cleanupFiles(tmpFiles);
      return;
    }

    // Save img1 to file
    const out1 = path.join(CACHE_DIR, `cupidon_${Date.now()}_a.png`);
    await fs.writeFile(out1, img1Buffer);

    // Send first image
    try {
      const caption = `Cupidon — Analyseur\n${userA.displayName || userA.name} ❤ ${userB.displayName || userB.name}\nScore: ${score}% — ${category.label}\n"${phrase}"`;
      const result1 = await sendMessage({ body: caption, attachment: fs.createReadStream(out1) }, threadID);
      // Wait small delay to simulate processing and ensure separation
      await sleep(600);
    } catch (e) {
      // still continue to attempt second image
    } finally {
      // remove first file after sending (we will clean temporaries later)
      try { await fs.unlink(out1); } catch (e) { /* ignore */ }
    }

    // Generate certificate (image 2)
    let img2Buffer = null;
    try {
      img2Buffer = await createCertificateImage(createOpts);
    } catch (e) {
      await sendMessage({ body: "Échec lors de la création du certificat. Mais l'analyse a été envoyée." }, threadID);
      await cleanupFiles(tmpFiles);
      return;
    }

    const out2 = path.join(CACHE_DIR, `cupidon_${Date.now()}_cert.png`);
    await fs.writeFile(out2, img2Buffer);

    // Send second image separately
    try {
      const caption2 = `— CERTIFICAT DE COMPATIBILITÉ —\n${userA.displayName || userA.name} & ${userB.displayName || userB.name}\nScore: ${score}%\nCertifié par Cupidon`;
      await sendMessage({ body: caption2, attachment: fs.createReadStream(out2) }, threadID);
    } catch (e) {
      // ignore send errors
    } finally {
      // cleanup
      try { await fs.unlink(out2); } catch (e) { /* ignore */ }
      await cleanupFiles(tmpFiles);
    }
  }
};
