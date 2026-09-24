export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt?: string;
}

export function formatUnreadAriaLabel(unreadCount: number): string {
  if (unreadCount <= 0) return "Notifications";
  if (unreadCount === 1) return "Notifications (1 unread)";
  return `Notifications (${unreadCount} unread)`;
}

export function getUnreadCount(items: NotificationItem[]): number {
  if (!Array.isArray(items)) return 0;
  return items.filter((item) => !item.readAt).length;
}

export function filterNotifications(
  items: NotificationItem[],
  filter: "all" | "unread"
): NotificationItem[] {
  if (!Array.isArray(items)) return [];
  if (filter === "unread") {
    return items.filter((item) => !item.readAt);
  }
  return items;
}
