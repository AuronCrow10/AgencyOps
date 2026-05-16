import { env } from '../config/env.js';
import type { NotificationMessage, NotificationProvider } from './notification.provider.js';
import { AppError } from '../utils/app-error.js';

export class ResendNotificationProvider implements NotificationProvider {
  async send(message: NotificationMessage) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.NOTIFICATION_FROM_EMAIL,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html
      })
    });

    if (!response.ok) {
      throw new AppError('Failed to send notification email', 502, 'notification_failed');
    }
  }
}
