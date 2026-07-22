import { Resend } from 'resend';
import nodemailer, { Transporter } from 'nodemailer';
import { env } from '@config/env';
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
  notificationEmailTemplate,
} from '@emails/templates';
import { logger } from '@utils/logger';

export interface SendEmailInput {
  to: string;
  template: 'verification' | 'password-reset' | 'welcome' | 'notification';
  subject?: string;
  variables: Record<string, string>;
}

const TEMPLATE_MAP = {
  verification: verificationEmailTemplate,
  'password-reset': passwordResetEmailTemplate,
  welcome: welcomeEmailTemplate,
  notification: notificationEmailTemplate,
} as const;

export class EmailService {
  private resend: Resend;
  private smtpTransport: Transporter;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
    this.smtpTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }

  async send(payload: SendEmailInput): Promise<void> {
    const renderer = TEMPLATE_MAP[payload.template];
    const { subject, html } = renderer(payload.variables);
    const finalSubject = payload.subject || subject;

    if (env.EMAIL_PROVIDER === 'resend') {
      await this.sendViaResend(payload.to, finalSubject, html);
    } else {
      await this.sendViaSmtp(payload.to, finalSubject, html);
    }
  }

  private async sendViaResend(to: string, subject: string, html: string): Promise<void> {
    try {
      const result = await this.resend.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      logger.error('Resend email send failed, falling back to SMTP', {
        error: (error as Error).message,
      });
      await this.sendViaSmtp(to, subject, html);
    }
  }

  private async sendViaSmtp(to: string, subject: string, html: string): Promise<void> {
    await this.smtpTransport.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();
