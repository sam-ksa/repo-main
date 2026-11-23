// إصلاحات لأخطاء في مكتبة discord.js v13
const discord = require('discord.js');

const { ClientUser } = discord;

// خطأ: ClientUser.edit (المستخدمة في setAvatar و setUsername) تسوي
//   this.client.token = data.token
// وديسكورد ما عاد يرجّع التوكن للبوتات، فينمسح توكن البوت بعد تغيير الأفتار أو الاسم
// والبوت ما يقدر يرد بعدها. هنا نحفظ التوكن ونرجعه بعد التعديل.
const originalEdit = ClientUser.prototype.edit;
ClientUser.prototype.edit = async function edit(data) {
  const token = this.client.token;
  try {
    return await originalEdit.call(this, data);
  } finally {
    if (!this.client.token && token) this.client.token = token;
  }
};

// حماية الإيموجيات: كل رسالة يرسلها البوت (رد، إرسال، تعديل، رد على زر/قائمة) تمر من safeSend.
// لو ديسكورد رفضها بسبب إيموجي غير موجود، تنرسل مرة ثانية بدون إيموجيات، فالبوت يرد دائماً.
const emojis = require('./emojis');
const PATCHED = Symbol('emojiSafe');
function wrap(proto, method) {
  if (!proto || !Object.prototype.hasOwnProperty.call(proto, method)) return;
  const original = proto[method];
  if (typeof original !== 'function' || original[PATCHED]) return;
  const safe = function (options, ...rest) {
    return emojis.safeSend((o) => original.call(this, o, ...rest), options);
  };
  safe[PATCHED] = true;
  proto[method] = safe;
}
wrap(discord.Message.prototype, 'edit');
for (const cls of ['BaseGuildTextChannel', 'BaseGuildVoiceChannel', 'ThreadChannel', 'DMChannel', 'User', 'GuildMember']) {
  wrap(discord[cls] && discord[cls].prototype, 'send');
}
for (const cls of ['MessageComponentInteraction', 'ButtonInteraction', 'SelectMenuInteraction']) {
  for (const m of ['reply', 'update', 'editReply', 'followUp']) wrap(discord[cls] && discord[cls].prototype, m);
}
