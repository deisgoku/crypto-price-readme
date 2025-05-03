const { themes } = require('../lib/settings/model/theme');
const renderers = require('../lib/settings/model/list');

const getThemeLabelsFromFile = () => {
  return Object.entries(themes).map(([key]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key
  }));
};

const generateModelList = () => {
  return Object.keys(renderers).map((key) => ({
    label: key[0].toUpperCase() + key.slice(1),
    value: key
  }));
};

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
    const {
      bgColor,
      textColor,
      borderColor,
      headBg,
      headText,
    } = selectedTheme;

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
    const svgWidth = colWidth.reduce((a, b) => a + b, 0);
    const svgHeight = startY + tableHeight + 60;

    const titleText = `
      <text x="${svgWidth / 2}" y="25" fill="${textColor}" text-anchor="middle" ${font}>${escapeXml('All inBuilt Theme & Style')}</text>
    `;

    const themeHeader = `
      <rect x="0" y="${headerY}" width="${colWidth[0] + colWidth[1]}" height="${rowHeight}" fill="${headBg}" />
      <text x="${(colWidth[0] + colWidth[1]) / 2}" y="${headerY + 20}" fill="${headText}" text-anchor="middle" ${font}>${escapeXml('Themes')}</text>
    `;

    const modelHeader = `
      <rect x="${colWidth[0] + colWidth[1]}" y="${headerY}" width="${colWidth[2]}" height="${rowHeight}" fill="${headBg}" />
      <text x="${colWidth[0] + colWidth[1] + colWidth[2] / 2}" y="${headerY + 20}" fill="${headText}" text-anchor="middle" ${font}>${escapeXml('Models')}</text>
    `;

    const rows = Array.from({ length: rowCount }).map((_, i) => {
      const y = startY + i * rowHeight;
      const fill = i % 2 === 0 ? rowEven : rowOdd;
      return `
        <rect x="0" y="${y}" width="${colWidth[0]}" height="${rowHeight}" fill="${fill}" />
        <rect x="${colWidth[0]}" y="${y}" width="${colWidth[1]}" height="${rowHeight}" fill="${fill}" />
        <text x="10" y="${y + 20}" ${font} fill="${textColor}">${escapeXml(col1[i] || '')}</text>
        <text x="${colWidth[0] + 10}" y="${y + 20}" ${font} fill="${textColor}">${escapeXml(col2[i] || '')}</text>
      `;
    }).join('');

    const modelTexts = modelOptions.map((m, i) => {
      const y = startY + i * rowHeight + 20;
      return `<text x="${colWidth[0] + colWidth[1] + 10}" y="${y}" ${font} fill="${textColor}">${escapeXml(m.label)}</text>`;
    }).join('');

    const footerY = startY + tableHeight + 20;
    const footerText = `
      <text x="${svgWidth / 2}" y="${footerY}" fill="${textColor}" text-anchor="middle" ${font}>${escapeXml('GitHub Crypto Market Card')}</text>
    `;

    const svg = `
      <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}" stroke="${borderColor}" />
        ${titleText}
        ${themeHeader}
        ${modelHeader}
        ${rows}
        ${modelTexts}
        ${footerText}
      </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    return res.status(200).send(svg);

  } catch (err) {
    console.error("SVG render error:", err);
    return res.status(500).send("Failed to render SVG.");
  }
};
