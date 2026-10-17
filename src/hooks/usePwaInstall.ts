import { useState, useEffect } from 'react'

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const [installGuideTab, setInstallGuideTab] = useState<'desktop' | 'ios' | 'android'>('desktop')
  const [isIOS, setIsIOS] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showMobileInstallBanner, setShowMobileInstallBanner] = useState(() => {
    // If not standalone, allow fresh refresh to prompt user again
    return sessionStorage.getItem('hideMobileInstallBanner') !== 'true'
  })

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent) || 
                (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    const mobile = /android|iphone|ipad|ipod/i.test(userAgent)
    setIsIOS(ios)
    setIsDesktop(!mobile)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    setIsStandalone(!!standalone)
  }, [])

  useEffect(() => {
    if (showInstallGuide) {
      if (isIOS) {
        setInstallGuideTab('ios')
      } else if (!isDesktop) {
        setInstallGuideTab('android')
      } else {
        setInstallGuideTab('desktop')
      }
    }
  }, [showInstallGuide, isIOS, isDesktop])

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
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log('PWA install outcome:', outcome)
      setDeferredPrompt(null)
      setIsInstallable(false)
    } else {
      // If browser doesn't offer prompt event (iOS, Safari, Firefox, or PC awaiting prompt), open tailored guide
      setShowInstallGuide(true)
    }
  }

  const dismissMobileBanner = () => {
    setShowMobileInstallBanner(false)
    sessionStorage.setItem('hideMobileInstallBanner', 'true')
  }

  return {
    isInstallable,
    isStandalone,
    isIOS,
    isDesktop,
    showMobileInstallBanner,
    dismissMobileBanner,
    showInstallGuide,
    setShowInstallGuide,
    installGuideTab,
    setInstallGuideTab,
    handleInstallApp
  }
}
