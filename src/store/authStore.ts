import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import type { Profile, Household } from '@/types/models';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  household: Household | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setHousehold: (household: Household | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      household: null,
      loading: true,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setHousehold: (household) => set({ household }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ user: null, profile: null, household: null }),
    }),
    {
      name: 'dakino-auth',
      partialize: (state) => ({ user: state.user, profile: state.profile, household: state.household }),
    }
  )
);
