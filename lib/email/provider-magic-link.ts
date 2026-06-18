import { sendBrevoEmail } from "@/lib/email/brevo";

export async function sendProviderMagicLinkEmail(email: string, url: string) {
  const subject = "Sign in to Shepherds Oud";
  const textContent = [
    "Use this secure link to open your facility dashboard:",
    url,
    "",
    "This link expires in 15 minutes. If you did not request it, you can ignore this email."
  ].join("\n");

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#2a2a2a;max-width:520px">
      <p style="margin:0 0 12px;font-size:14px;color:#8b4e25;font-weight:600;letter-spacing:0.04em;text-transform:uppercase">
        Shepherds Oud
      </p>
      <h1 style="margin:0 0 12px;font-size:22px;color:#404d3c">Sign in to your facility dashboard</h1>
      <p style="margin:0 0 20px;font-size:15px">
        Click the button below to sign in. This works with any email address, including Apple and Microsoft accounts.
      </p>
      <p style="margin:0 0 24px">
        <a href="${url}" style="display:inline-block;background:#c07a4a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">
          Open facility dashboard
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#666">
        Or copy this link into your browser:
      </p>
      <p style="margin:0 0 20px;font-size:13px;word-break:break-all;color:#404d3c">${url}</p>
      <p style="margin:0;font-size:12px;color:#888">
        This link expires in 15 minutes. If you did not request it, you can safely ignore this email.
      </p>
    </div>
  `;

  const result = await sendBrevoEmail({
    to: [{ email }],
    subject,
    htmlContent,
    textContent
  });

  if (result.mode === "demo") {
    console.info(`[dev] Provider magic link for ${email}: ${url}`);
  }

  return result;
}
