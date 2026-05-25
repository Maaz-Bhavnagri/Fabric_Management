import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function requireSupabaseUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  return { ok: true as const, user: data.user }
}

