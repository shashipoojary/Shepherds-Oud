import { brand } from "@/lib/config/brand";
import { emailBrandMarkHtml } from "@/lib/email/brand-mark";

const colors = {
  cream: "#f7f4f0",
  white: "#ffffff",
  ink: "#2a2a2a",
  muted: "#666666",
  subtle: "#888888",
  amber: "#c07a4a",
  amberDark: "#8b4e25",
  greenDark: "#404d3c",
  greenMid: "#6c7c5c"
} as const;

export type TransactionalEmailOptions = {
  preheader: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  footerNote: string;
  appUrl?: string;
  cta?: {
    label: string;
    url: string;
  };
  fallbackLinkLabel?: string;
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
  footerNote,
  appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app",
  cta,
  fallbackLinkLabel = "Or copy this link into your browser:"
}: TransactionalEmailOptions) {
  const safeCtaUrl = cta ? escapeHtml(cta.url) : "";

  const paragraphHtml = paragraphs
    .map(
      (paragraph) =>
        `<p class="email-text" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${colors.ink};">${escapeHtml(paragraph)}</p>`
    )
    .join("");

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
        <tr>
          <td align="left" style="border-radius:10px;background-color:${colors.amber};">
            <a href="${safeCtaUrl}" class="email-button" style="display:inline-block;background-color:${colors.amber};color:${colors.white};text-decoration:none;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:700;line-height:1.2;mso-padding-alt:0;">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
      </table>
      <p class="email-muted" style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${colors.muted};">${escapeHtml(fallbackLinkLabel)}</p>
      <p class="email-link" style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;color:${colors.greenDark};"><a href="${safeCtaUrl}" style="color:${colors.amberDark};text-decoration:underline;">${safeCtaUrl}</a></p>`
    : "";

  const brandMark = emailBrandMarkHtml(appUrl, 56);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>${escapeHtml(title)}</title>
    <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
    <style>
      :root { color-scheme: light only; supported-color-schemes: light only; }
      body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
      img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
      a { text-decoration: none; }
      @media only screen and (max-width: 620px) {
        .email-shell { padding: 20px 12px !important; }
        .email-card { width: 100% !important; max-width: 100% !important; }
        .email-header { padding: 22px 20px !important; }
        .email-body { padding: 26px 22px !important; }
        .email-title { font-size: 24px !important; line-height: 1.25 !important; }
        .email-text { font-size: 15px !important; line-height: 1.65 !important; }
        .email-button {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
          text-align: center !important;
        }
      }
      @media (prefers-color-scheme: dark) {
        .email-outer, .email-shell { background-color: ${colors.cream} !important; }
        .email-card { background-color: ${colors.white} !important; }
        .email-header { background-color: ${colors.greenDark} !important; }
        .email-body { background-color: ${colors.white} !important; }
        .email-title { color: ${colors.greenDark} !important; }
        .email-text { color: ${colors.ink} !important; }
        .email-muted { color: ${colors.muted} !important; }
        .email-footer { color: ${colors.subtle} !important; }
      }
      [data-ogsc] .email-outer, [data-ogsc] .email-shell { background-color: ${colors.cream} !important; }
      [data-ogsc] .email-body { background-color: ${colors.white} !important; }
      [data-ogsc] .email-header { background-color: ${colors.greenDark} !important; }
    </style>
  </head>
  <body class="email-outer" style="margin:0;padding:0;width:100%;background-color:${colors.cream};font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-outer" style="width:100%;background-color:${colors.cream};">
      <tr>
        <td align="center" class="email-shell" style="padding:32px 20px;">
          <!-- Single card: no seam between header and body (fixes white border line in clients) -->
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="email-card" style="width:100%;max-width:600px;background-color:${colors.white};border-radius:16px;overflow:hidden;">
            <tr>
              <td class="email-header" style="background-color:${colors.greenDark};padding:26px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="64" valign="middle" style="width:64px;vertical-align:middle;line-height:0;font-size:0;">
                      ${brandMark}
                    </td>
                    <td valign="middle" style="vertical-align:middle;padding-left:16px;">
                      <p style="margin:0;font-size:18px;line-height:1.2;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${colors.white};">${escapeHtml(brand.name)}</p>
                      <p style="margin:6px 0 0;font-size:13px;line-height:1.5;font-style:italic;color:${colors.amber};">${escapeHtml(brand.tagline)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-body" style="background-color:${colors.white};padding:36px 32px;">
                <p style="margin:0 0 10px;font-size:11px;line-height:1.4;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${colors.amber};">${escapeHtml(eyebrow)}</p>
                <h1 class="email-title" style="margin:0 0 18px;font-size:28px;line-height:1.25;font-weight:700;color:${colors.greenDark};">${escapeHtml(title)}</h1>
                ${paragraphHtml}
                ${ctaHtml}
                <p class="email-footer" style="margin:0;padding-top:18px;border-top:1px solid #ebebeb;font-size:12px;line-height:1.6;color:${colors.subtle};">${escapeHtml(footerNote)}</p>
              </td>
            </tr>
          </table>
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td class="email-footer" style="padding:18px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:${colors.subtle};">
                <p style="margin:0;">${escapeHtml(brand.name)} · ${escapeHtml(brand.emailFooterLine)}</p>
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
