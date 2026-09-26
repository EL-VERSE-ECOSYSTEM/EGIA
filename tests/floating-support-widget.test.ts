import test from "node:test";
import assert from "node:assert/strict";
import { formatSupportToggleAriaLabel } from "../components/support/FloatingSupportWidget";

test("formatSupportToggleAriaLabel returns accessible label when panel is closed", () => {
  assert.equal(
    formatSupportToggleAriaLabel(false),
    "Need assistance? Open support panel"
  );
});

test("formatSupportToggleAriaLabel returns accessible label when panel is open", () => {
  assert.equal(
    formatSupportToggleAriaLabel(true),
    "Close support panel"
  );
});
