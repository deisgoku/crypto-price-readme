// telegram/i18n.js

const { I18n } = require('telegraf-i18n');
const path = require('path');

const i18n = new I18n({
  defaultLanguage: 'id',
  directory: path.join(__dirname, './locales'),
  useSession: true,
  allowMissing: false
});

module.exports = i18n;
