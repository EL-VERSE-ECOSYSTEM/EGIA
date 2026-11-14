export type NotificationKind = "assessment_result" | "payment" | "payment_reminder" | "attendance" | "announcement" | "message" | "dispute" | "reminder";

export type PushNotification = {
  title: string;
  body: string;
  image?: string;
  link?: string;
  data?: Record<string, string>;
  type: NotificationKind;
};
