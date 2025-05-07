// telegram/list.js
// author : Deisgoku

const renderers = require('../lib/settings/model/list');
const themes = Object.keys(require('../lib/settings/model/theme'));

const models = Object.keys(renderers); 

module.exports = { models, themes };
