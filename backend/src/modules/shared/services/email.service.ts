import { env } from "../../../env.js";
import { logger } from "../../../logger.js";

export type EmailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export interface EmailTransport {
  sendMail(options: EmailOptions): Promise<void>;
}

/**
 * Default development/test transport that safely dispatches emails.
 * Never prints raw secrets or passwords to info logs.
 */
class ConsoleEmailTransport implements EmailTransport {
  async sendMail(options: EmailOptions): Promise<void> {
    const maskedTo = options.to.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => {
      return `${first}${"*".repeat(Math.max(middle.length, 3))}${domain}`;
    });
    logger.info({ to: maskedTo, subject: options.subject }, "Email successfully queued for delivery");
  }
}

let activeTransport: EmailTransport = new ConsoleEmailTransport();

/**
 * Set custom email transport (e.g. SMTP or third-party email provider).
 */
export function setEmailTransport(transport: EmailTransport): void {
  activeTransport = transport;
}

/**
 * Dispatches an email using the active email transport.
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  await activeTransport.sendMail(options);
}

/**
 * Sends a password reset email containing the secure single-use reset link.
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const subject = "Password Reset Request - Leave & Attendance System";
  const text = `Hello,\n\nA password reset request was received for your account.\n\nPlease use the link below to reset your password (valid for 15 minutes):\n${resetLink}\n\nIf you did not request this password reset, please ignore this email or contact HR immediately.\n\nThank you,\nLeave & Attendance System`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #111;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your Leave & Attendance System account.</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}" style="background-color: #18181b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Or copy and paste this URL into your browser:<br/>
        <span style="word-break: break-all; color: #2563eb;">${resetLink}</span>
      </p>
      <p style="color: #666; font-size: 14px;">This link is valid for <strong>15 minutes</strong> and can only be used once.</p>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      <p style="color: #71717a; font-size: 12px;">If you did not request this password reset, please ignore this email or contact HR immediately.</p>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
}
