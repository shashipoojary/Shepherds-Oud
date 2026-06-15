type BrevoEmail = {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
};

export async function sendBrevoEmail(email: BrevoEmail) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME || "Shepherds Oud";

  if (!apiKey || !fromEmail) {
    return { mode: "demo" as const, skipped: true };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: fromName,
        email: fromEmail
      },
      to: email.to,
      subject: email.subject,
      htmlContent: email.htmlContent,
      textContent: email.textContent
    })
  });

  if (!response.ok) {
    throw new Error(`Brevo email failed with status ${response.status}`);
  }

  return { mode: "brevo" as const, result: await response.json() };
}
