const { themes } = require('../lib/settings/model/theme');
const { redis } = require('../lib/redis');

// Fungsi untuk mendapatkan label tema dari file
const getThemeLabelsFromFile = () => {
  return Object.entries(themes).map(([key]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key
  }));
};

// 
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

// Fungsi utama yang menangani request
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // Mendapatkan tema dan menyimpannya ke Redis
      const themeLabels = getThemeLabelsFromFile();
      await redis.set('theme:labels', JSON.stringify(themeLabels));
      return res.status(200).json({ message: 'Themes stored to Redis.', count: themeLabels.length });
    } catch (err) {
      console.error("Theme POST error:", err);
      return res.status(500).json({ error: "Failed to store themes." });
    }
  }

  if (req.method === 'GET') {
    try {
      let rawThemes = await redis.get("theme:labels");

      // Jika data tema belum ada, auto-fallback dari file
      if (!rawThemes) {
        const themeLabels = getThemeLabelsFromFile();
        await redis.set("theme:labels", JSON.stringify(themeLabels));
        rawThemes = JSON.stringify(themeLabels);
        console.log("Auto-filled theme:labels from theme.js");
      }

      // Parsing data model
      const rawModels = await redis.get("model:list");
      if (!rawModels) {
        return res.status(404).send("Missing model data in Redis.");
      }

      // 
      let modelOptions;
      try {
        modelOptions = JSON.parse(rawModels);
      } catch (err) {
        return res.status(500).send("Invalid model data format.");
      }

      // Ambil tema yang dipilih, fallback ke 'dark' jika tidak ditemukan
      const theme = 'dark';
      const { bgColor, textColor, borderColor, headBg, headText } = themes[theme] || themes.dark;

      const font = `font-family='monospace' font-size='13px'`;
      const rowHeight = 30;
      const colWidth = [160, 160, 240];
      const rowCount = Math.ceil(modelOptions.length / 2);

      const col1 = modelOptions.slice(0, rowCount).map(m => m.label);
      const col2 = modelOptions.slice(rowCount).map(m => m.label);

      const headerY = 40;
      const startY = headerY + rowHeight;
      const tableHeight = Math.max(rowCount, modelOptions.length) * rowHeight;
      const svgWidth = colWidth.reduce((a, b) => a + b, 0);
      const svgHeight = startY + tableHeight + 40;

      // Header Tema
      const themeHeader = `
        <rect x="0" y="${headerY}" width="${colWidth[0] + colWidth[1]}" height="${rowHeight}" fill="${headBg}" />
        <text x="${(colWidth[0] + colWidth[1]) / 2}" y="${headerY + 20}" fill="${headText}" text-anchor="middle" ${font}>THEMES</text>
      `;

      // Header Model
      const modelHeader = `
        <rect x="${colWidth[0] + colWidth[1]}" y="${headerY}" width="${colWidth[2]}" height="${rowHeight}" fill="${headBg}" />
        <text x="${colWidth[0] + colWidth[1] + colWidth[2] / 2}" y="${headerY + 20}" fill="${headText}" text-anchor="middle" ${font}>MODELS</text>
      `;

      // Row Model
      const rows = Array.from({ length: rowCount }).map((_, i) => {
        const y = startY + i * rowHeight;
        const fill = i % 2 === 0 ? '#ffffff22' : '#cccccc22';
        return `
          <rect x="0" y="${y}" width="${colWidth[0]}" height="${rowHeight}" fill="${fill}" />
          <rect x="${colWidth[0]}" y="${y}" width="${colWidth[1]}" height="${rowHeight}" fill="${fill}" />
          <text x="10" y="${y + 20}" ${font} fill="${textColor}">${escapeXml(col1[i] || '')}</text>
          <text x="${colWidth[0] + 10}" y="${y + 20}" ${font} fill="${textColor}">${escapeXml(col2[i] || '')}</text>
        `;
      }).join('');

      // Model Texts
      const modelTexts = modelOptions.map((m, i) => {
        const y = startY + i * rowHeight + 20;
        return `<text x="${colWidth[0] + colWidth[1] + 10}" y="${y}" ${font} fill="${textColor}">${escapeXml(m.label)}</text>`;
      }).join('');

      // SVG Output
      const svg = `
        <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${bgColor}" stroke="${borderColor}" />
          ${themeHeader}
          ${modelHeader}
          ${rows}
          ${modelTexts}
        </svg>
      `;

      // Set header dan response SVG
      res.setHeader("Content-Type", "image/svg+xml");
      return res.status(200).send(svg);

    } catch (err) {
      console.error("SVG render error:", err);
      return res.status(500).send("Failed to render SVG.");
    }
  }

  // Method tidak diizinkan
  return res.status(405).json({ error: 'Method not allowed' });
};
