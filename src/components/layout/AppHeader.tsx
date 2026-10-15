import { MenuIcon, AlertIcon, RefreshIcon, SunIcon, MoonIcon, SettingsIcon, DownloadIcon, SmartphoneIcon } from '../Icons'
import { UserAvatar } from '../common/UserAvatar'

interface AppHeaderProps {
  onOpenSidebar: () => void
  user: any
  dailyTokens: number
  monthlyTokens: number
  onLogout: () => void
  onOpenAuthModal: () => void
  isSettingsConfigured: boolean
  isInstallable: boolean
  isStandalone: boolean
  onInstallApp: () => void
  onOpenInstallGuide: () => void
  theme: string
  onToggleTheme: () => void
  activeTab: string
  setActiveTab: (tab: any) => void
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenSidebar,
  user,
  dailyTokens,
  monthlyTokens,
  onLogout,
  onOpenAuthModal,
  isSettingsConfigured,
  isInstallable,
  isStandalone,
  onInstallApp,
  onOpenInstallGuide,
  theme,
  onToggleTheme,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-6 py-2.5 sm:py-3 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Branding & Hamburger */}
        <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onOpenSidebar}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition cursor-pointer flex items-center justify-center shrink-0"
            title="Open Navigation Menu"
            aria-label="Open navigation menu"
          >
            <MenuIcon size={20} />
          </button>
          
          <div
            onClick={onOpenSidebar}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-85 active:scale-98 transition min-w-0 shrink-0 select-none group"
            title="Open Navigation Menu"
          >
            <img 
              src="/apple-touch-icon.png?v=20261014" 
              onError={(e) => { (e.target as HTMLImageElement).src = '/favicon-96x96.png?v=20261014' }} 
              className="w-8.5 h-8.5 sm:w-10 sm:h-10 object-contain shrink-0 group-hover:scale-105 transition-transform" 
              alt="Logo" 
            />
            <div className="min-w-0 max-w-[190px] sm:max-w-none">
              <h1 className="text-[15px] sm:text-lg font-bold text-gray-900 dark:text-white leading-tight truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Zaynahs Courier
              </h1>
              <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight hidden sm:block">
                WhatsApp → PostEx AI
              </p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-1.5 ml-1">
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold">
              PostEx
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* AI Usage Indicator */}
          {user && (
            <div 
              className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 px-2.5 py-1.5 rounded-xl shrink-0 select-none transition-all duration-200 self-center hover:bg-slate-200/60 dark:hover:bg-gray-750"
              title={`Today: ${dailyTokens.toLocaleString()} | Month: ${monthlyTokens.toLocaleString()} tokens`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-gray-300 font-medium">
                <span className="hidden md:inline text-[9px] text-slate-500 dark:text-gray-400 uppercase tracking-wider font-bold">AI Usage:</span>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] text-slate-500 dark:text-gray-400 font-normal">Today</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {dailyTokens >= 1000 ? `${(dailyTokens / 1000).toFixed(1)}k` : dailyTokens}
                  </span>
                </div>
                
                <span className="text-slate-300 dark:text-gray-600">|</span>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] text-slate-500 dark:text-gray-400 font-normal">Month</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {monthlyTokens >= 1000000 ? `${(monthlyTokens / 1000000).toFixed(2)}M` : monthlyTokens >= 1000 ? `${(monthlyTokens / 1000).toFixed(1)}k` : monthlyTokens}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* User Profile / Auth */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <div 
                className="flex items-center gap-2 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 pl-1.5 pr-3 py-1 rounded-xl transition-colors duration-200" 
                title={user.email}
              >
                <UserAvatar email={user.email} size="xs" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[130px] truncate">
                  {user.email.split('@')[0]}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-xs bg-slate-200 hover:bg-slate-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-800 dark:text-gray-300 font-bold px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-gray-700/40 transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="hidden md:flex items-center gap-1.5 text-xs px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Configured warning */}
          {!isSettingsConfigured && (
            <>
              <span className="sm:hidden flex items-center justify-center w-8 h-8 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg transition-colors duration-200" title="Configure Settings first">
                <AlertIcon size={14} className="text-amber-600 dark:text-amber-400" />
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-3 py-1.5 rounded-lg transition-colors duration-200">
                <AlertIcon size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Configure Settings first</span>
              </span>
            </>
          )}

          {/* Install App Button */}
          {isInstallable ? (
            <>
              <button
                onClick={onInstallApp}
                className="sm:hidden flex items-center justify-center w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer animate-pulse shrink-0 text-sm"
                title="Install App"
              >
                <DownloadIcon size={16} />
              </button>
              <button
                onClick={onInstallApp}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer animate-pulse shrink-0"
                title="Install App"
              >
                <DownloadIcon size={14} />
                <span>Install App</span>
              </button>
            </>
          ) : !isStandalone ? (
            <>
              <button
                onClick={onOpenInstallGuide}
                className="sm:hidden flex items-center justify-center w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0 animate-pulse text-sm"
                title="Install App Guide"
              >
                <SmartphoneIcon size={16} />
              </button>
              <button
                onClick={onOpenInstallGuide}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0 animate-pulse"
                title="Install App Guide"
              >
                <SmartphoneIcon size={14} />
                <span>Install App</span>
              </button>
            </>
          ) : null}

          {/* Refresh Page */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="p-1.5 sm:p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer flex items-center justify-center shrink-0 w-8 h-8 sm:w-9 sm:h-9 touch-manipulation"
            title="Refresh Page"
          >
            <RefreshIcon size={16} className="sm:size-4.5" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition cursor-pointer flex items-center justify-center shrink-0 w-8 h-8 sm:w-9 sm:h-9 touch-manipulation"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <SunIcon size={15} className="text-amber-500" /> : <MoonIcon size={15} className="text-gray-700 dark:text-gray-300" />}
          </button>

          {/* Desktop Settings Shortcut */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`hidden sm:flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <SettingsIcon size={16} />
            Settings
          </button>
        </div>
      </div>
    </header>
  )
}
