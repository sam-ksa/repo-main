const path = require('path');
const { MessageAttachment } = require('discord.js');

// صورة Panel Tek اللي تظهر في كل الامبيدات
const LOGO_NAME = 'paneltek.png';
const LOGO_PATH = path.join(__dirname, '..', 'images', LOGO_NAME);

module.exports = {
  logoURL: `attachment://${LOGO_NAME}`,
  logoFile: () => new MessageAttachment(LOGO_PATH, LOGO_NAME),
};
