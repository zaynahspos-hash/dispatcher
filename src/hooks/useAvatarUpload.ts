import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useToast } from '../components/common/Toast'
import { Settings } from '../utils/aiParser'
import { setCachedAvatar } from '../utils/avatarCache'

export function useAvatarUpload(
  user: any,
  updateSetting: (key: keyof Settings | Partial<Settings>, value?: string) => void
) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const toast = useToast()

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large. Please select an image under 5MB.')
      return
    }

    setUploadingAvatar(true)
    try {
      const reader = new FileReader()
      reader.onload = (loadEvt) => {
        const img = new Image()
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas')
            const size = 160
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas rendering context not available')

            const minDim = Math.min(img.width, img.height)
            const sx = (img.width - minDim) / 2
            const sy = (img.height - minDim) / 2
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)

            canvas.toBlob(async (blob) => {
              if (!blob) {
                toast.error('Failed to process image.')
                setUploadingAvatar(false)
                return
              }

              const userId = user?.id || 'guest'
              const userEmail = user?.email || ''
              const localDataUrl = canvas.toDataURL('image/webp', 0.85)
              const filePath = `${userId}/avatar-${Date.now()}.webp`

              const { error: uploadErr } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, {
                  contentType: 'image/webp',
                  upsert: true
                })

              if (uploadErr) {
                console.warn('[Avatar] Cloud upload failed, saving fallback locally:', uploadErr.message)
                setCachedAvatar(userId, localDataUrl, localDataUrl)
                if (userEmail) setCachedAvatar(userEmail, localDataUrl, localDataUrl)
                updateSetting('avatar_url', localDataUrl)
                toast.success('Profile photo updated.')
                setUploadingAvatar(false)
                return
              }

              const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
              const permanentUrl = `${urlData.publicUrl}?t=${Date.now()}`

              // Immediately warm the cache with the new permanentUrl and localDataUrl
              setCachedAvatar(userId, permanentUrl, localDataUrl)
              if (userEmail) setCachedAvatar(userEmail, permanentUrl, localDataUrl)

              // Sync to Supabase Auth metadata so user session always holds avatar
              if (user?.id) {
                supabase.auth.updateUser({ data: { avatar_url: permanentUrl } }).catch(e => {
                  console.warn('[Avatar] Auth metadata sync non-blocking error:', e)
                })
              }

              updateSetting('avatar_url', permanentUrl)
              toast.success('Profile photo updated.')
              setUploadingAvatar(false)
            }, 'image/webp', 0.85)
          } catch (err: any) {
            setUploadingAvatar(false)
            toast.error(err.message || 'Image processing failed')
          }
        }
        img.src = loadEvt.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setUploadingAvatar(false)
      toast.error(err.message || 'Failed to read image file')
    }
  }

  return { uploadingAvatar, handleAvatarFile }
}
