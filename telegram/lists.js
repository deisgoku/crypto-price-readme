// telegram/lists.js
// author: Deisgoku

const { themesName } = require('../lib/settings/theme');
const { modelsName } = require('../lib/settings/model');

async function generateLists() {
  const themes = themesName.map(t => `🎨 ${t}`).join('\n');
  const models = modelsName.map(m => `🤖 ${m}`).join('\n');

  return {
    themes,
    models,
  };
}

module.exports = { generateLists };
