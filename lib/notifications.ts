'use client'

import { toast } from 'sonner'

export interface MultiChannelNotificationPayload {
  title: string
  body: string
  type?: 'PAYMENT' | 'ASSESSMENT' | 'ANNOUNCEMENT' | 'GENERAL' | string
  data?: Record<string, any>
  link?: string
  showToast?: boolean
  showPopup?: boolean
  sendDevicePush?: boolean
}

/**
 * Dispatches notification across multiple channels simultaneously:
 * 1. Toast Notification (Sonner)
 * 2. Pop-up Modal / Alert Notification
 * 3. Native Device Push Notification (FCM / Web Notification)
 */
export async function dispatchMultiChannelNotification(payload: MultiChannelNotificationPayload) {
  const {
    title,
    body,
    type = 'GENERAL',
    link,
    showToast = true,
    showPopup = false,
    sendDevicePush = true,
  } = payload

  // 1. Toast Notification Channel (Sonner)
  if (showToast && typeof window !== 'undefined') {
    toast(title, {
      description: body,
      action: link ? {
        label: 'View',
        onClick: () => { window.location.href = link }
      } : undefined,
    })
  }

  // 2. Pop-up Modal Channel (Custom Event for Global Listener)
  if (showPopup && typeof window !== 'undefined') {
    const popupEvent = new CustomEvent('el_app_notification_popup', {
      detail: { title, body, type, link, timestamp: new Date().toISOString() }
    })
    window.dispatchEvent(popupEvent)
  }

  // 3. Native Device Notification Channel
  if (sendDevicePush && typeof window !== 'undefined') {
    await sendDeviceNotification(title, {
      body,
      data: { link: link || '/dashboard', type }
    })
  }
}

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

  const defaultOptions = {
    icon: '/logo.svg',
    badge: '/logo.svg',
    // vibrate is not present on all NotificationOptions typings; keep for runtime but cast to any
    vibrate: [200, 100, 200],
    ...options,
  } as any

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
