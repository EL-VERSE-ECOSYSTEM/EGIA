export function getPaymentMethodLabel(method: string | null | undefined) {
  if (!method || /paystack/i.test(method)) return 'Online Payment'
  return method
}
