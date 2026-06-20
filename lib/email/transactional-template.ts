import { brand } from "@/lib/config/brand";

const colors = {
  cream: "#f7f4f0",
  white: "#ffffff",
  ink: "#2a2a2a",
  muted: "#666666",
  subtle: "#888888",
  amber: "#c07a4a",
  amberDark: "#8b4e25",
  greenDark: "#404d3c",
  greenPale: "#b5c18b",
  cardBorder: "#ebebeb"
} as const;

type TransactionalEmailOptions = {
  preheader: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
  fallbackLinkLabel?: string;
  footerNote: string;
  appUrl?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderTransactionalEmail({
  preheader,
  eyebrow,
  title,
  paragraphs,
  ctaLabel,
  ctaUrl,
  fallbackLinkLabel = "Or copy this link into your browser:",
  footerNote,
  appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app"
}: TransactionalEmailOptions) {
  const safeUrl = escapeHtml(ctaUrl);
  const logoUrl = `${appUrl.replace(/\/$/, "")}${brand.logoLightPath}`;

  const paragraphHtml = paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${colors.ink};">${escapeHtml(paragraph)}</p>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(title)}</title>
    <style>
      @media only screen and (max-width: 620px) {
        .container { width: 100% !important; }
        .shell { padding: 16px 10px !important; }
        .card { padding: 24px 20px !important; }
        .header { padding: 20px !important; }
        .button {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
          text-align: center !important;
        }
        .title { font-size: 24px !important; line-height: 1.25 !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${colors.cream};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${colors.cream};">
      <tr>
        <td align="center" class="shell" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:100%;max-width:600px;border-collapse:collapse;">
            <tr>
              <td class="header" style="background:${colors.greenDark};border-radius:16px 16px 0 0;padding:24px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${logoUrl}" alt="" width="56" height="56" style="display:block;width:56px;height:56px;border:0;outline:none;text-decoration:none;" />
                    </td>
                    <td style="vertical-align:middle;padding-left:14px;">
                      <p style="margin:0;font-size:18px;line-height:1.2;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${colors.white};">${escapeHtml(brand.name)}</p>
                      <p style="margin:6px 0 0;font-size:13px;line-height:1.5;font-style:italic;color:${colors.amber};">${escapeHtml(brand.tagline)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="card" style="background:${colors.white};border:1px solid ${colors.cardBorder};border-top:0;border-radius:0 0 16px 16px;padding:32px 28px;box-shadow:0 8px 24px rgba(64,77,60,0.06);">
                <p style="margin:0 0 10px;font-size:11px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${colors.amber};">${escapeHtml(eyebrow)}</p>
                <h1 class="title" style="margin:0 0 18px;font-size:28px;line-height:1.25;font-weight:700;color:${colors.greenDark};">${escapeHtml(title)}</h1>
                ${paragraphHtml}
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
                  <tr>
                    <td>
                      <a href="${safeUrl}" class="button" style="display:inline-block;background:${colors.amber};color:${colors.white};text-decoration:none;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:700;line-height:1.2;">${escapeHtml(ctaLabel)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${colors.muted};">${escapeHtml(fallbackLinkLabel)}</p>
                <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;color:${colors.greenDark};"><a href="${safeUrl}" style="color:${colors.amberDark};text-decoration:underline;">${safeUrl}</a></p>
                <p style="margin:0;padding-top:18px;border-top:1px solid ${colors.cardBorder};font-size:12px;line-height:1.6;color:${colors.subtle};">${escapeHtml(footerNote)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:${colors.subtle};">
                <p style="margin:0;">${escapeHtml(brand.name)} · Nationwide eldercare matching in the Netherlands</p>
                <p style="margin:8px 0 0;"><a href="mailto:${escapeHtml(brand.email)}" style="color:${colors.amberDark};text-decoration:none;">${escapeHtml(brand.email)}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
