import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import apiService from '../services/apiService';

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
  const socketRef = useRef(null);

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

  // Socket.IO connection management
  useEffect(() => {
    if (currentUser) {
      // Initialize Socket.IO connection
      initializeSocket();
    } else {
      // Disconnect socket when user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser]);

  // Update Socket.IO listeners when orders change
  useEffect(() => {
    if (socketRef.current && currentUser && orders.length > 0) {
      console.log('🔄 Orders changed, updating Socket.IO listeners');
      updateSocketListeners();
    }
  }, [orders, currentUser]);

  const initializeSocket = () => {
    if (!currentUser || socketRef.current) return;

    console.log('🔌 Initializing Socket.IO connection for mobile app');

    try {
      const socket = io('https://kaptaze-backend-api.onrender.com', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      socket.on('connect', () => {
        console.log('✅ Mobile Socket.IO connected');
        // Update listeners when socket connects
        setTimeout(() => updateSocketListeners(), 1000);
      });

      socket.on('disconnect', () => {
        console.log('❌ Mobile Socket.IO disconnected');
      });

      socket.on('connect_error', (error) => {
        console.log('❌ Mobile Socket.IO connection error:', error);
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('❌ Socket.IO initialization failed:', error);
    }
  };

  const handleOrderStatusUpdate = (backendOrderId, newStatus) => {
    console.log(`📲 Updating order ${backendOrderId} to status: ${newStatus}`);

    const updatedOrders = orders.map(order => {
      if (order.backendOrderId === backendOrderId) {
        return { ...order, status: newStatus };
      }
      return order;
    });

    setOrders(updatedOrders);

    // Save to AsyncStorage
    const userId = currentUser?.email || currentUser?.id;
    if (userId) {
      const userKeys = getUserSpecificKeys(userId);
      saveUserData(userKeys.ORDERS, updatedOrders);
    }
  };

  const updateSocketListeners = () => {
    if (!socketRef.current || !currentUser) return;

    console.log('🔄 Updating Socket.IO listeners for orders');

    // Get current user's orders
    const userOrders = getUserOrders();
    console.log(`📱 Setting up listeners for ${userOrders.length} orders`);

    userOrders.forEach(order => {
      if (order.backendOrderId) {
        const orderEventName = `order-update-${order.backendOrderId}`;
        console.log(`📱 Listening for: ${orderEventName}`);

        // Remove existing listener first to prevent duplicates
        socketRef.current.off(orderEventName);

        // Add new listener
        socketRef.current.on(orderEventName, (updateData) => {
          console.log(`🔔 Order status update received for ${order.backendOrderId}:`, updateData);
          handleOrderStatusUpdate(order.backendOrderId, updateData.status);
        });
      }
    });
  };

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
        // Load user-specific data - prioritize email
        const userId = userData.email || userData.id;
        await loadUserSpecificData(userId);
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
      // Load user-specific data when user logs in - prioritize email
      const userId = user.email || user.id;
      await loadUserSpecificData(userId);
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

    const userId = currentUser.email || currentUser.id;
    const updatedFavorites = [...favorites, {
      ...restaurant,
      addedAt: new Date().toISOString(),
      userId: userId,
    }];

    console.log('➕ Adding to favorites:', restaurant.name);
    console.log('❤️ User:', userId);
    console.log('📍 New favorites count:', updatedFavorites.length);

    setFavorites(updatedFavorites);
    const userKeys = getUserSpecificKeys(userId);
    console.log('💾 Saving to key:', userKeys.FAVORITES);
    await saveUserData(userKeys.FAVORITES, updatedFavorites);
    return true;
  };

  const removeFromFavorites = async (restaurantId) => {
    if (!currentUser) return false;

    const userId = currentUser.email || currentUser.id;
    const updatedFavorites = favorites.filter(fav => fav._id !== restaurantId);
    setFavorites(updatedFavorites);
    const userKeys = getUserSpecificKeys(userId);
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

    const userId = currentUser.email || currentUser.id;

    // Get restaurant operating hours for pickup time
    const restaurant = orderData.restaurant;
    let pickupTime = '18:00-21:00'; // fallback

    if (restaurant?.operatingHours?.open && restaurant?.operatingHours?.close) {
      pickupTime = `${restaurant.operatingHours.open}-${restaurant.operatingHours.close}`;
    }

    // Generate pickup code
    const pickupCode = `KB${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    try {
      // First, send order to backend
      console.log('📤 Sending order to backend...');
      const backendOrderData = {
        customer: {
          id: currentUser.id || currentUser._id,
          name: currentUser.name || currentUser.firstName || 'Müşteri',
          phone: currentUser.phone || '05XX XXX XX XX',
          address: 'Restorana gelip alacak' // For pickup orders
        },
        restaurantId: restaurant._id,
        items: [{
          productId: orderData.package._id || orderData.package.id,
          name: orderData.package.name,
          price: orderData.package.price || orderData.package.salePrice,
          quantity: orderData.quantity,
          total: orderData.totalPrice
        }],
        totalAmount: orderData.totalPrice,
        paymentMethod: orderData.paymentMethod === 'credit_card' ? 'cash' : orderData.paymentMethod,
        notes: `Mobil uygulama rezervasyonu - Kod: ${pickupCode}`
      };

      console.log('📦 Backend order data:', backendOrderData);
      const backendResponse = await apiService.createOrder(backendOrderData);
      console.log('✅ Backend response:', backendResponse);

      // Create local order object with backend response data
      const newOrder = {
        id: backendResponse.data?._id || `order_${Date.now()}`, // Use backend ID if available
        userId: userId,
        restaurant: orderData.restaurant,
        package: orderData.package,
        quantity: orderData.quantity,
        totalPrice: orderData.totalPrice,
        originalPrice: orderData.originalPrice,
        savings: orderData.originalPrice - orderData.totalPrice,
        status: 'pending', // pending, confirmed, ready, completed, cancelled
        pickupCode: pickupCode,
        orderDate: new Date().toISOString(),
        pickupTime: pickupTime,
        paymentMethod: orderData.paymentMethod || 'credit_card',
        backendOrderId: backendResponse.data?._id, // Store backend ID for sync
      };

      // Save to local storage
      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      const userKeys = getUserSpecificKeys(userId);
      await saveUserData(userKeys.ORDERS, updatedOrders);

      console.log('💾 Order saved locally and sent to backend successfully');
      return newOrder;

    } catch (error) {
      console.error('❌ Error creating order:', error);

      // If backend fails, still create local order for user experience
      console.log('⚠️ Backend failed, creating local-only order');
      const newOrder = {
        id: `order_${Date.now()}`,
        userId: userId,
        restaurant: orderData.restaurant,
        package: orderData.package,
        quantity: orderData.quantity,
        totalPrice: orderData.totalPrice,
        originalPrice: orderData.originalPrice,
        savings: orderData.originalPrice - orderData.totalPrice,
        status: 'pending',
        pickupCode: pickupCode,
        orderDate: new Date().toISOString(),
        pickupTime: pickupTime,
        paymentMethod: orderData.paymentMethod || 'credit_card',
        localOnly: true, // Mark as local-only for later sync
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      const userKeys = getUserSpecificKeys(userId);
      await saveUserData(userKeys.ORDERS, updatedOrders);

      return newOrder;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );

    setOrders(updatedOrders);
    const userId = currentUser?.email || currentUser?.id;
    if (userId) {
      const userKeys = getUserSpecificKeys(userId);
      await saveUserData(userKeys.ORDERS, updatedOrders);
    }
  };

  const getUserOrders = () => {
    if (!currentUser) return [];
    const userId = currentUser.email || currentUser.id;
    return orders.filter(order => order.userId === userId);
  };

  const getUserFavorites = () => {
    if (!currentUser) return [];
    const userId = currentUser.email || currentUser.id;
    return favorites.filter(fav => fav.userId === userId);
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