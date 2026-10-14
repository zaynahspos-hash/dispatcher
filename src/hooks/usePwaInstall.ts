import { useState, useEffect } from 'react'

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const [installGuideTab, setInstallGuideTab] = useState<'ios' | 'android'>('ios')
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showMobileInstallBanner, setShowMobileInstallBanner] = useState(() => {
    return localStorage.getItem('hideMobileInstallBanner') !== 'true'
  })

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent) || 
                (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    setIsIOS(ios)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    setIsStandalone(!!standalone)
  }, [])

  useEffect(() => {
    if (showInstallGuide) {
      setInstallGuideTab(isIOS ? 'ios' : 'android')
    }
  }, [showInstallGuide, isIOS])

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallApp = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log('PWA install outcome:', outcome)
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  const dismissMobileBanner = () => {
    setShowMobileInstallBanner(false)
    localStorage.setItem('hideMobileInstallBanner', 'true')
  }

  return {
    isInstallable,
    isStandalone,
    isIOS,
    showMobileInstallBanner,
    dismissMobileBanner,
    showInstallGuide,
    setShowInstallGuide,
    installGuideTab,
    setInstallGuideTab,
    handleInstallApp
  }
}
