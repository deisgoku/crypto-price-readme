// telegram/lists.js
// author: Deisgoku

const { themesName } = require('../lib/settings/model/theme');
const { renderers } = require('../lib/settings/model/list');

const modelsName = Object.keys(renderers);

async function generateLists() {
  const themes = themesName.map(t => `🎨 ${t}`).join('\n');
  const models = modelsName.map(m => `🤖 ${m}`).join('\n');

  return {
    themes,
    models,
  };
}

module.exports = { generateLists };
