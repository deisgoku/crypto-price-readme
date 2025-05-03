const { themes } = require('../lib/settings/model/theme');
const renderers = require('../lib/settings/model/list');

const getThemeLabelsFromFile = () =>
  Object.entries(themes).map(([key]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key
  }));

const generateModelList = () =>
  Object.keys(renderers).map((key) => ({
    label: key[0].toUpperCase() + key.slice(1),
    value: key
  }));

const escapeXml = (unsafe) =>
  unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const themeParam = req.query.theme?.toLowerCase() || 'dark';
    const selectedTheme = themes[themeParam] || themes.dark;
    const { bgColor, textColor, borderColor, headBg, headText } = selectedTheme;

    const rowOdd = "#161b2233";
    const rowEven = "#161b2255";

    const themeLabels = getThemeLabelsFromFile();
    const modelOptions = generateModelList();

    const font = `font-family='monospace' font-size='13px'`;
    const rowHeight = 30;
    const colWidth = [160, 160, 240];
    const rowCount = Math.ceil(themeLabels.length / 2);
    const col1 = themeLabels.slice(0, rowCount).map(t => t.label);
    const col2 = themeLabels.slice(rowCount).map(t => t.label);

    const headerY = 40;
    const startY = headerY + rowHeight;
    const tableHeight = Math.max(rowCount, modelOptions.length) * rowHeight;
    const footerHeight = 50;
    const svgWidth = colWidth.reduce((a, b) => a + b, 0);
    const svgHeight = startY + tableHeight + footerHeight;
    const currentYear = new Date().getFullYear();

    const svg = `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aurora" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#00c6ff" />
          <stop offset="100%" stop-color="#0072ff" />
        </linearGradient>
      </defs>

      <!-- Outer border rounded -->
      <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" rx="16" ry="16" fill="${bgColor}" stroke="${borderColor}" stroke-width="2" />

      <!-- Aurora Header Title -->
      <rect x="0" y="0" width="${svgWidth}" height="${rowHeight}" rx="16" ry="16" fill="url(#aurora)" />
      <text x="${svgWidth / 2}" y="20" text-anchor="middle" fill="${headText}" ${font}>All inBuilt Theme & Style</text>

      <!-- Column Headers -->
      <rect x="0" y="${headerY}" width="${colWidth[0] + colWidth[1]}" height="${rowHeight}" fill="${headBg}" />
      <rect x="${colWidth[0] + colWidth[1]}" y="${headerY}" width="${colWidth[2]}" height="${rowHeight}" fill="${headBg}" />
      <text x="${(colWidth[0] + colWidth[1]) / 2}" y="${headerY + 20}" fill="${headText}" text-anchor="middle" ${font}>THEMES</text>
      <text x="${colWidth[0] + colWidth[1] + colWidth[2] / 2}" y="${headerY + 20}" fill="${headText}" text-anchor="middle" ${font}>MODELS</text>

      <!-- Rows -->
      ${Array.from({ length: rowCount }).map((_, i) => {
        const y = startY + i * rowHeight;
        const fill = i % 2 === 0 ? rowEven : rowOdd;
        return `
          <rect x="0" y="${y}" width="${colWidth[0]}" height="${rowHeight}" fill="${fill}" />
          <rect x="${colWidth[0]}" y="${y}" width="${colWidth[1]}" height="${rowHeight}" fill="${fill}" />
          <text x="10" y="${y + 20}" ${font} fill="${textColor}">${escapeXml(col1[i] || '')}</text>
          <text x="${colWidth[0] + 10}" y="${y + 20}" ${font} fill="${textColor}">${escapeXml(col2[i] || '')}</text>
        `;
      }).join('')}

      <!-- Model Column -->
      ${modelOptions.map((m, i) => {
        const y = startY + i * rowHeight + 20;
        return `<text x="${colWidth[0] + colWidth[1] + 10}" y="${y}" ${font} fill="${textColor}">${escapeXml(m.label)}</text>`;
      }).join('')}

      <!-- Footer -->
      <text x="${svgWidth / 2}" y="${svgHeight - 30}" text-anchor="middle" fill="${textColor}" ${font}>Github Crypto Market Card</text>
      <text x="${svgWidth / 2}" y="${svgHeight - 12}" text-anchor="middle" fill="${textColor}" ${font}>${currentYear} © Crypto Price Readme</text>
    </svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    return res.status(200).send(svg);

  } catch (err) {
    console.error("SVG render error:", err);
    return res.status(500).send("Failed to render SVG.");
  }
};
