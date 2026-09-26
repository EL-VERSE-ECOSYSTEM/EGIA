import test from 'node:test'
import assert from 'node:assert/strict'

// Helper functions that model accessibility attribute resolutions for FloatingSupportWidget

export function getSupportToggleAriaLabel(isOpen: boolean): string {
  return isOpen ? 'Close live support panel' : 'Open live support panel'
}

export function getWhatsAppAriaLabel(phoneNumber: string): string {
  return `Contact WhatsApp Support at ${phoneNumber} (opens in a new tab)`
}

export function isEscapeKey(key: string): boolean {
  return key === 'Escape'
}

export function getFormAriaAttributes(isRequired: boolean) {
  return {
    'aria-required': isRequired ? 'true' : 'false',
  }
}

test('FloatingSupportWidget Accessibility Helpers', async (t) => {
  await t.test('returns appropriate aria-label for toggle button state', () => {
    assert.equal(getSupportToggleAriaLabel(false), 'Open live support panel')
    assert.equal(getSupportToggleAriaLabel(true), 'Close live support panel')
  })

  await t.test('returns accessible WhatsApp link label', () => {
    const label = getWhatsAppAriaLabel('+2348061908715')
    assert.match(label, /Contact WhatsApp Support at \+2348061908715/)
    assert.match(label, /opens in a new tab/)
  })

  await t.test('detects Escape key correctly for modal dismissal', () => {
    assert.equal(isEscapeKey('Escape'), true)
    assert.equal(isEscapeKey('Enter'), false)
    assert.equal(isEscapeKey('Tab'), false)
  })

  await t.test('generates aria-required attributes for form fields', () => {
    assert.deepEqual(getFormAriaAttributes(true), { 'aria-required': 'true' })
    assert.deepEqual(getFormAriaAttributes(false), { 'aria-required': 'false' })
  })
})
