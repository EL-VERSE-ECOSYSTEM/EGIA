'use client'

/**
 * Requests browser permission for showing native device/system notifications.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('This device/browser does not support native notifications.')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (err) {
    console.error('Error requesting notification permission:', err)
    return false
  }
}

/**
 * Dispatches a native device/system notification to the user's device.
 * Attempts to utilize Service Worker registration for PWA compatibility,
 * falling back to the standard web Notification constructor if unavailable.
 */
export async function sendDeviceNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (typeof window === 'undefined') return

  if (!('Notification' in window)) {
    console.warn('Notification API not supported on this device/browser.')
    return
  }

  // Request permission if not already handled
  if (Notification.permission === 'default') {
    const granted = await requestNotificationPermission()
    if (!granted) return
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission was denied by the user.')
    return
  }

  const defaultOptions: NotificationOptions = {
    icon: '/logo.svg',
    badge: '/logo.svg',
    vibrate: [200, 100, 200],
    ...options,
  }

  // Check if a service worker is registered and ready (best practice for PWA notifications)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, defaultOptions)
        return
      }
    } catch (err) {
      console.warn('Service Worker notification dispatch failed, falling back to window.Notification:', err)
    }
  }

  // Fallback to standard window Notification
  try {
    new Notification(title, defaultOptions)
  } catch (err) {
    console.error('Failed to dispatch standard Notification fallback:', err)
  }
}
