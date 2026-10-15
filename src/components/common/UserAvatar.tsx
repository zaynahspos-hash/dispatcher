import React, { useState, useEffect } from 'react'

export interface UserAvatarProps {
  email?: string | null
  avatarUrl?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  rounded?: 'rounded-lg' | 'rounded-xl' | 'rounded-full'
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]', img: 'w-6 h-6' },
  sm: { box: 'w-7.5 h-7.5', text: 'text-xs', img: 'w-7.5 h-7.5' },
  md: { box: 'w-9 h-9', text: 'text-sm font-semibold', img: 'w-9 h-9' },
  lg: { box: 'w-12 h-12', text: 'text-base font-bold', img: 'w-12 h-12' },
  xl: { box: 'w-16 h-16', text: 'text-xl font-black', img: 'w-16 h-16' },
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  email,
  avatarUrl,
  name,
  size = 'sm',
  className = '',
  rounded = 'rounded-xl'
}) => {
  const [imgError, setImgError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Reset error state if email or avatarUrl changes
  useEffect(() => {
    setImgError(false)
    setLoaded(false)
  }, [email, avatarUrl])

  const cleanEmail = email?.trim().toLowerCase() || ''
  
  // Resolution:
  // 1. Explicit avatarUrl (e.g. Google OAuth picture or Supabase user_metadata)
  // 2. Universal Unavatar API (Google, Gmail, Gravatar, GitHub)
  const src = avatarUrl || (cleanEmail ? `https://unavatar.io/${encodeURIComponent(cleanEmail)}?fallback=false` : null)

  // Initial letter
  const initial = (name ? name[0] : (cleanEmail ? cleanEmail[0] : 'U')).toUpperCase()
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm

  if (!src || imgError) {
    return (
      <div
        className={`${sizeConfig.box} ${rounded} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-bold shrink-0 select-none shadow-xs ${sizeConfig.text} ${className}`}
        title={email || name || 'User Profile'}
      >
        {initial}
      </div>
    )
  }

  return (
    <div className={`relative ${sizeConfig.box} shrink-0 select-none ${className}`}>
      <img
        src={src}
        alt={name || email || 'Avatar'}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setImgError(true)}
        className={`${sizeConfig.img} ${rounded} object-cover border border-emerald-500/30 shadow-xs transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!loaded && (
        <div
          className={`absolute inset-0 ${sizeConfig.box} ${rounded} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold ${sizeConfig.text}`}
        >
          {initial}
        </div>
      )}
    </div>
  )
}

export default UserAvatar
