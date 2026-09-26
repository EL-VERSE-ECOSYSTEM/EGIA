import test from 'node:test'
import assert from 'node:assert/strict'

// Helper functions that model accessibility attribute resolutions for FloatingSupportWidget

export function getSupportToggleAriaLabel(isOpen: boolean): string {
  return isOpen ? 'Close live support panel' : 'Open live support panel'
}

export function getWhatsAppAriaLabel(): string {
  return 'Contact WhatsApp Support (opens in a new tab)'
}

export function getEmailAriaLabel(email: string): string {
  return `Send email to Support at ${email}`
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
    const label = getWhatsAppAriaLabel()
    assert.match(label, /Contact WhatsApp Support/)
    assert.match(label, /opens in a new tab/)
  })

  await t.test('returns accessible Email link label', () => {
    const label = getEmailAriaLabel('elcoderssoftwares12@gmail.com')
    assert.match(label, /Send email to Support at elcoderssoftwares12@gmail.com/)
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
