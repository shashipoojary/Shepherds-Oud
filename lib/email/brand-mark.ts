import { brand } from "@/lib/config/brand";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Hosted PNG for email clients — inline SVG is blocked by Gmail, Outlook, and most inboxes. */
export function emailBrandMarkHtml(appUrl: string, height = 52) {
  const base = appUrl.replace(/\/$/, "");
  const src = `${base}${brand.logoLightPath}`;
  const safeSrc = escapeHtml(src);

  return `<img src="${safeSrc}" alt="${escapeHtml(brand.name)}" width="${height}" height="${height}" style="display:block;width:${height}px;height:${height}px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />`;
}
