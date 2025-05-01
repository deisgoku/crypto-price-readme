function generateColoredChart(values, width = 100, height = 24) {
  if (!Array.isArray(values) || values.length < 2) return '';

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return [x, y];
  });

  let paths = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1] || p1;
    const p3 = points[i + 2] || p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    const color = p2[1] < p1[1] ? '#00ff00' : '#ff0000';
    const d = `
      M ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}
      C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)},
        ${cp2x.toFixed(2)} ${cp2y.toFixed(2)},
        ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}
    `;

    paths.push(`<path d="${d.trim()}" fill="none" stroke="${color}" stroke-width="1.5" />`);
  }

  return paths.join('\n');
}

module.exports = { generateColoredChart };
