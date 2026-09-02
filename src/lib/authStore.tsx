import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from './supabaseClient'

type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

interface AuthResult {
  error: string | null
  needsEmailConfirmation?: boolean
}

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  accountsAvailable: boolean
  signUp: (email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<AuthResult>
  updatePassword: (newPassword: string) => Promise<AuthResult>
  deleteAccount: () => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return "Those details don't match."
  if (lower.includes('email not confirmed')) return 'Check your inbox to confirm your email first.'
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'An account with that email already exists.'
  }
  if (lower.includes('password') && lower.includes('least')) return message
  if (lower.includes('email') && (lower.includes('invalid') || lower.includes('valid'))) {
    return "That email doesn't look right."
  }
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(hasSupabaseConfig() ? 'loading' : 'signedOut')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setStatus(data.session ? 'signedIn' : 'signedOut')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setStatus(session ? 'signedIn' : 'signedOut')
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Accounts are not configured for this deployment.' }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: friendlyAuthError(error.message) }
    return { error: null, needsEmailConfirmation: !data.session }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Accounts are not configured for this deployment.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: friendlyAuthError(error.message) }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Accounts are not configured for this deployment.' }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    // Never reveal whether the email is registered — always report success here.
    if (error && !error.message.toLowerCase().includes('rate limit')) return { error: null }
    if (error) return { error: 'Please wait a moment before trying again.' }
    return { error: null }
  }, [])

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Accounts are not configured for this deployment.' }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: friendlyAuthError(error.message) }
    return { error: null }
  }, [])

  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return { error: 'Accounts are not configured for this deployment.' }
    const { error } = await supabase.rpc('delete_own_account')
    if (error) return { error: error.message }
    await supabase.auth.signOut()
    return { error: null }
  }, [])

  const value: AuthContextValue = {
    status,
    user,
    accountsAvailable: hasSupabaseConfig(),
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    deleteAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
