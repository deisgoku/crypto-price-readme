const cardInfo = require("../lib/settings/data/info");

module.exports = (req, res) => {
  // Determine theme (light or dark)
  const themeParam = req.query.theme;
  const themeMode = themeParam === "dark" ? "dark" : "light";

  // Color schemes
  const colors = {
    light: {
      bg: "#fff",
      text: "#000",
      headerBg: "#222",
      headerText: "#fff",
      rowEven: "#f9f9f9",
      rowOdd: "#ffffff",
      border: "#ccc"
    },
    dark: {
      bg: "#1e1e1e",
      text: "#ffffff",
      headerBg: "#333",
      headerText: "#ffffff",
      rowEven: "#2a2a2a",
      rowOdd: "#1e1e1e",
      border: "#444"
    }
  };
  const style = colors[themeMode];

  // Layout settings
  const rowHeight = 30;
  const tableStartY = 80;
  const totalWidth = 640;
  const midX = totalWidth / 2;
  const colWidth = midX;
  const rowPerCol = Math.ceil(cardInfo.themes.length / 2);
  const totalHeight = tableStartY + rowPerCol * rowHeight + 40;

  // Helper to render each cell (theme + style)
  function renderCell(themeName, styleName, x, y, bgColor) {
    return `
      <rect x="${x}" y="${y}" width="${colWidth / 2}" height="${rowHeight}" fill="${bgColor}" stroke="${style.border}" />
      <rect x="${x + colWidth / 2}" y="${y}" width="${colWidth / 2}" height="${rowHeight}" fill="${bgColor}" stroke="${style.border}" />
      <text x="${x + colWidth / 4}" y="${y + 20}" fill="${style.text}" font-size="13" text-anchor="middle">${themeName}</text>
      <text x="${x + (colWidth * 3) / 4}" y="${y + 20}" fill="${style.text}" font-size="13" text-anchor="middle">${styleName}</text>
    `;
  }

  // Build header rows and data rows
  let rows = "";

  // Left header
  rows += `
    <rect x="0" y="${tableStartY}" width="${colWidth / 2}" height="${rowHeight}" fill="${style.headerBg}" />
    <rect x="${colWidth / 2}" y="${tableStartY}" width="${colWidth / 2}" height="${rowHeight}" fill="${style.headerBg}" />
    <text x="${colWidth / 4}" y="${tableStartY + 20}" fill="${style.headerText}" font-weight="bold" font-size="14" text-anchor="middle">Available Theme</text>
    <text x="${(colWidth * 3) / 4}" y="${tableStartY + 20}" fill="${style.headerText}" font-weight="bold" font-size="14" text-anchor="middle">Available Style</text>
  `;
  // Right header
  rows += `
    <rect x="${colWidth}" y="${tableStartY}" width="${colWidth / 2}" height="${rowHeight}" fill="${style.headerBg}" />
    <rect x="${colWidth + colWidth / 2}" y="${tableStartY}" width="${colWidth / 2}" height="${rowHeight}" fill="${style.headerBg}" />
    <text x="${colWidth + colWidth / 4}" y="${tableStartY + 20}" fill="${style.headerText}" font-weight="bold" font-size="14" text-anchor="middle">Available Theme</text>
    <text x="${colWidth + (colWidth * 3) / 4}" y="${tableStartY + 20}" fill="${style.headerText}" font-weight="bold" font-size="14" text-anchor="middle">Available Style</text>
  `;

  // Data rows split into two columns
  cardInfo.themes.forEach((themeName, i) => {
    const isLeft = i < rowPerCol;
    const colX = isLeft ? 0 : colWidth;
    const rowIndex = isLeft ? i : i - rowPerCol;
    const y = tableStartY + rowHeight * (rowIndex + 1);
    const bgColor = rowIndex % 2 === 0 ? style.rowEven : style.rowOdd;
    const styleName = cardInfo.styles[themeName] || "available soon";
    rows += renderCell(themeName, styleName, colX, y, bgColor);
  });

  // Full SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">
      <style>text { font-family: Arial, sans-serif; }</style>
      <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="${style.bg}" />
      <text x="${totalWidth / 2}" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="${style.text}">Crypto-Readme Card Feature</text>
      <text x="${totalWidth / 2}" y="55" text-anchor="middle" font-size="14" fill="${style.text}">Version ${cardInfo.version}</text>
      ${rows}
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.status(200).send(svg);
};
