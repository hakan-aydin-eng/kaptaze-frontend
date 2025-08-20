/**
 * KAPTAZEAPPV5 - Authentication Context
 * Kullanıcı kimlik doğrulama yönetimi
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/ApiService';
import { Logger } from '../utils/Logger';
import { showMessage } from 'react-native-flash-message';

// Types
interface User {
  id: string;
  ad: string;
  soyad: string;
  eposta: string;
  telefon?: string;
  konum?: {
    sehir: string;
    ilce: string;
    enlem?: number;
    boylam?: number;
  };
  istatistikler: {
    kurtarilanPaket: number;
    tasarruf: number;
    co2Tasarrufu: number;
  };
  misafirMi?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
}

interface AuthContextType extends AuthState {
  login: (eposta: string, sifre: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  loginAsGuest: () => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
}

interface RegisterData {
  ad: string;
  soyad: string;
  eposta: string;
  telefon?: string;
  sifre: string;
}

// Action Types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_GUEST'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_TOKEN'; payload: string };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
      };
    
    case 'LOGIN_GUEST':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isGuest: true,
        isLoading: false,
      };
    
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    
    case 'SET_TOKEN':
      return {
        ...state,
        token: action.payload,
      };
    
    default:
      return state;
  }
};

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,
};

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkStoredAuth();
  }, []);

  // Stored authentication check
  const checkStoredAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('@kaptaze_token'),
        AsyncStorage.getItem('@kaptaze_user'),
      ]);

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        
        // Validate token
        const isValid = await validateToken(storedToken);
        
        if (isValid) {
          dispatch({
            type: user.misafirMi ? 'LOGIN_GUEST' : 'LOGIN_SUCCESS',
            payload: { user, token: storedToken },
          });
          
          ApiService.setAuthToken(storedToken);
          Logger.info('Kullanıcı otomatik giriş yaptı');
        } else {
          // Token expired, clear storage
          await clearStoredAuth();
        }
      }
    } catch (error) {
      Logger.error('Stored auth kontrol hatası:', error);
      await clearStoredAuth();
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Validate token
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await ApiService.validateToken(token);
      return response.basarili;
    } catch (error) {
      return false;
    }
  };

  // Clear stored authentication
  const clearStoredAuth = async () => {
    await Promise.all([
      AsyncStorage.removeItem('@kaptaze_token'),
      AsyncStorage.removeItem('@kaptaze_user'),
    ]);
  };

  // Store authentication
  const storeAuth = async (user: User, token: string) => {
    await Promise.all([
      AsyncStorage.setItem('@kaptaze_token', token),
      AsyncStorage.setItem('@kaptaze_user', JSON.stringify(user)),
    ]);
  };

  // Login
  const login = async (eposta: string, sifre: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.login(eposta, sifre);
      
      if (response.basarili) {
        const { kullanici, token } = response;
        
        await storeAuth(kullanici, token);
        ApiService.setAuthToken(token);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: kullanici, token },
        });

        showMessage({
          message: 'Giriş Başarılı! 🎉',
          description: `Hoş geldiniz ${kullanici.ad}`,
          type: 'success',
          duration: 3000,
        });

        Logger.info('Kullanıcı giriş yaptı:', kullanici.eposta);
        return true;
      } else {
        showMessage({
          message: 'Giriş Hatası',
          description: response.mesaj || 'E-posta veya şifre hatalı',
          type: 'danger',
          duration: 4000,
        });
        return false;
      }
    } catch (error) {
      Logger.error('Login hatası:', error);
      showMessage({
        message: 'Bağlantı Hatası',
        description: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
        type: 'danger',
        duration: 4000,
      });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Register
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.register(userData);
      
      if (response.basarili) {
        const { kullanici, token } = response;
        
        await storeAuth(kullanici, token);
        ApiService.setAuthToken(token);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: kullanici, token },
        });

        showMessage({
          message: 'Kayıt Başarılı! 🎉',
          description: `Hoş geldiniz ${kullanici.ad}! Hesabınız oluşturuldu.`,
          type: 'success',
          duration: 4000,
        });

        Logger.info('Yeni kullanıcı kaydı:', kullanici.eposta);
        return true;
      } else {
        showMessage({
          message: 'Kayıt Hatası',
          description: response.mesaj || 'Kayıt işlemi başarısız',
          type: 'danger',
          duration: 4000,
        });
        return false;
      }
    } catch (error) {
      Logger.error('Register hatası:', error);
      showMessage({
        message: 'Kayıt Hatası',
        description: 'Kayıt işlemi sırasında bir hata oluştu',
        type: 'danger',
        duration: 4000,
      });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Guest login
  const loginAsGuest = async (): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.loginAsGuest();
      
      if (response.basarili) {
        const { kullanici, token } = response;
        
        await storeAuth(kullanici, token);
        ApiService.setAuthToken(token);
        
        dispatch({
          type: 'LOGIN_GUEST',
          payload: { user: kullanici, token },
        });

        showMessage({
          message: 'Misafir Girişi',
          description: 'Uygulamayı keşfetmeye başlayın! Sipariş vermek için kayıt olmanız gerekebilir.',
          type: 'info',
          duration: 4000,
        });

        Logger.info('Misafir kullanıcı girişi');
        return true;
      }
      return false;
    } catch (error) {
      Logger.error('Guest login hatası:', error);
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Clear server-side session if needed
      if (state.token) {
        await ApiService.logout(state.token);
      }
      
      // Clear local storage
      await clearStoredAuth();
      ApiService.clearAuthToken();
      
      dispatch({ type: 'LOGOUT' });

      showMessage({
        message: 'Çıkış Yapıldı',
        description: 'Başarıyla çıkış yaptınız',
        type: 'success',
        duration: 2000,
      });

      Logger.info('Kullanıcı çıkış yaptı');
    } catch (error) {
      Logger.error('Logout hatası:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update profile
  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.updateProfile(userData);
      
      if (response.basarili) {
        const updatedUser = { ...state.user, ...userData } as User;
        
        await AsyncStorage.setItem('@kaptaze_user', JSON.stringify(updatedUser));
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });

        showMessage({
          message: 'Profil Güncellendi',
          description: 'Profil bilgileriniz başarıyla güncellendi',
          type: 'success',
          duration: 3000,
        });

        return true;
      } else {
        showMessage({
          message: 'Güncelleme Hatası',
          description: response.mesaj || 'Profil güncellenirken hata oluştu',
          type: 'danger',
          duration: 4000,
        });
        return false;
      }
    } catch (error) {
      Logger.error('Profile update hatası:', error);
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Refresh token
  const refreshToken = async (): Promise<boolean> => {
    try {
      if (!state.token) return false;
      
      const response = await ApiService.refreshToken(state.token);
      
      if (response.basarili) {
        const newToken = response.token;
        await AsyncStorage.setItem('@kaptaze_token', newToken);
        dispatch({ type: 'SET_TOKEN', payload: newToken });
        ApiService.setAuthToken(newToken);
        return true;
      }
      return false;
    } catch (error) {
      Logger.error('Token refresh hatası:', error);
      return false;
    }
  };

  // Delete account
  const deleteAccount = async (): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.deleteAccount();
      
      if (response.basarili) {
        await clearStoredAuth();
        ApiService.clearAuthToken();
        dispatch({ type: 'LOGOUT' });

        showMessage({
          message: 'Hesap Silindi',
          description: 'Hesabınız başarıyla silindi',
          type: 'success',
          duration: 3000,
        });

        return true;
      } else {
        showMessage({
          message: 'Silme Hatası',
          description: response.mesaj || 'Hesap silinirken hata oluştu',
          type: 'danger',
          duration: 4000,
        });
        return false;
      }
    } catch (error) {
      Logger.error('Account delete hatası:', error);
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    loginAsGuest,
    updateProfile,
    refreshToken,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth hook, AuthProvider içinde kullanılmalıdır');
  }
  return context;
};