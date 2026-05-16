import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import type { NotificationMessage, NotificationProvider } from './notification.provider.js';

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER
    ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
      }
    : undefined
});

export class SmtpNotificationProvider implements NotificationProvider {
  async send(message: NotificationMessage) {
    await transport.sendMail({
      from: env.NOTIFICATION_FROM_EMAIL,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html
    });
  }
}
