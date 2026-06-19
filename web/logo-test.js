const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 42" width="118" height="42">
  <defs>
    <linearGradient id="tSignGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B935D" />
      <stop offset="100%" stop-color="#2a6942" />
    </linearGradient>
  </defs>
  <rect width="118" height="42" rx="8" fill="#ffffff" />
  <text x="6" y="31" font-family="monospace" font-size="44" font-weight="bold" fill="url(#tSignGrad)">t</text>
  <text x="30" y="31" font-family="sans-serif" font-size="38" font-weight="900" fill="#111111" letter-spacing="-1">Sign</text>
  <circle cx="110" cy="31" r="4.5" fill="#3B935D" />
</svg>`;
console.log("data:image/svg+xml;base64," + Buffer.from(svg).toString("base64"));
