import { useState, useEffect } from 'react'
import PasteInput from './components/PasteInput'
import { supabase } from './utils/supabaseClient'
import AuthModal from './components/AuthModal'
import AdminPanel from './components/AdminPanel'
import AuthPage from './components/AuthPage'
import ResetPasswordModal from './components/ResetPasswordModal'
import ParcelTable from './components/ParcelTable'
import BookingResults, { BookingResult } from './components/BookingResults'
import SettingsPage from './components/SettingsPage'
import OtherApps from './components/OtherApps'
import { Settings } from './utils/groqParser'
import { getOperationalCities } from './utils/postexApi'
import { useSettings } from './hooks/useSettings'
import { useParcelOperations } from './hooks/useParcelOperations'
import { useUserHistorySync } from './hooks/useUserHistorySync'
import { usePwaInstall } from './hooks/usePwaInstall'
import { CITY_LIST } from './utils/cityList'
import { BookedHistory } from './components/BookedHistory'
import { PasteIcon, TableIcon, ResultsIcon, HistoryIcon, SettingsIcon, AppsIcon } from './components/Icons'
import { getCached, setCached, removeCached, getTTL } from './utils/cacheWithExpiry'
import { AppHeader } from './components/layout/AppHeader'
import { DesktopTabBar } from './components/layout/DesktopTabBar'
import { MobileInstallBanner } from './components/layout/MobileInstallBanner'
import { BottomTabBar } from './components/layout/BottomTabBar'
import { MobileNavDrawer } from './components/layout/MobileNavDrawer'
import { GlobalLoadingOverlay } from './components/layout/GlobalLoadingOverlay'
import { InstallGuideModal } from './components/layout/InstallGuideModal'

type Tab = 'paste' | 'table' | 'results' | 'history' | 'settings' | 'admin' | 'apps'

export default function App() {
  const { settings, updateSetting, user, initialAuthChecked, logout } = useSettings()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // PWA install lifecycle
  const {
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
  } = usePwaInstall()

  // Password recovery listener
  useEffect(() => {
    if (window.location.hash.includes('recovery=true') || window.location.hash.includes('type=recovery')) {
      setIsResetPasswordOpen(true)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordOpen(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // User history and token usage sync
  const {
    history,
    updateHistory,
    dailyTokens,
    monthlyTokens,
    fetchTokenUsage
  } = useUserHistorySync(user)

  // Theme management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('parcel_app_theme')
      return (saved as 'light' | 'dark') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#3b82f6')
    try { localStorage.setItem('parcel_app_theme', theme) } catch {}
  }, [theme])

  // Keyboard shortcut (Escape closes sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try {
      const hash = window.location.hash.replace('#', '') as Tab
      if (['paste', 'table', 'results', 'history', 'settings', 'admin', 'apps'].includes(hash)) {
        return hash
      }
      const saved = localStorage.getItem('parcel_app_active_tab')
      return (saved as Tab) || 'paste'
    } catch {
      return 'paste'
    }
  })

  useEffect(() => {
    window.location.hash = activeTab
    try {
      localStorage.setItem('parcel_app_active_tab', activeTab)
    } catch (e) {
      console.error('Error saving activeTab:', e)
    }
  }, [activeTab])

  // Sync state if user changes hash in the address bar directly
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Tab
      if (['paste', 'table', 'results', 'history', 'settings', 'admin', 'apps'].includes(hash)) {
        if (hash === 'admin') {
          const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'shoaibzaynah@gmail.com'
          if (user && user.email === adminEmail) {
            setActiveTab(hash)
          } else {
            window.location.hash = activeTab
          }
        } else {
          setActiveTab(hash)
        }
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [user, activeTab])

  // Parcel operations (parsing, booking, printing, cancellation)
  const {
    parcels,
    setParcels,
    results,
    setResults,
    loading,
    loadingMessage,
    loadingLabels,
    handleParse,
    handleBookAll,
    handleBookSelected,
    handleBookSingle,
    handlePrintLabels,
    handleCancelOrder,
  } = useParcelOperations({
    settings,
    user,
    history,
    updateHistory,
    setActiveTab,
    fetchTokenUsage,
  })

  // Cache results per-user
  useEffect(() => {
    if (!user) {
      setResults([])
      return
    }
    const resultsKey = `booking_results_${user.id}`
    const cachedResults = getCached<BookingResult[]>(resultsKey) || []
    if (results.length === 0 && cachedResults.length > 0) {
      setResults(cachedResults)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const resultsKey = `booking_results_${user.id}`
    if (results.length > 0) {
      setCached(resultsKey, results, getTTL('hours', 12))
    } else {
      removeCached(resultsKey)
    }
  }, [results, user])

  // Operational cities caching
  const [operationalCities, setOperationalCities] = useState<string[]>(CITY_LIST)

  useEffect(() => {
    if (settings.postex_token) {
      getOperationalCities(settings.postex_token).then(cities => {
        if (cities && cities.length > 0) {
          const combined = Array.from(new Set([...cities, ...CITY_LIST]))
          setOperationalCities(combined)
        }
      }).catch(err => {
        console.error('Error fetching operational cities:', err)
      })
    }
  }, [settings.postex_token])

  const AdminIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} style={{ width: size, height: size }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )

  const isAdmin = user && user.email === (import.meta.env.VITE_ADMIN_EMAIL || 'shoaibzaynah@gmail.com')

  const tabConfig = [
    { id: 'paste' as Tab, label: 'Paste', mobileLabel: 'Paste', Icon: PasteIcon, badge: null },
    { id: 'table' as Tab, label: 'Parcels', mobileLabel: 'Parcels', Icon: TableIcon, badge: parcels.length || null },
    { id: 'results' as Tab, label: 'Results', mobileLabel: 'Results', Icon: ResultsIcon, badge: results.length || null },
    { id: 'history' as Tab, label: 'Booked History', mobileLabel: 'History', Icon: HistoryIcon, badge: history.length || null },
    { id: 'settings' as Tab, label: 'Settings', mobileLabel: 'Settings', Icon: SettingsIcon, badge: null },
    { id: 'apps' as Tab, label: 'Other Apps', mobileLabel: 'Apps', Icon: AppsIcon, badge: null },
  ]

  if (isAdmin) {
    tabConfig.push({ id: 'admin' as Tab, label: 'Admin Control', mobileLabel: 'Admin', Icon: AdminIcon, badge: null })
  }

  const activeProvider = settings.ai_provider || 'groq'
  const activeKeyField = `${activeProvider}_api_key` as keyof Settings
  const isSettingsConfigured = !!(settings[activeKeyField] && settings.postex_token && settings.postex_pickup)

  if (!initialAuthChecked) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Syncing merchant session...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <AuthPage onSuccess={() => {}} />
        {isResetPasswordOpen && (
          <ResetPasswordModal
            onClose={() => setIsResetPasswordOpen(false)}
          />
        )}
      </>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 font-sans overflow-hidden transition-colors duration-200">
      {/* Header */}
      <AppHeader
        onOpenSidebar={() => setIsSidebarOpen(true)}
        user={user}
        dailyTokens={dailyTokens}
        monthlyTokens={monthlyTokens}
        onLogout={() => logout()}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isSettingsConfigured={isSettingsConfigured}
        isInstallable={isInstallable}
        isStandalone={isStandalone}
        onInstallApp={handleInstallApp}
        onOpenInstallGuide={() => setShowInstallGuide(true)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Tabs — Desktop only (mobile uses bottom nav) */}
      <DesktopTabBar
        tabs={tabConfig}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <main className="max-w-[1440px] mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-8">
          {/* PWA Install Banner (Mobile-friendly, dismissible) */}
          <MobileInstallBanner
            isStandalone={isStandalone}
            showBanner={showMobileInstallBanner}
            isInstallable={isInstallable}
            isIOS={isIOS}
            onInstall={handleInstallApp}
            onOpenIOSGuide={() => setShowInstallGuide(true)}
            onDismiss={dismissMobileBanner}
          />

          {activeTab === 'paste' && (
            <PasteInput
              onParse={handleParse}
              onExcelParse={(parsedParcels) => {
                setParcels(parsedParcels)
                setActiveTab('table')
              }}
              loading={loading}
            />
          )}
          {activeTab === 'table' && (
            <ParcelTable
              parcels={parcels}
              setParcels={setParcels}
              onBookAll={handleBookAll}
              onBookSelected={handleBookSelected}
              loading={loading}
              settings={settings}
              cities={operationalCities}
            />
          )}
          {activeTab === 'results' && (
            <BookingResults
              results={results}
              setResults={setResults}
              onPrintLabels={handlePrintLabels}
              loadingLabels={loadingLabels}
              onCancelShipment={handleCancelOrder}
              settings={settings}
              cities={operationalCities}
              onBookSingle={handleBookSingle}
            />
          )}
          {activeTab === 'history' && (
            <BookedHistory
              settings={settings}
              history={history}
              onUpdateHistory={updateHistory}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsPage
              settings={settings}
              updateSetting={updateSetting}
              onSave={() => setActiveTab('paste')}
              cities={operationalCities}
              user={user}
            />
          )}
          {activeTab === 'admin' && isAdmin && (
            <AdminPanel />
          )}
          {activeTab === 'apps' && (
            <OtherApps />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomTabBar
        tabs={tabConfig}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Left Sidebar Menu Drawer */}
      <MobileNavDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        tabs={tabConfig}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        dailyTokens={dailyTokens}
        monthlyTokens={monthlyTokens}
        onLogout={() => logout()}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        isInstallable={isInstallable}
        isStandalone={isStandalone}
        onInstallApp={handleInstallApp}
        onOpenInstallGuide={() => setShowInstallGuide(true)}
      />

      {/* Loading Overlay */}
      <GlobalLoadingOverlay
        loading={loading}
        message={loadingMessage}
      />

      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {isResetPasswordOpen && (
        <ResetPasswordModal
          onClose={() => setIsResetPasswordOpen(false)}
        />
      )}

      {/* Install Guide Modal */}
      <InstallGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        installGuideTab={installGuideTab}
        setInstallGuideTab={setInstallGuideTab}
      />
    </div>
  )
}
