/**
 * Single Source of Truth for Admin Access and Email Whitelist
 * Strictly reads from environment variables (Vercel / .env.local):
 * - VITE_ADMIN_EMAILS (comma, semicolon, or whitespace separated list)
 * - VITE_ADMIN_EMAIL (single primary admin email)
 *
 * ZERO hardcoded admin emails in the codebase.
 */

export const getAdminEmails = (): string[] => {
  const envSources = [
    import.meta.env.VITE_ADMIN_EMAILS || '',
    import.meta.env.VITE_ADMIN_EMAIL || '',
  ]

  const list: string[] = []

  envSources.forEach(source => {
    if (!source || typeof source !== 'string') return
    // Split by comma, semicolon, space, or newline
    source.split(/[,;\s]+/).forEach(entry => {
      const email = entry.toLowerCase().trim()
      if (email && email.includes('@') && !list.includes(email)) {
        list.push(email)
      }
    })
  })

  return list
}

export const checkIsAdmin = (userEmail?: string | null): boolean => {
  if (!userEmail) return false
  const clean = userEmail.toLowerCase().trim()
  const adminEmails = getAdminEmails()
  return adminEmails.includes(clean)
}
