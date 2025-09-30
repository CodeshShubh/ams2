import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'staff';
  avatar: string | null;
  isActive: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getProfile();
        setUser(response.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        authApi.logout(); // Clear invalid token
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const response = await authApi.login(email, password);
      setUser(response.user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${response.user.name}`,
      });
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: message,
      });
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    toast({
      title: "Goodbye!",
      description: "You have been logged out successfully.",
    });
  };

  const register = async (userData: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role?: 'admin' | 'staff';
  }) => {
    setIsAuthenticating(true);
    try {
      const response = await authApi.register(userData);
      setUser(response.user);
      toast({
        title: "Account created!",
        description: `Welcome to AttendanceTracker, ${response.user.name}!`,
      });
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: message,
      });
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticating,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };
}