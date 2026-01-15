import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

export const useAuth = () => {
  const { user, profile, loading, setUser, setProfile, setLoading, logout: logoutStore } = useAuthStore();

  useEffect(() => {
    // Verificar sesión actual
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const userProfile = await authService.getProfile(currentUser.id);
          setProfile(userProfile);
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
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUser, setProfile, setLoading]);

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
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
};
