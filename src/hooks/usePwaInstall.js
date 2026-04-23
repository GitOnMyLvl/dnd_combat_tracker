import { useEffect, useState } from 'react'

function detectIos() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isIPhoneOrIPad = /iPad|iPhone|iPod/.test(ua)
  const isIPadDesktop = ua.includes('Mac') && typeof document !== 'undefined' && 'ontouchend' in document
  return isIPhoneOrIPad || isIPadDesktop
}

function detectStandalone() {
  if (typeof window === 'undefined') return false
  const mq = window.matchMedia?.('(display-mode: standalone)')
  return (mq && mq.matches) || window.navigator.standalone === true
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(() => detectStandalone())
  const [isIos] = useState(() => detectIos())

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return null
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return choice?.outcome ?? null
  }

  return {
    canInstall: !!deferredPrompt,
    isInstalled,
    isIos: isIos && !isInstalled,
    promptInstall,
  }
}
