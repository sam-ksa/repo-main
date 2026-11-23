// إيموجي شعار Panel Tek (إيموجي تطبيق يرفعه البوت لنفسه) لزر الدعم
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const ROOT = path.join(__dirname, '..');
const LOGO = path.join(ROOT, 'images', 'paneltek.png');
const EMOJI_NAME = 'paneltek';

let emoji = null;

// يدور على إيموجي الشعار في إيموجيات التطبيق، وإذا ما لقاه يرفعه (مرة وحدة)
async function ensureEmoji(client) {
  const app = client.api.applications(client.user.id).emojis;
  try {
    const list = await app.get();
    const items = Array.isArray(list) ? list : (list && list.items) || [];
    let found = items.find((e) => e.name === EMOJI_NAME);
    if (!found) {
      const img = await loadImage(LOGO);
      const c = createCanvas(128, 128);
      c.getContext('2d').drawImage(img, 0, 0, 128, 128);
      const data = `data:image/png;base64,${(await c.encode('png')).toString('base64')}`;
      found = await app.post({ data: { name: EMOJI_NAME, image: data } });
      console.log('[brand] تم رفع إيموجي Panel Tek');
    }
    emoji = { id: found.id, name: found.name };
  } catch (e) {
    console.error('[brand] ما قدرت أجهز إيموجي الشعار:', e.message);
  }
  return emoji;
}

const getEmoji = () => emoji;

module.exports = { ensureEmoji, getEmoji, EMOJI_NAME };
