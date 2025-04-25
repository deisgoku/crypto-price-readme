const renderLocked = (username = '') => {
  const safeUser = username || 'Unknown';
  return `
  <svg width="500" height="200" viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
    <style>
      .text { font-family: monospace; font-size: 14px; fill: #888; text-anchor: middle; }
      .lock-body { fill: #333; }
      .lock-shackle { fill: none; stroke: #888; stroke-width: 4; }
    </style>

    <rect x="10" y="10" width="480" height="180" rx="12" fill="#111" stroke="#888" stroke-width="1.5"/>

    <!-- Icon kunci -->
    <g transform="translate(230, 30)">
      <rect x="10" y="40" width="40" height="50" rx="6" class="lock-body">
        <animateTransform attributeName="transform" type="rotate" values="-2;2;-2" dur="2s" repeatCount="indefinite" additive="sum"/>
      </rect>
      <path d="M20 40 C20 20, 40 20, 40 40" class="lock-shackle"/>
    </g>

    <!-- Text -->
    <text x="250" y="110" class="text" font-size="16" fill="#fff">Locked Content</text>
    <text x="250" y="135" class="text">Hi @${safeUser}, please follow us</text>
    <text x="250" y="155" class="text">to unlock this card!</text>
    <text x="250" y="180" class="text" font-size="12" fill="#888">Visit crypto-price-on.vercel.app/unlock</text>
  </svg>`;
};

module.exports = renderLocked;

