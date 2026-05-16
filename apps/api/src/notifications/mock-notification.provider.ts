import type { NotificationMessage, NotificationProvider } from './notification.provider.js';
import { logger } from '../utils/logger.js';

export class MockNotificationProvider implements NotificationProvider {
  send(message: NotificationMessage) {
    logger.info({ message }, 'Mock notification sent');
    return Promise.resolve();
  }
}
