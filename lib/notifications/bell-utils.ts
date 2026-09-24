export function getNotificationBellAriaLabel(unreadCount: number): string {
  if (unreadCount === 0) return "Notifications, no unread notifications";
  if (unreadCount === 1) return "Notifications, 1 unread notification";
  return `Notifications, ${unreadCount} unread notifications`;
}
