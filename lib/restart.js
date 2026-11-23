// إعادة تشغيل حقيقية للبوت (عملية جديدة) بدل client.destroy() + login في نفس العملية،
// لأن الطريقة القديمة كانت تمسح التوكن وتخلي البوت يستقبل رسائل بدون ما يقدر يرد.
const fs = require('fs');
const { spawn } = require('child_process');
const store = require('./store');

// البوت شغال تحت مدير عمليات (pm2 / لوحة استضافة / نظام اشتراكات) يعيد تشغيله بنفسه
function isManaged() {
  return Boolean(
    process.env.pm_id !== undefined
    || process.env.RESTART_MODE === 'exit'
    || typeof process.send === 'function'
    || process.env.INVOCATION_ID !== undefined // systemd
    || fs.existsSync('/.dockerenv'), // docker
  );
}

function restart(delay = 1500) {
  store.flushAll();
  setTimeout(() => {
    if (!isManaged()) {
      // تشغيل نسخة جديدة بنفس الأمر ونفس المجلد، وبعدها نطلع
      const child = spawn(process.execPath, process.argv.slice(1), {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit',
        // detached ضروري: بدونه ويندوز يقفل النسخة الجديدة مع القديمة
        detached: true,
        windowsHide: true,
      });
      child.unref();
    }
    process.exit(0);
  }, delay);
}

module.exports = { restart, isManaged };
