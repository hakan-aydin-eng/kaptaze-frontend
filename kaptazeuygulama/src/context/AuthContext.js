import React, { createContext, useContext } from 'react';
import { useUserData } from './UserDataContext';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { currentUser, userToken, setUser, logout: userLogout, isLoading } = useUserData();

  const login = async (userData, token = null) => {
    await setUser(userData, token);
    return userData;
  };

  const logout = async () => {
    await userLogout();
  };

  const value = {
    user: currentUser,
    token: userToken,
    isLoading,
    login,
    logout,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;