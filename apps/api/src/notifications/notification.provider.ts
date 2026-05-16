export type NotificationMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export interface NotificationProvider {
  send(message: NotificationMessage): Promise<void>;
}
