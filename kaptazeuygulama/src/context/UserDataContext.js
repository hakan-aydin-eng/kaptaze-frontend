import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import apiService from '../services/apiService';

// Conditional Firebase messaging import for Expo Go compatibility
const isExpoGo = Constants.appOwnership === 'expo';
let messaging = null;
if (!isExpoGo) {
  messaging = require('@react-native-firebase/messaging').default;
  console.log('🔥 Firebase messaging loaded for standalone app');
} else {
  console.log('📱 Expo Go detected - Firebase messaging skipped');
}

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
  const [pushToken, setPushToken] = useState(null);
  const socketRef = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // AsyncStorage keys
  const STORAGE_KEYS = {
    CURRENT_USER: '@kaptaze_current_user',
    USER_TOKEN: '@kaptaze_user_token',
    FAVORITES: '@kaptaze_favorites',
    ORDERS: '@kaptaze_orders',
    NOTIFICATIONS: '@kaptaze_notifications',
  };

  // Get user-specific storage keys
  const getUserSpecificKeys = (userId) => ({
    FAVORITES: `@kaptaze_favorites_${userId}`,
    ORDERS: `@kaptaze_orders_${userId}`,
  });

  // Configure notifications
  useEffect(() => {
    setupNotifications();
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Load user data on app start
  useEffect(() => {
    loadUserData();
  }, []);

  // Socket.IO connection management + Push token setup
  useEffect(() => {
    if (currentUser) {
      // Initialize Socket.IO connection
      initializeSocket();

      // Send push token to backend if we have one
      if (pushToken) {
        sendPushTokenToBackend(pushToken);
      }
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
  }, [currentUser, pushToken]);

  // Update Socket.IO listeners when orders change
  useEffect(() => {
    if (socketRef.current && currentUser && orders.length > 0) {
      console.log('🔄 Orders changed, updating Socket.IO listeners');
      updateSocketListeners();
    }
  }, [orders, currentUser]);

  // Save notification to local storage
  const saveNotificationToStorage = async (notification) => {
    try {
      console.log('💾 Saving notification to local storage:', notification);

      // Get existing notifications
      const existingNotifications = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      let notifications = [];

      if (existingNotifications) {
        notifications = JSON.parse(existingNotifications);
      }

      // Create notification object
      const notificationObj = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: notification.title || 'KapTaze Bildirim',
        body: notification.body || '',
        timestamp: new Date().toISOString(),
        read: false,
        type: notification.data?.type || 'general',
        data: notification.data || {}
      };

      // Add to beginning of array (newest first)
      notifications.unshift(notificationObj);

      // Keep only last 100 notifications
      notifications = notifications.slice(0, 100);

      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      console.log('✅ Notification saved to storage successfully');

    } catch (error) {
      console.error('❌ Error saving notification to storage:', error);
    }
  };

  // Setup push notifications
  const setupNotifications = async () => {
    console.log('🔔 Setting up push notifications');

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Register for push notifications
    await registerForPushNotificationsAsync();

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received while app is open:', notification);

      // Save notification to local storage
      saveNotificationToStorage({
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data
      });

      // Show custom in-app notification or handle accordingly
      const { title, body } = notification.request.content;

      // You could show a custom toast here
      console.log(`📱 ${title}: ${body}`);
    });

    // This listener is fired whenever a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 User interacted with notification:', response);

      // Save notification to local storage if not already saved
      saveNotificationToStorage({
        title: response.notification.request.content.title,
        body: response.notification.request.content.body,
        data: response.notification.request.content.data
      });

      const notificationData = response.notification.request.content.data;

      // Handle different notification types
      if (notificationData?.type === 'order_status') {
        // Navigate to orders screen
        console.log('📋 Opening orders screen for order:', notificationData.orderId);
        // Navigation logic here if needed
      } else if (notificationData?.type === 'promotion') {
        // Navigate to promotions or specific restaurant
        console.log('🔥 Opening promotion:', notificationData.promotionId);
      }
    });
  };

  // Setup Firebase message handlers
  const setupFirebaseMessageHandlers = () => {
    console.log('🔔 Setting up Firebase message handlers');

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('🔔 Message handled in the background!', remoteMessage);

      // Save notification to local storage
      await saveNotificationToStorage({
        title: remoteMessage.notification?.title || 'KapTaze Bildirim',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data
      });
    });

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('🔔 Firebase message received while app is open:', remoteMessage);

      // Save notification to local storage
      await saveNotificationToStorage({
        title: remoteMessage.notification?.title || 'KapTaze Bildirim',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data
      });

      // Show custom in-app notification if needed
      const { title, body } = remoteMessage.notification || {};
      if (title && body) {
        console.log(`📱 ${title}: ${body}`);

        // You could also show a local notification here
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title,
            body: body,
            data: remoteMessage.data,
          },
          trigger: null, // Show immediately
        });
      }
    });

    return unsubscribe;
  };

  // Register for push notifications
  const registerForPushNotificationsAsync = async () => {
    console.log('📱 Registering for push notifications');

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#16a34a',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('🔐 Requesting notification permissions');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push token for push notification!');
        return;
      }

      try {
        if (messaging) {
          // Request Firebase messaging permission (only in standalone app)
          const authStatus = await messaging().requestPermission();
          const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                         authStatus === messaging.AuthorizationStatus.PROVISIONAL;

          if (enabled) {
            console.log('✅ Firebase messaging authorization status:', authStatus);

            // Get Firebase FCM token
            const fcmToken = await messaging().getToken();

          console.log('✅ Firebase FCM token obtained:', fcmToken);
          setPushToken(fcmToken);

          // Save token to AsyncStorage
          await AsyncStorage.setItem('@kaptaze_push_token', fcmToken);

            // Send token to backend (works without login)
            await sendPushTokenToBackend(fcmToken);
          } else {
            console.log('❌ Firebase messaging permission denied');
          }
        } else {
          // Expo Go fallback - use Expo push notifications instead
          console.log('📱 Expo Go detected - using Expo push notifications as fallback');
          const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
          console.log('✅ Expo push token obtained:', expoPushToken);
          setPushToken(expoPushToken);

          // Save token to AsyncStorage
          await AsyncStorage.setItem('@kaptaze_push_token', expoPushToken);

          // Send token to backend (works without login)
          await sendPushTokenToBackend(expoPushToken);
        }

      } catch (error) {
        console.log('❌ Error getting push token:', error);
      }
    } else {
      console.log('📱 Must use physical device for Push Notifications');
    }
  };

  // Send push token to backend
  const sendPushTokenToBackend = async (token) => {
    if (!token) {
      console.log('📱 No push token to send');
      return;
    }

    try {
      console.log('📤 Sending push token to backend');

      // Prepare token data
      const tokenData = {
        token: token,
        platform: Platform.OS,
        deviceInfo: {
          brand: Device.brand,
          model: Device.modelName,
          osVersion: Device.osVersion
        },
        deviceId: Device.osBuildId || Device.osInternalBuildId // Unique device identifier
      };

      // Add user info if logged in
      if (currentUser) {
        tokenData.userId = currentUser.id || currentUser._id;
        tokenData.consumerEmail = currentUser.email;
        console.log('📱 Sending push token with user info');
      } else {
        console.log('📱 Sending push token for anonymous device');
      }

      // API call to save device push token
      const response = await apiService.savePushToken(tokenData);

      if (response.success) {
        console.log('✅ Push token saved to backend:', response);
      } else {
        console.log('⚠️ Push token save response:', response.message);
      }

    } catch (error) {
      console.log('⚠️ Could not save push token:', error.message || 'Unknown error');
    }
  };

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

    userOrders.forEach((order, index) => {
      const orderIdentifier = order.id || order.pickupCode || order.orderNumber || 'unknown';
      console.log(`📋 Order ${index + 1}: ${orderIdentifier} - Backend ID: ${order.backendOrderId || 'MISSING'} - Status: ${order.status}`);

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
      } else {
        console.log(`❌ Order ${orderIdentifier} has no backendOrderId - cannot listen for updates!`);
        console.log(`📝 Order details for debugging:`, {
          id: order.id,
          pickupCode: order.pickupCode,
          backendOrderId: order.backendOrderId,
          restaurant: order.restaurant?.name,
          status: order.status
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

        // Sync favorites from backend if user is logged in
        if (savedToken) {
          await syncFavoritesFromBackend();
        }
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
        
        // Filter out old orders without backendOrderId
        const validOrders = ordersData.filter(order => {
          if (!order.backendOrderId) {
            console.log(`🗑️ Removing old order without backendOrderId: ${order.id || order.pickupCode || 'undefined'}`);
            return false;
          }
          return true;
        });
        
        console.log('✅ Valid orders count:', validOrders.length);
        setOrders(validOrders);
        
        // Update AsyncStorage if orders were removed
        if (validOrders.length !== ordersData.length) {
          console.log(`🧹 Cleaned ${ordersData.length - validOrders.length} old orders from storage`);
          await AsyncStorage.setItem(userKeys.ORDERS, JSON.stringify(validOrders));
        }
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

    try {
      // Add to backend first
      await apiService.addToFavorites(restaurant._id);

      // Then update local state
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
    } catch (error) {
      console.error('❌ Failed to add to favorites:', error);
      return false;
    }
  };

  const removeFromFavorites = async (restaurantId) => {
    if (!currentUser) return false;

    try {
      // Remove from backend first
      await apiService.removeFromFavorites(restaurantId);

      // Then update local state
      const userId = currentUser.email || currentUser.id;
      const updatedFavorites = favorites.filter(fav => fav._id !== restaurantId);
      setFavorites(updatedFavorites);
      const userKeys = getUserSpecificKeys(userId);
      await saveUserData(userKeys.FAVORITES, updatedFavorites);

      console.log('💔 Removed from favorites:', restaurantId);
      return true;
    } catch (error) {
      console.error('❌ Failed to remove from favorites:', error);
      return false;
    }
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

  

  // 🆕 SEÇENEK 2+3: Load orders from backend API
  const loadOrdersFromBackend = async () => {
    try {
      if (!currentUser?.id && !currentUser?._id) {
        console.log('⚠️ No user ID available, skipping backend order fetch');
        return;
      }

      const userId = currentUser.id || currentUser._id;
      console.log('📱 Fetching orders from backend for user:', userId);

      const result = await apiService.fetchUserOrders(userId);
      
      if (result.success && result.data) {
        console.log();
        
        // Transform backend orders to match local order structure
        const transformedOrders = result.data.map(order => ({
          id: order._id,
          backendOrderId: order._id,
          restaurant: {
            id: order.restaurant.id,
            name: order.restaurant.name,
            phone: order.restaurant.phone || '',
            address: order.restaurant.address || {}
          },
          items: order.items || [],
          totalAmount: order.pricing?.total || 0,
          status: order.status,
          paymentMethod: order.payment?.method || 'unknown',
          paymentStatus: order.payment?.status || 'pending',
          pickupCode: order.pickupCode || order.orderId,
          orderDate: order.orderDate || order.createdAt,
          notes: order.notes || ''
        }));

        setOrders(transformedOrders);
        await AsyncStorage.setItem('userOrders', JSON.stringify(transformedOrders));
        console.log('💾 Orders saved to AsyncStorage');
      } else {
        console.log('ℹ️ No orders found in backend');
      }
    } catch (error) {
      console.error('❌ Error loading orders from backend:', error);
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

  const updateOrderRating = async (orderId, ratingData) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? {
        ...order,
        rating: ratingData.rating,
        comment: ratingData.comment,
        ratingPhotos: ratingData.photos,
        isRated: ratingData.isRated || true,
        ratedAt: new Date().toISOString()
      } : order
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

  // Sync favorites from backend
  const syncFavoritesFromBackend = async () => {
    if (!currentUser) return;

    try {
      console.log('🔄 Syncing favorites from backend...');
      const response = await apiService.getFavorites();

      if (response.success && response.data?.favorites) {
        const serverFavorites = response.data.favorites;
        console.log(`📥 Found ${serverFavorites.length} favorites on server`);

        // Convert server favorites to local format
        const userId = currentUser.email || currentUser.id;
        const localFormattedFavorites = serverFavorites.map(restaurant => ({
          ...restaurant,
          addedAt: new Date().toISOString(),
          userId: userId,
        }));

        // Update local state and storage
        setFavorites(localFormattedFavorites);
        const userKeys = getUserSpecificKeys(userId);
        await saveUserData(userKeys.FAVORITES, localFormattedFavorites);

        console.log('✅ Favorites synced successfully');
      }
    } catch (error) {
      console.error('❌ Failed to sync favorites from backend:', error);
    }
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
    updateOrderRating,
    
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