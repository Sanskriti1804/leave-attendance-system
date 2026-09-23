import nodemailer from "nodemailer";
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
 * Default development/test transport. Does not print the message body,
 * because password-reset links contain a secret token.
 */
function maskAddress(email: string): string {
  return email.replace(/^(.)(.*)(@.*)$/, (_, first: string, middle: string, domain: string) => {
    return `${first}${"*".repeat(Math.max(middle.length, 3))}${domain}`;
  });
}

class ConsoleEmailTransport implements EmailTransport {
  async sendMail(options: EmailOptions): Promise<void> {
    logger.warn(
      { to: maskAddress(options.to), reason: "configuration_missing" },
      "Password reset email was not delivered. Set RESEND_API_KEY in backend/.env and restart the API.",
    );
  }
}

class ResendEmailTransport implements EmailTransport {
  async sendMail(options: EmailOptions): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
      }),
    });
    if (!response.ok) {
      let reason = `Resend HTTP ${response.status}`;
      try {
        const body = (await response.json()) as { message?: string };
        if (typeof body.message === "string" && body.message.trim()) {
          reason = `Resend: ${body.message}`;
        }
      } catch {
        reason = `Resend HTTP ${response.status} with an unreadable error body`;
      }
      logger.error({ provider: "resend", status: response.status, reason }, "Password reset email rejected by Resend");
      throw new Error(reason);
    }
    logger.info({ provider: "resend", to: maskAddress(options.to) }, "Password reset email accepted by Resend");
  }
}

class SmtpEmailTransport implements EmailTransport {
  private readonly transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort ?? 587,
    secure: env.smtpSecure,
    auth: env.smtpUser
      ? {
          user: env.smtpUser,
          pass: env.smtpPass,
        }
      : undefined,
  });

  async sendMail(options: EmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: env.emailFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }
}

function selectTransport(): EmailTransport {
  if (env.resendApiKey) {
    logger.info({ provider: "resend", from: env.emailFrom }, "Password reset email provider: Resend");
    return new ResendEmailTransport();
  }
  if (env.smtpHost) {
    logger.info({ provider: "smtp", host: env.smtpHost }, "Password reset email provider: SMTP");
    return new SmtpEmailTransport();
  }
  logger.warn(
    { reason: "configuration_missing" },
    "Password reset email provider is not configured. Set RESEND_API_KEY in backend/.env and restart the API.",
  );
  return new ConsoleEmailTransport();
}

let activeTransport: EmailTransport = selectTransport();

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(env.resendApiKey || env.smtpHost);
}

/**
 * Set custom email transport (tests, or a provider other than SMTP).
 */
export function setEmailTransport(transport: EmailTransport): void {
  activeTransport = transport;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  await activeTransport.sendMail(options);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/**
 * Sends a password reset email containing the secure single-use reset link.
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const deliverTo =
    env.nodeEnv !== "production" && env.resendDevInbox && env.resendDevInbox.toLowerCase() !== to.toLowerCase()
      ? env.resendDevInbox
      : to;
  if (deliverTo !== to) {
    logger.warn(
      { reason: "resend_test_recipient" },
      "Resend test sender cannot mail other addresses. Password reset email is being delivered to RESEND_DEV_INBOX. The link still resets the account that requested it.",
    );
  }
  const subject = "Reset your LAMS SCG password";
  const safeLink = escapeHtml(resetLink);
  const text = `LAMS SCG\nLeave & Attendance Management System\n\nWe received a request to reset the password for ${to}.\n\nOpen this link to choose a new password. It expires in 15 minutes and can be used once:\n${resetLink}\n\nIf you did not request this, ignore this email. Your password will stay the same.\n\nLAMS SCG`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #161616; max-width: 600px; margin: 0 auto;">
      <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; color: #5A534C;">LAMS SCG</p>
      <h2 style="color: #1A1A1A; margin: 4px 0 16px;">Reset your password</h2>
      <p>We received a request to reset the password for <strong>${escapeHtml(to)}</strong> on the Leave &amp; Attendance Management System.</p>
      <p style="margin: 24px 0;">
        <a href="${safeLink}" style="background-color: #18181b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Or copy and paste this URL into your browser:<br/>
        <span style="word-break: break-all; color: #2563eb;">${safeLink}</span>
      </p>
      <p style="color: #666; font-size: 14px;">This link is valid for <strong>15 minutes</strong> and can only be used once.</p>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      <p style="color: #71717a; font-size: 12px;">If you did not request this password reset, please ignore this email or contact HR immediately.</p>
    </div>
  `;

  await sendEmail({
    to: deliverTo,
    subject,
    text,
    html,
  });
}
