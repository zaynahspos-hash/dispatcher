import React from 'react'
import { ChevronRightIcon, RefreshIcon, SunIcon, MoonIcon, DownloadIcon } from '../Icons'
import { UserAvatar } from '../common/UserAvatar'

interface MobileMoreScreenProps {
  user: any
  userDisplayName: string
  avatarUrl?: string
  vaultCount: number
  isAdmin: boolean
  isSettingsConfigured: boolean
  isInstallable: boolean
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onRefreshApp: () => void
  onInstallApp: () => void
  onLogout: () => void
  onNavigate: (tabId: string) => void
}

export const MobileMoreScreen: React.FC<MobileMoreScreenProps> = ({
  user,
  userDisplayName,
  avatarUrl,
  vaultCount,
  isAdmin,
  isSettingsConfigured,
  isInstallable,
  theme,
  onToggleTheme,
  onRefreshApp,
  onInstallApp,
  onLogout,
  onNavigate
}) => {
  return (
    <div className="min-[860px]:hidden space-y-4 px-3 pb-8">
      {/* 1. Merchant Identity Card */}
      <div className="ios-grp">
        <div className="ios-row tap">
          <UserAvatar email={user?.email} avatarUrl={avatarUrl} size="md" />
          <div className="flex-1 min-w-0 ml-1">
            <b className="text-[15px] font-semibold text-[var(--tx)] truncate block">
              {userDisplayName}
            </b>
            <span className="text-[13px] text-[var(--t2)] truncate block">
              {user?.email || 'Authenticated Merchant'}
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--acs)] text-[var(--ac)] shrink-0">
            Active
          </span>
        </div>
      </div>

      {/* 2. Document Vault */}
      <div>
        <div className="text-[11px] font-semibold tracking-wider text-[var(--t2)] uppercase px-2 mb-1.5">
          Documents
        </div>
        <div className="ios-grp">
          <div 
            onClick={() => onNavigate('vault')}
            className="ios-row tap cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <b className="text-[15px] font-medium text-[var(--tx)] block">Document vault</b>
              <span className="text-[13px] text-[var(--t2)] block">Saved airway bills & manifests</span>
            </div>
            {vaultCount > 0 && (
              <span className="text-[13px] font-medium text-[var(--t2)] mr-1">
                {vaultCount} batches
              </span>
            )}
            <ChevronRightIcon size={16} className="text-[var(--t3)] shrink-0" />
          </div>
        </div>
      </div>

      {/* 3. Settings Modules */}
      <div>
        <div className="text-[11px] font-semibold tracking-wider text-[var(--t2)] uppercase px-2 mb-1.5 flex items-center justify-between">
          <span>Settings</span>
          {!isSettingsConfigured && (
            <span className="text-[10px] font-bold text-[var(--dg)] bg-[var(--dgs)] px-1.5 py-0.2 rounded">
              Incomplete
            </span>
          )}
        </div>
        <div className="ios-grp divide-y divide-[var(--bd)]">
          <div 
            onClick={() => onNavigate('settings')}
            className="ios-row tap cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <b className="text-[15px] font-medium text-[var(--tx)] block">PostEx courier settings</b>
              <span className="text-[13px] text-[var(--t2)] block">API token, pickup & return origin</span>
            </div>
            <ChevronRightIcon size={16} className="text-[var(--t3)] shrink-0" />
          </div>

          <div 
            onClick={() => onNavigate('settings')}
            className="ios-row tap cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <b className="text-[15px] font-medium text-[var(--tx)] block">AI engine</b>
              <span className="text-[13px] text-[var(--t2)] block">Groq LLaMA, Gemini & custom keys</span>
            </div>
            <ChevronRightIcon size={16} className="text-[var(--t3)] shrink-0" />
          </div>

          <div 
            onClick={() => onNavigate('settings')}
            className="ios-row tap cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <b className="text-[15px] font-medium text-[var(--tx)] block">WhatsApp messaging</b>
              <span className="text-[13px] text-[var(--t2)] block">Automated templates & anti-ban timer</span>
            </div>
            <ChevronRightIcon size={16} className="text-[var(--t3)] shrink-0" />
          </div>

          <div 
            onClick={() => onNavigate('settings')}
            className="ios-row tap cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <b className="text-[15px] font-medium text-[var(--tx)] block">Order defaults</b>
              <span className="text-[13px] text-[var(--t2)] block">Default items, weight, pieces & city</span>
            </div>
            <ChevronRightIcon size={16} className="text-[var(--t3)] shrink-0" />
          </div>
        </div>
      </div>

      {/* 4. Ecosystem & Administration */}
      <div>
        <div className="text-[11px] font-semibold tracking-wider text-[var(--t2)] uppercase px-2 mb-1.5">
          Ecosystem
        </div>
        <div className="ios-grp divide-y divide-[var(--bd)]">
          <div 
            onClick={() => onNavigate('apps')}
            className="ios-row tap cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <b className="text-[15px] font-medium text-[var(--tx)] block">All apps</b>
              <span className="text-[13px] text-[var(--t2)] block">Zaynah POS Manager & tools</span>
            </div>
            <ChevronRightIcon size={16} className="text-[var(--t3)] shrink-0" />
          </div>

          {isAdmin && (
            <div 
              onClick={() => onNavigate('admin')}
              className="ios-row tap cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <b className="text-[15px] font-medium text-[var(--tx)] block">Admin control</b>
                <span className="text-[13px] text-[var(--t2)] block">Merchants overview & customer CRM</span>
              </div>
              <ChevronRightIcon size={16} className="text-[var(--t3)] shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* 5. Device & Preferences */}
      <div>
        <div className="text-[11px] font-semibold tracking-wider text-[var(--t2)] uppercase px-2 mb-1.5">
          Preferences
        </div>
        <div className="ios-grp divide-y divide-[var(--bd)]">
          {/* Dark Mode Switch */}
          <div className="ios-row justify-between">
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? <MoonIcon size={18} className="text-[var(--ac)]" /> : <SunIcon size={18} className="text-amber-500" />}
              <b className="text-[15px] font-medium text-[var(--tx)]">Dark mode</b>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 cursor-pointer relative ${
                theme === 'dark' ? 'bg-[var(--ac)]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label="Toggle dark mode"
            >
              <div 
                className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Refresh App */}
          <div 
            onClick={onRefreshApp}
            className="ios-row tap cursor-pointer"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <RefreshIcon size={18} className="text-[var(--t2)]" />
              <b className="text-[15px] font-medium text-[var(--tx)]">Refresh app</b>
            </div>
            <span className="text-[12px] text-[var(--t2)]">Fetch latest update</span>
          </div>

          {/* Install App */}
          {isInstallable && (
            <div 
              onClick={onInstallApp}
              className="ios-row tap cursor-pointer"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <DownloadIcon size={18} className="text-[var(--ac)]" />
                <b className="text-[15px] font-medium text-[var(--ac)]">Install app</b>
              </div>
              <ChevronRightIcon size={16} className="text-[var(--ac)]" />
            </div>
          )}
        </div>
      </div>

      {/* 6. Sign Out Button */}
      <div className="ios-grp">
        <button
          type="button"
          onClick={onLogout}
          className="ios-row tap w-full justify-center text-center cursor-pointer text-[var(--dg)] font-semibold text-[15px]"
        >
          Sign out
        </button>
      </div>

      <div className="text-center text-[11px] text-[var(--t3)] pt-2 pb-4">
        Zaynahs Courier • PostEx AI Dispatcher v3.0
      </div>
    </div>
  )
}
