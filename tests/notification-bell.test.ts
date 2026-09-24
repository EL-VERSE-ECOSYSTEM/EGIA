import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getNotificationBellAriaLabel } from "../lib/notifications/bell-utils";

describe("NotificationBell helper functions and accessibility", () => {
  it("generates correct aria-label when unread count is 0", () => {
    const label = getNotificationBellAriaLabel(0);
    assert.equal(label, "Notifications, no unread notifications");
  });

  it("generates correct aria-label when unread count is 1", () => {
    const label = getNotificationBellAriaLabel(1);
    assert.equal(label, "Notifications, 1 unread notification");
  });

  it("generates correct aria-label when unread count is greater than 1", () => {
    const label = getNotificationBellAriaLabel(5);
    assert.equal(label, "Notifications, 5 unread notifications");
  });
});
