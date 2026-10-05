import sgMail from "@sendgrid/mail";
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
      "Password reset email was not delivered. Set SENDGRID_API_KEY in backend/.env and restart the API.",
    );
  }
}

class SendGridEmailTransport implements EmailTransport {
  constructor() {
    sgMail.setApiKey(env.sendgridApiKey ?? "");
  }

  async sendMail(options: EmailOptions): Promise<void> {
    try {
      await sgMail.send({
        to: options.to,
        from: env.emailFrom,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (err) {
      const failure = err as { code?: number; response?: { body?: { errors?: { message?: string }[] } } };
      const providerMessage = failure.response?.body?.errors?.map((item) => item.message).filter(Boolean).join("; ");
      const reason = providerMessage || (err instanceof Error ? err.message : "SendGrid request failed");
      logger.error({ provider: "sendgrid", status: failure.code, reason }, "Password reset email rejected by SendGrid");
      throw new Error(`SendGrid: ${reason}`);
    }
    logger.info({ provider: "sendgrid", to: maskAddress(options.to) }, "Password reset email accepted by SendGrid");
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
  if (env.sendgridApiKey) {
    logger.info({ provider: "sendgrid", from: env.emailFrom }, "Password reset email provider: SendGrid");
    return new SendGridEmailTransport();
  }
  if (env.smtpHost) {
    logger.info({ provider: "smtp", host: env.smtpHost }, "Password reset email provider: SMTP");
    return new SmtpEmailTransport();
  }
  logger.warn(
    { reason: "configuration_missing" },
    "Password reset email provider is not configured. Set SENDGRID_API_KEY in backend/.env and restart the API.",
  );
  return new ConsoleEmailTransport();
}

let activeTransport: EmailTransport = selectTransport();

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(env.sendgridApiKey || env.smtpHost);
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
    to,
    subject,
    text,
    html,
  });
}
