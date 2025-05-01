// lib/settings/chart/colored.js
function generateColoredChart(data) {
  if (!Array.isArray(data) || data.length < 2) return '';

  const width = 60;
  const height = 20;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return [x.toFixed(2), y.toFixed(2)];
  });

  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');

  const color = data[data.length - 1] >= data[0] ? '#4ade80' : '#f87171'; // green or red
  return `<path d="${path}" fill="none" stroke="${color}" stroke-width="1.5" />`;
}

module.exports = { generateColoredChart };
