const { themes } = require('../lib/settings/model/theme');
const renderers = require('../lib/settings/model/list');

// Get theme list with label/value format
const getThemeLabelsFromFile = () =>
  Object.entries(themes).map(([key]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key,
  }));

// Get renderer/model list with label/value format
const generateModelList = () =>
  Object.keys(renderers).map((key) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key,
  }));

// Escape special characters in XML
const escapeXml = (unsafe) =>
  unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
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
    const font = `font-family='monospace' font-size='13px'`;

    const themeLabels = getThemeLabelsFromFile();
    const modelOptions = generateModelList();

    const rowCount = Math.ceil(themeLabels.length / 2);
    const col1 = themeLabels.slice(0, rowCount).map(t => t.label);
    const col2 = themeLabels.slice(rowCount).map(t => t.label);

    const rowHeight = 30;
    const colWidth = [160, 160, 240];
    const headerY = 40;
    const gapBetweenHeaderAndRow = 10;
    const startY = headerY + rowHeight + gapBetweenHeaderAndRow;
    const maxRow = Math.max(rowCount, modelOptions.length);
    const tableHeight = maxRow * rowHeight;
    const svgWidth = colWidth.reduce((a, b) => a + b, 0);
    const paddingX = 20;
    const svgHeight = startY + tableHeight + 80;
    const viewBox = `0 0 ${svgWidth + paddingX * 2} ${svgHeight}`;
    const currentYear = new Date().getFullYear();

    const tableHeader = `
      <rect x="${paddingX}" y="${headerY}" width="${svgWidth}" height="${rowHeight}" fill="${headBg}" stroke="${borderColor}" stroke-width="1" />
      <text x="${paddingX + (colWidth[0] + colWidth[1]) / 2}" y="${headerY + 20}" fill="${headText}" text-anchor="middle" ${font}>
        ${escapeXml("THEMES")}
      </text>
      <text x="${paddingX + colWidth[0] + colWidth[1] + colWidth[2] / 2}" y="${headerY + 20}" fill="${headText}" text-anchor="middle" ${font}>
        ${escapeXml("MODELS")}
      </text>
      <line x1="${paddingX}" y1="${startY - gapBetweenHeaderAndRow / 2}" x2="${paddingX + svgWidth}" y2="${startY - gapBetweenHeaderAndRow / 2}" stroke="${borderColor}" stroke-width="1" />
    `;

    const rows = Array.from({ length: maxRow }).map((_, i) => {
      const y = startY + i * rowHeight;
      const fill = i % 2 === 0 ? rowEven : rowOdd;

      return `
        <rect x="${paddingX}" y="${y}" width="${colWidth[0]}" height="${rowHeight}" fill="${fill}" stroke="${borderColor}" stroke-width="1" />
        <rect x="${paddingX + colWidth[0]}" y="${y}" width="${colWidth[1]}" height="${rowHeight}" fill="${fill}" stroke="${borderColor}" stroke-width="1" />
        <text x="${paddingX + 10}" y="${y + 20}" ${font} fill="${textColor}">${escapeXml(col1[i] || '')}</text>
        <text x="${paddingX + colWidth[0] + 10}" y="${y + 20}" ${font} fill="${textColor}">${escapeXml(col2[i] || '')}</text>
      `;
    }).join('');

    const modelTexts = Array.from({ length: maxRow }).map((_, i) => {
      const y = startY + i * rowHeight;
      const fill = i % 2 === 0 ? rowEven : rowOdd;
      const label = modelOptions[i]?.label || '';

      return `
        <rect x="${paddingX + colWidth[0] + colWidth[1]}" y="${y}" width="${colWidth[2]}" height="${rowHeight}" fill="${fill}" stroke="${borderColor}" stroke-width="1" />
        <text x="${paddingX + colWidth[0] + colWidth[1] + 10}" y="${y + 20}" ${font} fill="${textColor}">
          ${escapeXml(label)}
        </text>
      `;
    }).join('');

    const svg = `
      <svg width="${svgWidth + paddingX * 2}" height="${svgHeight}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="100%" height="100%" rx="16" ry="16" fill="${bgColor}" stroke="${borderColor}" stroke-width="2" />
        <text x="${(svgWidth + paddingX * 2) / 2}" y="20" text-anchor="middle" fill="${headText}" ${font}>
          ${escapeXml("All inBuilt Theme & Style")}
        </text>

        ${tableHeader}
        ${rows}
        ${modelTexts}

        <text x="${(svgWidth + paddingX * 2) / 2}" y="${svgHeight - 30}" text-anchor="middle" fill="${textColor}" ${font}>
          GitHub Crypto Market Card
        </text>
        <text x="${(svgWidth + paddingX * 2) / 2}" y="${svgHeight - 12}" text-anchor="middle" fill="${textColor}" ${font}>
          ${currentYear} © DeisGoku All Reserved
        </text>
      </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    return res.status(200).send(svg);

  } catch (err) {
    console.error("SVG render error:", err);
    return res.status(500).send("Failed to render SVG.");
  }
};
