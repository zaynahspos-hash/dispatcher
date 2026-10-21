import React, { useState, useRef, useEffect } from 'react'
import { UserAvatar } from './UserAvatar'
import { useToast } from './Toast'
import { Settings } from '../../utils/groqParser'
import { useAvatarUpload } from '../../hooks/useAvatarUpload'
import { clearCachedAvatar } from '../../utils/avatarCache'
import { supabase } from '../../utils/supabaseClient'
import { PasswordSubTab } from './PasswordSubTab'
import { 
  MoonIcon, 
  SunIcon, 
  SettingsIcon,
  TruckIcon,
  BotIcon
} from '../Icons'

export interface UserAccountMenuProps {
  user: any
  settings: Settings
  updateSetting: (key: keyof Settings | Partial<Settings>, value?: string) => void
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
  onNavigateToSettings: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  isStandalone?: boolean
  isInstallable?: boolean
  onInstallApp?: () => void
  onOpenInstallGuide?: () => void
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  user,
  settings,
  updateSetting,
  isOpen,
  onClose,
  onLogout,
  onNavigateToSettings,
  theme,
  onToggleTheme,
  isStandalone,
  isInstallable: _isInstallable,
  onInstallApp,
  onOpenInstallGuide
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'password'>('profile')
  const { uploadingAvatar, handleAvatarFile } = useAvatarUpload(user, updateSetting)

  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen || !user) return null

  const effectiveAvatarUrl = settings.avatar_url || user?.user_metadata?.avatar_url || ''

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40 sm:hidden animate-fade-in"
      />

      {/* Floating Dropdown Menu Card (Anchored Top-Right) */}
      <div 
        ref={menuRef}
        className="fixed sm:absolute top-16 right-3 sm:right-6 sm:top-14 w-[calc(100vw-24px)] sm:w-96 max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* 1. Header Profile Banner */}
        <div className="p-4 sm:p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close user menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-3.5">
            {/* Avatar with live upload & spinner */}
            <div className="relative group shrink-0">
              <UserAvatar 
                email={user.email} 
                avatarUrl={effectiveAvatarUrl} 
                size="lg" 
              />
              {uploadingAvatar ? (
                <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-xl bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer text-[10px] font-bold"
                  title="Change Profile Photo"
                >
                  Edit
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                disabled={uploadingAvatar}
                className="hidden"
                onChange={handleAvatarFile}
              />
            </div>

            <div className="min-w-0 flex-1 pr-6">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {user.email?.split('@')[0]}
                </h3>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                {user.email}
              </p>

              <div className="flex items-center gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 cursor-pointer underline underline-offset-2 disabled:opacity-50"
                >
                  {uploadingAvatar ? 'Uploading...' : effectiveAvatarUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                {effectiveAvatarUrl && !uploadingAvatar && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (user?.id) clearCachedAvatar(user.id)
                        if (user?.email) clearCachedAvatar(user.email)
                        updateSetting('avatar_url', '')
                        if (user?.id) {
                          supabase.auth.updateUser({ data: { avatar_url: '' } }).catch(() => {})
                        }
                        toast.info('Profile photo removed.')
                      }}
                      className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Sub-tab Navigation (Profile Overview vs Security) */}
        <div className="px-4 py-2 bg-slate-50/60 dark:bg-slate-900/40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center ${
              activeSubTab === 'profile'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Account Details
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('password')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center ${
              activeSubTab === 'password'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* 3. Sub-tab Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {activeSubTab === 'profile' ? (
            <div className="space-y-3.5">
              {/* Status Badges Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                    <TruckIcon size={12} className="text-emerald-500" />
                    Courier Link
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${settings.postex_token ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    {settings.postex_token ? 'PostEx V3 Connected' : 'Not Connected'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                    <BotIcon size={12} className="text-indigo-500" />
                    AI Engine
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate uppercase">
                    {settings.ai_provider || 'Groq AI'}
                  </div>
                </div>
              </div>

              {/* PWA Install Recommendation (Visible on all devices & OS when not installed in standalone mode) */}
              {!isStandalone && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src="/apple-touch-icon.png?v=20261014" 
                      onError={(e) => { (e.target as HTMLImageElement).src = '/favicon-96x96.png?v=20261014' }} 
                      className="w-8 h-8 rounded-lg object-contain shrink-0 shadow-xs" 
                      alt="App Logo" 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                          Install Courier App
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Full-screen &amp; offline access on Mobile &amp; PC
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      if (onInstallApp) {
                        onInstallApp()
                      } else if (onOpenInstallGuide) {
                        onOpenInstallGuide()
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shrink-0 shadow-xs active:scale-95 transition cursor-pointer"
                  >
                    Install
                  </button>
                </div>
              )}

              {/* Shortcut to full Settings */}
              <button
                type="button"
                onClick={() => {
                  onNavigateToSettings()
                  onClose()
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <SettingsIcon size={14} />
                Open Full Settings & Integrations
              </button>
            </div>
          ) : (
            <PasswordSubTab user={user} />
          )}
        </div>

        {/* 4. Footer Controls: Theme Toggle & Logout */}
        <div className="p-3 bg-slate-50 dark:bg-[#080d17] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <SunIcon size={14} className="text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <MoonIcon size={14} className="text-indigo-400" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose()
              onLogout()
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
