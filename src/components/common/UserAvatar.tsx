import React, { useState, useEffect } from 'react'
import { getCachedAvatar, cacheRemoteImageAsDataUrl } from '../../utils/avatarCache'

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
  const cleanEmail = email?.trim().toLowerCase() || ''
  const cachedDataUrl = getCachedAvatar(cleanEmail, avatarUrl)
  const [cachedSrc, setCachedSrc] = useState<string | null>(cachedDataUrl)
  const [imgError, setImgError] = useState(false)
  const [loaded, setLoaded] = useState(!!cachedDataUrl)

  // Reset state and invalidate cache when email or avatarUrl changes
  useEffect(() => {
    setImgError(false)
    const freshCached = getCachedAvatar(cleanEmail, avatarUrl)
    setCachedSrc(freshCached)
    setLoaded(!!freshCached)
  }, [cleanEmail, avatarUrl])

  // Active display source: priority is cached Data URL for 0ms load, then remote URL
  const activeSrc = cachedSrc || avatarUrl || null

  // Background caching of remote URL if not yet cached
  useEffect(() => {
    if (avatarUrl && !cachedSrc && cleanEmail && !avatarUrl.startsWith('data:')) {
      cacheRemoteImageAsDataUrl(cleanEmail, avatarUrl).then(dataUrl => {
        if (dataUrl) setCachedSrc(dataUrl)
      })
    }
  }, [avatarUrl, cachedSrc, cleanEmail])

  // Initial letter
  const initial = (name ? name[0] : (cleanEmail ? cleanEmail[0] : 'U')).toUpperCase()
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm

  if (!activeSrc || imgError) {
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
        src={activeSrc}
        alt={name || email || 'Avatar'}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (cachedSrc && activeSrc !== cachedSrc) {
            setCachedSrc(cachedSrc)
          } else {
            setImgError(true)
          }
        }}
        className={`${sizeConfig.img} ${rounded} object-cover border border-emerald-500/30 shadow-xs transition-opacity duration-150 ${
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
