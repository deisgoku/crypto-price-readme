// lib/settings/model/list.js

const { renderModern } = require("./modern");
const { renderFuturistic } = require("./futuristic");
const { renderClassic } = require("./classic");
const { renderAurora } = require("./aurora");



const renderers = {
  modern: renderModern,
  futuristic: renderFuturistic,
  classic: renderClassic,
  aurora: renderAurora,
};


module.exports = renderers;
