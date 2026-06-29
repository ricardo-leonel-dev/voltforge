import { useEffect, useState } from 'react'

export function useUpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg)

      const checkForUpdate = () => reg.update()

      // Verificar cada 60 segundos (igual que Angular ~2 min)
      const interval = setInterval(checkForUpdate, 60 * 1000)

      // También verificar cuando el usuario vuelve a la pestaña
      document.addEventListener('visibilitychange', checkForUpdate)

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true)
          }
        })
      })

      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', checkForUpdate)
      }
    })
  }, [])

  const applyUpdate = () => {
    if (!registration?.waiting) return
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }

  return { updateAvailable, applyUpdate }
}
