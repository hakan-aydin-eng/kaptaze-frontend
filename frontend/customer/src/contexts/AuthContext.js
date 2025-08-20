// KapTaze Auth Context - Kullanıcı Kimlik Doğrulama Yönetimi
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { message } from 'antd';
import apiService from '../services/apiService';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOADING: 'LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
      
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
      
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    default:
      return state;
  }
};

// Context
const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Token'ı kontrol et
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('kaptaze_token');
        if (token) {
          // Token geçerliliğini kontrol et
          apiService.setToken(token);
          const response = await apiService.getCurrentUser();
          
          if (response.success) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: response.data,
                token: token
              }
            });
          } else {
            // Token geçersiz
            localStorage.removeItem('kaptaze_token');
            dispatch({ type: AUTH_ACTIONS.LOADING, payload: false });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth kontrol hatası:', error);
        localStorage.removeItem('kaptaze_token');
        dispatch({ type: AUTH_ACTIONS.LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  // Giriş yap
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOADING, payload: true });
      
      const response = await apiService.login(credentials);
      
      if (response.success) {
        const { user, token } = response.data;
        
        // Token'ı kaydet
        localStorage.setItem('kaptaze_token', token);
        apiService.setToken(token);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        });
        
        message.success(`Hoş geldiniz, ${user.ad}!`);
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: response.message || 'Giriş başarısız'
        });
        message.error(response.message || 'Giriş başarısız');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Bağlantı hatası';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Kayıt ol
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOADING, payload: true });
      
      const response = await apiService.register(userData);
      
      if (response.success) {
        const { user, token } = response.data;
        
        // Token'ı kaydet
        localStorage.setItem('kaptaze_token', token);
        apiService.setToken(token);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        });
        
        message.success(`Hesabınız başarıyla oluşturuldu, ${user.ad}!`);
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: response.message || 'Kayıt başarısız'
        });
        message.error(response.message || 'Kayıt başarısız');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Bağlantı hatası';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Çıkış yap
  const logout = async () => {
    try {
      // API'ye çıkış bildir
      await apiService.logout();
    } catch (error) {
      console.error('Logout API hatası:', error);
    } finally {
      // Local state'i temizle
      localStorage.removeItem('kaptaze_token');
      apiService.setToken(null);
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      message.info('Başarıyla çıkış yaptınız');
    }
  };

  // Profil güncelle
  const updateProfile = async (userData) => {
    try {
      const response = await apiService.updateProfile(userData);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: response.data
        });
        message.success('Profil başarıyla güncellendi');
        return { success: true, data: response.data };
      } else {
        message.error(response.message || 'Profil güncellenemedi');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profil güncellenirken hata oluştu';
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Şifre değiştir
  const changePassword = async (passwords) => {
    try {
      const response = await apiService.changePassword(passwords);
      
      if (response.success) {
        message.success('Şifre başarıyla değiştirildi');
        return { success: true };
      } else {
        message.error(response.message || 'Şifre değiştirilemedi');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Şifre değiştirilirken hata oluştu';
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Şifre sıfırlama isteği
  const forgotPassword = async (email) => {
    try {
      const response = await apiService.forgotPassword({ eposta: email });
      
      if (response.success) {
        message.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi');
        return { success: true };
      } else {
        message.error(response.message || 'Şifre sıfırlama isteği gönderilemedi');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'İşlem sırasında hata oluştu';
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Hata temizle
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;