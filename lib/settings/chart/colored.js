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

  function catmullRom2bezier(p0, p1, p2, p3) {
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    return [
      [cp1x, cp1y],
      [cp2x, cp2y],
      [p2[0], p2[1]]
    ];
  }

  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  let paths = [];

  for (let i = 0; i < points.length - 3; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];

    const [[cp1x, cp1y], [cp2x, cp2y], [x, y]] = catmullRom2bezier(p0, p1, p2, p3);

    const color = y < p1[1] ? '#00ff00' : '#ff0000';
    const segment = `M ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${x.toFixed(2)} ${y.toFixed(2)}`;
    paths.push(`<path d="${segment}" fill="none" stroke="${color}" stroke-width="1.5" />`);
  }

  return paths.join('\n');
}

module.exports = { generateColoredChart };
