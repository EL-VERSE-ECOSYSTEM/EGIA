import test from "node:test";
import assert from "node:assert/strict";
import {
  formatUnreadAriaLabel,
  getUnreadCount,
  filterNotifications,
  NotificationItem,
} from "../lib/notifications/bell-utils";

test("formatUnreadAriaLabel returns correct accessible labels", () => {
  assert.equal(formatUnreadAriaLabel(0), "Notifications");
  assert.equal(formatUnreadAriaLabel(1), "Notifications (1 unread)");
  assert.equal(formatUnreadAriaLabel(5), "Notifications (5 unread)");
});

test("getUnreadCount calculates unread count accurately", () => {
  const mockItems: NotificationItem[] = [
    { id: "1", title: "Test 1", body: "Body 1", link: null, readAt: null },
    { id: "2", title: "Test 2", body: "Body 2", link: null, readAt: "2026-01-01T00:00:00Z" },
    { id: "3", title: "Test 3", body: "Body 3", link: null, readAt: null },
  ];

  assert.equal(getUnreadCount(mockItems), 2);
  assert.equal(getUnreadCount([]), 0);
});

test("filterNotifications filters by all vs unread", () => {
  const mockItems: NotificationItem[] = [
    { id: "1", title: "Test 1", body: "Body 1", link: null, readAt: null },
    { id: "2", title: "Test 2", body: "Body 2", link: null, readAt: "2026-01-01T00:00:00Z" },
  ];

  const all = filterNotifications(mockItems, "all");
  assert.equal(all.length, 2);

  const unreadOnly = filterNotifications(mockItems, "unread");
  assert.equal(unreadOnly.length, 1);
  assert.equal(unreadOnly[0].id, "1");
});
