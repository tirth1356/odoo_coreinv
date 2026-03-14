import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  profile: any | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: any | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  initialize: () => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single()
      set({ profile: data })
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      set({ user, loading: false })
      if (user) fetchProfile(user.id)
    })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      set({ user })
      if (user) {
        fetchProfile(user.id)
      } else {
        set({ profile: null })
      }
    })
  },
}))
