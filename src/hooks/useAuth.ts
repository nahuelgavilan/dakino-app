import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { householdService } from '@/services/household.service';

export const useAuth = () => {
  const { user, profile, household, loading, setUser, setProfile, setHousehold, setLoading, logout: logoutStore } = useAuthStore();

  // Función para cargar el hogar del usuario
  const loadHousehold = useCallback(async (userId: string) => {
    try {
      const userHousehold = await householdService.getMyHousehold(userId);
      setHousehold(userHousehold);
    } catch (error) {
      console.error('Error loading household:', error);
      setHousehold(null);
    }
  }, [setHousehold]);

  // Función para refrescar el hogar (útil después de unirse/abandonar)
  const refreshHousehold = useCallback(async () => {
    if (user) {
      await loadHousehold(user.id);
    }
  }, [user, loadHousehold]);

  useEffect(() => {
    // Verificar sesión actual
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const userProfile = await authService.getProfile(currentUser.id);
          setProfile(userProfile);
          await loadHousehold(currentUser.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios de autenticación
    const { data: authListener } = authService.onAuthStateChange(async (newUser) => {
      setUser(newUser);

      if (newUser) {
        const userProfile = await authService.getProfile(newUser.id);
        setProfile(userProfile);
        await loadHousehold(newUser.id);
      } else {
        setProfile(null);
        setHousehold(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUser, setProfile, setHousehold, setLoading, loadHousehold]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.signIn(email, password);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      await authService.signUp(email, password, fullName);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      logoutStore();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    profile,
    household,
    loading,
    signIn,
    signUp,
    signOut,
    refreshHousehold,
    isAuthenticated: !!user,
  };
};
