function generateColoredChart(values, width = 70, height = 30) {
  if (!Array.isArray(values) || values.length < 2) return '';

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = (i * step).toFixed(2);
    const y = (height - ((v - min) / range) * height).toFixed(2);
    return [parseFloat(x), parseFloat(y)];
  });

  // Catmull-Rom to Cubic Bezier conversion
  const curvePath = (pts) => {
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
    }
    return d;
  };

  const d = curvePath(points);
  return `<path d="${d}" fill="none" stroke="#00ff00" stroke-width="2" />`;
}
