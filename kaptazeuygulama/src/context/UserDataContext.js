import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserDataContext = createContext();

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

export const UserDataProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage keys
  const STORAGE_KEYS = {
    CURRENT_USER: '@kaptaze_current_user',
    FAVORITES: '@kaptaze_favorites',
    ORDERS: '@kaptaze_orders',
  };

  // Load user data on app start
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      const [savedUser, savedFavorites, savedOrders] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
      ]);

      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }

      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  // User management
  const setUser = async (user) => {
    setCurrentUser(user);
    if (user) {
      await saveUserData(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    setFavorites([]);
    setOrders([]);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER),
      AsyncStorage.removeItem(STORAGE_KEYS.FAVORITES),
      AsyncStorage.removeItem(STORAGE_KEYS.ORDERS),
    ]);
  };

  // Favorites management
  const addToFavorites = async (restaurant) => {
    if (!currentUser) return false;
    
    const isAlreadyFavorite = favorites.some(fav => fav._id === restaurant._id);
    if (isAlreadyFavorite) return false;

    const updatedFavorites = [...favorites, {
      ...restaurant,
      addedAt: new Date().toISOString(),
      userId: currentUser.id || currentUser.email,
    }];

    setFavorites(updatedFavorites);
    await saveUserData(STORAGE_KEYS.FAVORITES, updatedFavorites);
    return true;
  };

  const removeFromFavorites = async (restaurantId) => {
    if (!currentUser) return false;

    const updatedFavorites = favorites.filter(fav => fav._id !== restaurantId);
    setFavorites(updatedFavorites);
    await saveUserData(STORAGE_KEYS.FAVORITES, updatedFavorites);
    return true;
  };

  const isFavorite = (restaurantId) => {
    return favorites.some(fav => fav._id === restaurantId);
  };

  const toggleFavorite = async (restaurant) => {
    if (!currentUser) return false;

    if (isFavorite(restaurant._id)) {
      return await removeFromFavorites(restaurant._id);
    } else {
      return await addToFavorites(restaurant);
    }
  };

  // Orders management
  const addOrder = async (orderData) => {
    if (!currentUser) return false;

    const newOrder = {
      id: `order_${Date.now()}`,
      userId: currentUser.id || currentUser.email,
      restaurant: orderData.restaurant,
      package: orderData.package,
      quantity: orderData.quantity,
      totalPrice: orderData.totalPrice,
      originalPrice: orderData.originalPrice,
      savings: orderData.originalPrice - orderData.totalPrice,
      status: 'pending', // pending, confirmed, ready, completed, cancelled
      pickupCode: `KB${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      orderDate: new Date().toISOString(),
      pickupTime: '18:00-21:00',
      paymentMethod: orderData.paymentMethod || 'credit_card',
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    await saveUserData(STORAGE_KEYS.ORDERS, updatedOrders);
    
    return newOrder;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    
    setOrders(updatedOrders);
    await saveUserData(STORAGE_KEYS.ORDERS, updatedOrders);
  };

  const getUserOrders = () => {
    if (!currentUser) return [];
    return orders.filter(order => order.userId === (currentUser.id || currentUser.email));
  };

  const getUserFavorites = () => {
    if (!currentUser) return [];
    return favorites.filter(fav => fav.userId === (currentUser.id || currentUser.email));
  };

  // Statistics
  const getUserStats = () => {
    const userOrders = getUserOrders();
    const completedOrders = userOrders.filter(order => order.status === 'completed');
    
    return {
      totalOrders: userOrders.length,
      completedOrders: completedOrders.length,
      totalSavings: completedOrders.reduce((sum, order) => sum + order.savings, 0),
      totalSpent: completedOrders.reduce((sum, order) => sum + order.totalPrice, 0),
      foodSaved: completedOrders.reduce((sum, order) => sum + (order.quantity * 1.2), 0), // Estimate kg
      co2Saved: completedOrders.reduce((sum, order) => sum + (order.quantity * 3.5), 0), // Estimate kg CO2
    };
  };

  const value = {
    // User state
    currentUser,
    isLoading,
    
    // User actions
    setUser,
    logout,
    
    // Favorites
    favorites: getUserFavorites(),
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    
    // Orders
    orders: getUserOrders(),
    addOrder,
    updateOrderStatus,
    
    // Stats
    getUserStats,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export default UserDataProvider;