module.exports = async (req, res) => {
  const { themes } = require('../lib/settings/model/theme');
  const renderers = require('../lib/settings/model/list');

  const themeLabels = Object.keys(themes).map(key => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key
  }));

  const modelOptions = Object.keys(renderers).map(key => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key
  }));

  const escapeXml = (unsafe) => unsafe.replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;'
  }[c]));

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const themeParam = req.query.theme?.toLowerCase() || 'dark';
    const selectedTheme = themes[themeParam] || themes.dark;
    const { bgColor, textColor, borderColor, headText } = selectedTheme;

    const fonts = {
      title: "font-family='sans-serif' font-size='18px' font-weight='bold'",
      header: "font-family='monospace' font-size='13px' font-weight='bold'",
      row: "font-family='monospace' font-size='13px'",
      footer: "font-family='monospace' font-size='12px'"
    };

    const rowHeight = 30;
    const rowCount = Math.max(themeLabels.length, modelOptions.length);
    const radius = 8;
    const padding = 20;
    const headerHeight = 30;
    const colWidth = [160, 240]; // theme, model
    const tableWidth = colWidth[0] + colWidth[1];
    const svgWidth = tableWidth + padding * 2;
    const svgHeight = 90 + headerHeight + rowCount * rowHeight + 60;

    const header = `
      <defs>
        <linearGradient id="aurora" x1="0" y1="0" x2="${tableWidth}" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#00f0ff"/>
          <stop offset="100%" stop-color="#a100ff"/>
        </linearGradient>
      </defs>

      <g transform="translate(${padding}, 90)">
        <rect width="${tableWidth}" height="${headerHeight}" rx="${radius}" fill="url(#aurora)" />
        <text x="${colWidth[0] / 2}" y="20" ${fonts.header} fill="${headText}" text-anchor="middle">Theme</text>
        <text x="${colWidth[0] + colWidth[1] / 2}" y="20" ${fonts.header} fill="${headText}" text-anchor="middle">Model</text>
      </g>
    `;

    const rows = Array.from({ length: rowCount }).map((_, i) => {
      const themeText = themeLabels[i]?.label || '';
      const modelText = modelOptions[i]?.label || '';
      const y = 90 + headerHeight + i * rowHeight;
      const rowFill = i % 2 === 0 ? "#161b2255" : "#161b2233";

      return `
        <g transform="translate(${padding}, ${y})">
          <rect width="${colWidth[0]}" height="${rowHeight}" fill="${rowFill}" />
          <rect x="${colWidth[0]}" width="${colWidth[1]}" height="${rowHeight}" fill="${rowFill}" />
          <text x="10" y="20" ${fonts.row} fill="${textColor}">${escapeXml(themeText)}</text>
          <text x="${colWidth[0] + 10}" y="20" ${fonts.row} fill="${textColor}">${escapeXml(modelText)}</text>
        </g>
      `;
    }).join('');

    const svg = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" rx="16" ry="16" fill="${bgColor}" stroke="${borderColor}" stroke-width="2" />

        <text x="${svgWidth / 2}" y="40" ${fonts.title} fill="${headText}" text-anchor="middle">All Inbuilt Theme & Model</text>

        ${header}
        ${rows}

        <text x="${svgWidth / 2}" y="${svgHeight - 30}" ${fonts.footer} fill="${textColor}" text-anchor="middle">GitHub Crypto Market Card</text>
        <text x="${svgWidth / 2}" y="${svgHeight - 12}" ${fonts.footer} fill="${textColor}" text-anchor="middle">${new Date().getFullYear()} © DeisGoku</text>
      </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    return res.status(200).send(svg);
  } catch (err) {
    console.error("SVG render error:", err);
    return res.status(500).send("Failed to render SVG.");
  }
};
