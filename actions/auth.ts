'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !password || !fullName || !confirmPassword) {
    return { error: 'All fields are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const supabase = await createClient()

  // 1. Sign up the user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    const admin = createAdminClient()
    const { error: pe } = await admin.from('profiles').upsert(
      {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        role: 'owner',
      },
      { onConflict: 'id' },
    )
    if (pe) {
      return { error: 'Profile creation failed: ' + pe.message }
    }
  }

  // Next.js actions should redirect when successful
  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
