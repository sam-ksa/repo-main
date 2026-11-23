// بيانات الاشتراك — نفس منطق امبيد "Bots Settings" في سورس الميوزك المربوط بنظام الاشتراكات:
// 1) نظام الاشتراكات يحقن بيانات الاشتراك في config.json (owners, randomCode, subscriptionDuration, botnumber ...)
// 2) المدة الفعلية من الداشبورد: PANEL_API_URL + /api/bot/subscription (بتوكن PANEL_BOT_API_TOKEN)
//    وإذا ما رد، نحسبها من config.json
// 3) احتياط: subscriptions.json / subscription.json / متغيرات SUB_*
// تشغيل محلي بدون نظام الاشتراكات: كل القيم "-"
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const readJSON = (name) => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8')) || {}; } catch { return null; }
};

function toMsTime(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v <= 0) return null;
    if (v > 1e12) return v;
    if (v > 1e9) return v * 1000;
    return null;
  }
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const t = Date.parse(s);
      return Number.isFinite(t) ? t : null;
    }
    if (/^-?\d+(\.\d+)?$/.test(s)) return toMsTime(Number(s));
  }
  return null;
}

// نفس ترتيب سورس الميوزك: تاريخ انتهاء صريح ← subscriptionDuration (غالباً تاريخ انتهاء بالملي ثانية) ← بداية + مدة
function resolveExpiry(cfg) {
  if (!cfg || typeof cfg !== 'object') return null;
  const explicit = [cfg.subscriptionEnd, cfg.endAt, cfg.expiryAt, cfg.expireAt, cfg.expiresAt, cfg.endTime]
    .map(toMsTime).find((t) => t != null && t > 1e11);
  if (explicit) return explicit;
  const start = [cfg.startTime, cfg.startedAt, cfg.activatedAt, cfg.subscriptionStart, cfg.createdAt, cfg.purchaseAt]
    .map(toMsTime).find((t) => t != null);
  const dur = cfg.subscriptionDuration ?? cfg.duration ?? cfg.planDuration ?? cfg.period;
  if (dur !== undefined && dur !== null && dur !== '') {
    const n = Number(dur);
    if (Number.isFinite(n) && n > 0) {
      if (n > 1e12) return n;
      if (n > 1e9) return start ? start + n * 1000 : n * 1000;
      const durMs = n <= 3650 ? n * 86400000 : n; // أيام أو ملي ثانية
      if (start) return start + durMs;
    }
  }
  return null;
}

function resolveBotCount(...sources) {
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    const raw = src.botnumber ?? src.botNumber ?? src.bots ?? src.bot_count ?? src.count;
    if (raw === undefined || raw === null || raw === '') continue;
    const n = parseInt(String(raw), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

// متغيرات SUB_* القديمة (توافق مع النسخة السابقة)
function envSource() {
  const pick = (...names) => names.map((n) => process.env[n]).find((v) => v != null && String(v).trim() !== '');
  const src = {
    ownerId: pick('SUB_OWNER', 'SUBSCRIPTION_OWNER'),
    expiresAt: pick('SUB_EXPIRES', 'SUBSCRIPTION_EXPIRES'),
    randomCode: pick('SUB_CODE', 'SUBSCRIPTION_CODE'),
    botnumber: pick('SUB_BOTS', 'SUBSCRIPTION_BOTS'),
    activeBots: pick('SUB_ACTIVE_BOTS', 'SUBSCRIPTION_ACTIVE_BOTS'),
  };
  return Object.values(src).some((v) => v != null) ? src : null;
}

// هل config.json فيه بيانات من نظام الاشتراكات؟ (owners لحالها ما تكفي: البوت نفسه يستخدمها محلياً)
const PANEL_FIELDS = ['randomCode', 'subscriptionId', 'subscriptionDuration', 'botnumber', 'botNumber',
  'expiresAt', 'subscriptionEnd', 'endAt', 'expireAt', 'expiryAt', 'endTime'];
const hasPanelFields = (c) => Boolean(c && PANEL_FIELDS.some((k) => c[k] !== undefined && c[k] !== null && c[k] !== ''));

const PANEL_API_URL = String(process.env.PANEL_API_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '');
const PANEL_API_TOKEN = String(process.env.PANEL_BOT_API_TOKEN || '').trim();
const PANEL_TYPE_ID = (process.argv.find((a) => a.startsWith('--panel-key=')) || '').slice('--panel-key='.length).split('|')[0];

// المدة الفعلية من الداشبورد (نفس طلب سورس الميوزك). null = نرجع للقيم المحلية
async function fetchPanelSubscription(subscriberId, code, guildId) {
  if (!PANEL_API_TOKEN || !subscriberId) return null;
  const params = new URLSearchParams({ userId: subscriberId });
  if (guildId) params.set('serverId', guildId);
  if (code) params.set('code', code);
  if (PANEL_TYPE_ID) params.set('botTypeId', PANEL_TYPE_ID);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${PANEL_API_URL}/api/bot/subscription?${params}`, {
      headers: { 'x-panel-bot-token': PANEL_API_TOKEN },
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.ok && data.subscription) return data.subscription;
    console.warn('[subscription] الداشبورد لم يُرجع الاشتراك:', res.status, (data && data.error) || '');
  } catch (e) {
    console.warn('[subscription] تعذّر الوصول إلى الداشبورد:', (e && e.message) || e);
  } finally {
    clearTimeout(timer);
  }
  return null;
}

// يرجّع بيانات الاشتراك، أو null إذا البوت مو شغال تحت نظام الاشتراكات
async function read({ guildId } = {}) {
  const cfg = readJSON('config.json') || {};
  const localSubs = readJSON('subscriptions.json');
  const localSub = localSubs && Array.isArray(localSubs.subscriptions) && localSubs.subscriptions.length
    ? localSubs.subscriptions[localSubs.subscriptions.length - 1] : null;
  const legacy = readJSON('subscription.json');
  const env = envSource();
  const candidates = [hasPanelFields(cfg) ? cfg : null, localSub, legacy, env].filter(Boolean);
  if (!candidates.length) return null;

  let expiresAt = null;
  for (const c of candidates) {
    const t = resolveExpiry(c);
    if (t) { expiresAt = t; break; }
  }
  let code = null;
  for (const c of candidates) {
    const v = c.randomCode ?? c.subscriptionId ?? c.code;
    if (v !== undefined && v !== null && String(v).trim()) { code = String(v).trim(); break; }
  }
  let ownerId = null;
  for (const c of candidates) {
    if (Array.isArray(c.owners) && c.owners.length) { ownerId = String(c.owners[0]); break; }
    if (c.ownerId || c.owner) { ownerId = String(c.ownerId || c.owner); break; }
    if (c.userId) { ownerId = String(c.userId); break; }
  }
  if (ownerId) ownerId = (ownerId.match(/\d{15,20}/) || [])[0] || null;

  // ايدي المشترك: من اسم مجلد البوت (نظام الاشتراكات يسميه بايدي المشترك) أو أول مالك
  const subscriberId = (path.basename(ROOT).match(/^(\d{15,20})(?:_|$)/) || [])[1] || ownerId || '';
  const cfgGuild = cfg._GuildServer || cfg.Guild || cfg.guildId || cfg.serverId || guildId || '';
  const remote = await fetchPanelSubscription(subscriberId, code, cfgGuild);
  const remainingMs = remote && typeof remote.remainingMs === 'number' && Number.isFinite(remote.remainingMs)
    ? remote.remainingMs
    : (expiresAt ? expiresAt - Date.now() : null);

  const activeRaw = candidates.map((c) => c.activeBots).find((v) => v != null);
  return {
    owner: ownerId,
    remainingMs,
    code,
    bots: resolveBotCount(...candidates),
    activeBots: activeRaw != null ? Number(activeRaw) : null,
  };
}

// نفس صيغة سورس الميوزك: "2 أسبوع و 6 يوم و 13 ساعة و 9 دقيقة و 5 ثانية"
const UNITS = [
  [30 * 86400000, 'شهر'], [7 * 86400000, 'أسبوع'], [86400000, 'يوم'],
  [3600000, 'ساعة'], [60000, 'دقيقة'], [1000, 'ثانية'],
];
function formatRemaining(ms) {
  let rest = Math.max(0, Math.floor(Number(ms) || 0));
  const parts = [];
  for (const [size, name] of UNITS) {
    const v = Math.floor(rest / size);
    if (v <= 0) continue;
    rest -= v * size;
    parts.push(`${v} ${name}`);
  }
  return parts.length ? parts.join(' و ') : '0 ثانية';
}

module.exports = { read, formatRemaining, resolveExpiry, toMsTime, hasPanelFields };
