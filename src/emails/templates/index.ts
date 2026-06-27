interface EmailTemplateResult {
  subject: string;
  html: string;
}

function baseLayout(content: string): string {
  return `
  <!DOCTYPE html>
  <html>
    <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:32px;">
              <tr>
                <td>
                  <h2 style="color:#111827;margin-top:0;">AI Workspace</h2>
                  ${content}
                  <p style="color:#9ca3af;font-size:12px;margin-top:32px;">
                    If you didn't request this email, you can safely ignore it.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

export function verificationEmailTemplate(variables: Record<string, string>): EmailTemplateResult {
  const { verificationLink, firstName } = variables;
  return {
    subject: 'Verify your email address',
    html: baseLayout(`
      <p>Hi ${firstName || 'there'},</p>
      <p>Please verify your email address to finish setting up your AI Workspace account.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${verificationLink}" style="background:#111827;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Verify Email
        </a>
      </p>
    `),
  };
}

export function passwordResetEmailTemplate(variables: Record<string, string>): EmailTemplateResult {
  const { resetLink, firstName } = variables;
  return {
    subject: 'Reset your password',
    html: baseLayout(`
      <p>Hi ${firstName || 'there'},</p>
      <p>We received a request to reset your password. This link expires in 30 minutes.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${resetLink}" style="background:#111827;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
      </p>
    `),
  };
}

export function welcomeEmailTemplate(variables: Record<string, string>): EmailTemplateResult {
  const { firstName, appUrl } = variables;
  return {
    subject: 'Welcome to AI Workspace',
    html: baseLayout(`
      <p>Hi ${firstName || 'there'},</p>
      <p>Welcome aboard! Your AI Workspace account is ready to go.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${appUrl}" style="background:#111827;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Open AI Workspace
        </a>
      </p>
    `),
  };
}

export function notificationEmailTemplate(variables: Record<string, string>): EmailTemplateResult {
  const { title, message } = variables;
  return {
    subject: title || 'New notification',
    html: baseLayout(`
      <p><strong>${title}</strong></p>
      <p>${message}</p>
    `),
  };
}
