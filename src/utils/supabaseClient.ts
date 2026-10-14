import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Add them to .env.local'
  )
}

// RULE D7: 100% Supabase JS client — zero Prisma, zero direct TCP, zero psql
// RULE D13: snake_case only in all table/column references
// RULE D14: UUID primary keys everywhere
// RULE D15: Multi-Tenant SaaS — RLS enforced at DB level via auth.uid() = user_id
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
)

/**
 * SSOT1: logUsage — writes an audit entry to usage_logs (snake_case table)
 * RULE C10: never blocks UI — fire-and-forget with silent retry-suppression
 */
export async function logUsage(action: string, details?: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return // Skip for unauthenticated sessions

    const { error } = await supabase.from('usage_logs').insert([
      {
        user_id: user.id,   // snake_case: user_id (UUID FK)
        action,
        details: details || null,
        // created_at auto-set by DB trigger
      },
    ])

    if (error) {
      console.error('[logUsage] Insert error:', error)
      return
    }

    // Auto-cleanup: retain only the latest 100 logs per tenant (RULE D15 — scoped by user_id)
    const MAX_LOGS = 100
    const { count } = await supabase
      .from('usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (count && count > MAX_LOGS) {
      const deleteCount = count - MAX_LOGS
      const { data: oldest } = await supabase
        .from('usage_logs')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(deleteCount)

      if (oldest && oldest.length > 0) {
        const idsToDelete = oldest.map((row: { id: string }) => row.id)
        await supabase
          .from('usage_logs')
          .delete()
          .in('id', idsToDelete)
      }
    }
  } catch (err) {
    console.error('[logUsage] Unexpected error:', err)
  }
}
