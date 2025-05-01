function generateColoredChart(values, width = 70, height = 30) {
  if (!Array.isArray(values) || values.length < 2) return '';

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = (i * step).toFixed(2);
    const y = (height - ((v - min) / range) * height).toFixed(2);
    return { x, y, val: v };
  });

  let lines = '';
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const color = curr.val >= prev.val ? '#0f0' : '#f00';
    lines += `<line x1="${prev.x}" y1="${prev.y}" x2="${curr.x}" y2="${curr.y}" stroke="${color}" stroke-width="2" />`;
  }

  return lines;
}

module.exports = { generateColoredChart };
