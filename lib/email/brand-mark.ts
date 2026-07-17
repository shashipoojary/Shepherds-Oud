import { brand } from "@/lib/config/brand";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Pixel dimensions of `public/brand/logo-light.png` — keep in sync if the asset is replaced. */
const LOGO_LIGHT_WIDTH = 1536;
const LOGO_LIGHT_HEIGHT = 1024;

/** Hosted PNG for email clients — inline SVG is blocked by Gmail, Outlook, and most inboxes. */
export function emailBrandMarkHtml(appUrl: string, height = 56) {
  const base = appUrl.replace(/\/$/, "");
  const src = `${base}${brand.logoLightPath}`;
  const safeSrc = escapeHtml(src);
  const width = Math.round(height * (LOGO_LIGHT_WIDTH / LOGO_LIGHT_HEIGHT));

  return `<img src="${safeSrc}" alt="${escapeHtml(brand.name)}" width="${width}" height="${height}" style="display:block;width:${width}px;max-width:${width}px;height:${height}px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />`;
}
