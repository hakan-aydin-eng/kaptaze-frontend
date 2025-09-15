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
  const [userToken, setUserToken] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage keys
  const STORAGE_KEYS = {
    CURRENT_USER: '@kaptaze_current_user',
    USER_TOKEN: '@kaptaze_user_token',
    FAVORITES: '@kaptaze_favorites',
    ORDERS: '@kaptaze_orders',
  };

  // Get user-specific storage keys
  const getUserSpecificKeys = (userId) => ({
    FAVORITES: `@kaptaze_favorites_${userId}`,
    ORDERS: `@kaptaze_orders_${userId}`,
  });

  // Load user data on app start
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      const [savedUser, savedToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
        AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN),
      ]);

      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        // Load user-specific data
        await loadUserSpecificData(userData.email || userData.id);
      }

      if (savedToken) {
        setUserToken(savedToken);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserSpecificData = async (userId) => {
    if (!userId) return;

    try {
      const userKeys = getUserSpecificKeys(userId);
      console.log('🔍 Loading data for user:', userId);
      console.log('📍 Storage keys:', userKeys);

      const [savedFavorites, savedOrders] = await Promise.all([
        AsyncStorage.getItem(userKeys.FAVORITES),
        AsyncStorage.getItem(userKeys.ORDERS),
      ]);

      console.log('❤️ Saved favorites found:', !!savedFavorites);
      console.log('📦 Saved orders found:', !!savedOrders);

      if (savedFavorites) {
        const favoritesData = JSON.parse(savedFavorites);
        console.log('❤️ Parsed favorites count:', favoritesData.length);
        setFavorites(favoritesData);
      } else {
        setFavorites([]);
      }

      if (savedOrders) {
        const ordersData = JSON.parse(savedOrders);
        console.log('📦 Parsed orders count:', ordersData.length);
        setOrders(ordersData);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading user-specific data:', error);
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
  const setUser = async (user, token = null) => {
    setCurrentUser(user);
    if (token) {
      setUserToken(token);
    }

    if (user) {
      await saveUserData(STORAGE_KEYS.CURRENT_USER, user);
      // Load user-specific data when user logs in
      await loadUserSpecificData(user.email || user.id);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }

    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
    } else if (user === null) {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    }
  };

  const logout = async () => {
    const userId = currentUser?.id || currentUser?.email;

    setCurrentUser(null);
    setUserToken(null);
    setFavorites([]);
    setOrders([]);

    const removalPromises = [
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN),
    ];

    // Clear user-specific data if user was logged in
    if (userId) {
      const userKeys = getUserSpecificKeys(userId);
      removalPromises.push(
        AsyncStorage.removeItem(userKeys.FAVORITES),
        AsyncStorage.removeItem(userKeys.ORDERS)
      );
    }

    await Promise.all(removalPromises);
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

    console.log('➕ Adding to favorites:', restaurant.name);
    console.log('❤️ User:', currentUser.email || currentUser.id);
    console.log('📍 New favorites count:', updatedFavorites.length);

    setFavorites(updatedFavorites);
    const userKeys = getUserSpecificKeys(currentUser.id || currentUser.email);
    console.log('💾 Saving to key:', userKeys.FAVORITES);
    await saveUserData(userKeys.FAVORITES, updatedFavorites);
    return true;
  };

  const removeFromFavorites = async (restaurantId) => {
    if (!currentUser) return false;

    const updatedFavorites = favorites.filter(fav => fav._id !== restaurantId);
    setFavorites(updatedFavorites);
    const userKeys = getUserSpecificKeys(currentUser.id || currentUser.email);
    await saveUserData(userKeys.FAVORITES, updatedFavorites);
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
    const userKeys = getUserSpecificKeys(currentUser.id || currentUser.email);
    await saveUserData(userKeys.ORDERS, updatedOrders);

    return newOrder;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );

    setOrders(updatedOrders);
    const userKeys = getUserSpecificKeys(currentUser.id || currentUser.email);
    await saveUserData(userKeys.ORDERS, updatedOrders);
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
    userToken,
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