import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Verificar se o token ainda é válido
          const response = await authAPI.getProfile();
          setUser(response.data.data.user);
          setToken(storedToken);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { user: userData, token: newToken } = response.data.data;
      
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      // Forçar atualização do estado para sincronizar com React Router
      window.dispatchEvent(new Event('storage'));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Falha no login. Verifique suas credenciais.';
      throw new Error(errorMessage);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authAPI.register(name, email, password);
      const { user: userData, token: newToken } = response.data.data;
      
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      // Forçar atualização do estado para sincronizar com React Router
      window.dispatchEvent(new Event('storage'));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Falha no registro. Tente novamente.';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prevUser => prevUser ? { ...prevUser, ...userData } : null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};