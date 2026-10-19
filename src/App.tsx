import { useState, useEffect } from 'react'
import PasteInput from './components/PasteInput'
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
import { DocumentVaultTab } from './components/vault/DocumentVaultTab'
import { PasteIcon, TableIcon, ResultsIcon, HistoryIcon, SettingsIcon, AppsIcon, FolderIcon, AdminIcon } from './components/Icons'
import { usePasswordRecovery } from './hooks/usePasswordRecovery'
import { useNavigationTabs, Tab } from './hooks/useNavigationTabs'
import { getSavedAirwayDocuments } from './utils/localPdfVault'
import { getCached, setCached, removeCached, getTTL } from './utils/cacheWithExpiry'
import { AppLayout } from './components/layout/AppLayout'
import { ToastProvider } from './components/common/Toast'
import { MobileInstallBanner } from './components/layout/MobileInstallBanner'
import { GlobalLoadingOverlay } from './components/layout/GlobalLoadingOverlay'
import { InstallGuideModal } from './components/layout/InstallGuideModal'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { SuspendedMerchantScreen } from './components/common/SuspendedMerchantScreen'

const ADMIN_EMAILS = [
  'shoaibzaynah@gmail.com',
  'zaynahspos@gmail.com',
  'totvoguepk@gmail.com',
  ...(import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',') : []),
  import.meta.env.VITE_ADMIN_EMAIL
].filter(Boolean).map(e => e.toLowerCase().trim())


export default function App() {
  const { settings, updateSetting, user, isBlocked, initialAuthChecked, logout } = useSettings()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

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
  const { isResetPasswordOpen, setIsResetPasswordOpen } = usePasswordRecovery()

  // Dismiss 0ms HTML preloader once initial auth check is resolved
  useEffect(() => {
    if (initialAuthChecked) {
      if (typeof (window as any).dismissAppPreloader === 'function') {
        (window as any).dismissAppPreloader()
      }
    }
  }, [initialAuthChecked])

  // User history and token usage sync
  const {
    history,
    updateHistory,
    dailyTokens,
    monthlyTokens,
    dailyRequests,
    fetchTokenUsage
  } = useUserHistorySync(user, settings.postex_token)

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
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#10b981')
    try { localStorage.setItem('parcel_app_theme', theme) } catch {}
  }, [theme])


  // Navigation tab routing state
  const { activeTab, setActiveTab } = useNavigationTabs(user, ADMIN_EMAILS)

  // Parcel operations (parsing, booking, printing, cancellation)
  const {
    parcels,
    setParcels,
    results,
    setResults,
    loading,
    loadingMessage,
    loadingProgress,
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
    updateSetting,
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

  const isAdmin = !!(user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim()))

  // Local Document Vault badges count
  const [vaultCount, setVaultCount] = useState<number>(() => {
    try {
      return getSavedAirwayDocuments(user?.id).length
    } catch {
      return 0
    }
  })

  useEffect(() => {
    const updateVaultCount = () => {
      try {
        setVaultCount(getSavedAirwayDocuments(user?.id).length)
      } catch {}
    }
    updateVaultCount()
    window.addEventListener('zaynah_vault_updated', updateVaultCount)
    return () => window.removeEventListener('zaynah_vault_updated', updateVaultCount)
  }, [user?.id])

  const tabConfig = [
    { id: 'paste' as Tab, label: 'Paste', mobileLabel: 'Paste', Icon: PasteIcon, badge: null },
    { id: 'table' as Tab, label: 'Parcels', mobileLabel: 'Parcels', Icon: TableIcon, badge: parcels.length || null },
    { id: 'results' as Tab, label: 'Results', mobileLabel: 'Results', Icon: ResultsIcon, badge: results.length || null },
    { id: 'history' as Tab, label: 'Booked History', mobileLabel: 'History', Icon: HistoryIcon, badge: null },
    { id: 'vault' as Tab, label: 'Document Vault', mobileLabel: 'Vault', Icon: FolderIcon, badge: vaultCount || null },
    { id: 'settings' as Tab, label: 'Settings', mobileLabel: 'Settings', Icon: SettingsIcon, badge: null },
    { id: 'apps' as Tab, label: 'All Apps', mobileLabel: 'Apps', Icon: AppsIcon, badge: null },
  ]

  if (isAdmin) {
    tabConfig.push({ id: 'admin' as Tab, label: 'Admin Control', mobileLabel: 'Admin', Icon: AdminIcon, badge: null })
  }

  const activeProvider = settings.ai_provider || 'groq'
  const activeKeyField = `${activeProvider}_api_key` as keyof Settings
  const isSettingsConfigured = !!(settings[activeKeyField] && settings.postex_token && settings.postex_pickup)

  if (!initialAuthChecked) {
    return null
  }

  if (!user) {
    return (
      <>
        <AuthPage onSuccess={() => {}} />
        {isResetPasswordOpen && (
          <ResetPasswordModal
            onClose={() => {
              setIsResetPasswordOpen(false)
              if (
                window.location.hash.includes('recovery') ||
                window.location.hash.includes('access_token') ||
                window.location.hash.includes('type=')
              ) {
                window.location.hash = '#paste'
              }
            }}
          />
        )}
      </>
    )
  }

  if (isBlocked && !isAdmin) {
    return <SuspendedMerchantScreen email={user.email} onLogout={logout} />
  }

  return (
    <ToastProvider>
      <AppLayout
        tabs={tabConfig}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        settings={settings}
        updateSetting={updateSetting}
        dailyTokens={dailyTokens}
        monthlyTokens={monthlyTokens}
        dailyRequests={dailyRequests}
        onLogout={() => logout()}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isSettingsConfigured={isSettingsConfigured}
        isInstallable={isInstallable}
        isStandalone={isStandalone}
        onInstallApp={handleInstallApp}
        onOpenInstallGuide={() => setShowInstallGuide(true)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        operationalCitiesCount={operationalCities.length}
        avatarUrl={settings.avatar_url || user?.user_metadata?.avatar_url}
      >
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

        <ErrorBoundary fallbackTitle="Section Error">
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
              updateSetting={updateSetting}
              history={history}
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
              updateSetting={updateSetting}
              userId={user?.id}
              history={history}
              onUpdateHistory={updateHistory}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'history' && (
            <BookedHistory
              settings={settings}
              history={history}
              onUpdateHistory={updateHistory}
              userId={user?.id}
            />
          )}
          {activeTab === 'vault' && (
            <DocumentVaultTab
              settings={settings}
              history={history}
              onUpdateHistory={updateHistory}
              userId={user?.id}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsPage
              settings={settings}
              updateSetting={updateSetting}
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
        </ErrorBoundary>
      </AppLayout>

      {/* Loading Overlay with Live Counters (Done/Remaining/Total) */}
      <GlobalLoadingOverlay
        loading={loading}
        message={loadingMessage}
        progress={loadingProgress}
      />

      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {isResetPasswordOpen && (
        <ResetPasswordModal
          onClose={() => {
            setIsResetPasswordOpen(false)
            if (
              window.location.hash.includes('recovery') ||
              window.location.hash.includes('access_token') ||
              window.location.hash.includes('type=')
            ) {
              window.location.hash = activeTab ? `#${activeTab}` : '#paste'
            }
          }}
        />
      )}

      {/* Install Guide Modal */}
      <InstallGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        installGuideTab={installGuideTab}
        setInstallGuideTab={setInstallGuideTab}
      />
    </ToastProvider>
  )
}
