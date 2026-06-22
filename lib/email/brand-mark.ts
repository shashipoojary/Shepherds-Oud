/** Inline SVG brand mark for email clients (PNG assets often fail or show wrong backgrounds). */
export function emailBrandMarkSvg(size = 48) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48" role="img" aria-label="Shepherds Oud" style="display:block;width:${size}px;height:${size}px;">
  <g fill="#ffffff">
    <ellipse cx="24" cy="42" rx="14" ry="2.5" opacity="0.35"/>
    <path d="M24 8c-6 0-11 4.5-11 10 0 3.2 1.5 6 4 7.8V38h14V25.8c2.5-1.8 4-4.6 4-7.8 0-5.5-5-10-11-10z"/>
    <circle cx="18" cy="34" r="2.2"/>
    <circle cx="30" cy="34" r="2.2"/>
    <path d="M17 36.5h14" stroke="#404d3c" stroke-width="1.2" stroke-linecap="round"/>
  </g>
</svg>`;
}
