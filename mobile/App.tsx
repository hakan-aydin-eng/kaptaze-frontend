/**
 * KAPTAZEAPPV5 React Native App
 * Türkçe mobil uygulama - iOS ve Android
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  AppState,
  LogBox,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FlashMessage from 'react-native-flash-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import PushNotification from 'react-native-push-notification';
import Geolocation from 'react-native-geolocation-service';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Context
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { CartProvider } from './src/context/CartContext';

// Services
import { NotificationService } from './src/services/NotificationService';
import { ApiService } from './src/services/ApiService';

// Theme
import { AppTheme } from './src/theme/AppTheme';

// Constants
import { APP_CONFIG } from './src/config/AppConfig';

// Utilities
import { Logger } from './src/utils/Logger';
import { CrashReporter } from './src/utils/CrashReporter';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
]);

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isNetworkConnected, setIsNetworkConnected] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      Logger.info('KAPTAZEAPPV5 uygulaması başlatılıyor...');

      // Initialize services
      await Promise.all([
        initializeNotifications(),
        initializeLocationServices(),
        initializeNetworkListener(),
        initializeAnalytics(),
        loadInitialData(),
      ]);

      // App is ready
      setIsReady(true);
      Logger.info('KAPTAZEAPPV5 başarıyla başlatıldı! 🚀');

    } catch (error) {
      Logger.error('Uygulama başlatma hatası:', error);
      CrashReporter.recordError(error as Error);
      // Still set ready to show error state
      setIsReady(true);
    }
  };

  const initializeNotifications = async () => {
    try {
      // Request notification permissions
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }

      // Configure push notifications
      PushNotification.configure({
        onRegister: function (token) {
          Logger.info('Push notification token alındı:', token.token);
          // Token'ı backend'e gönder
          ApiService.updatePushToken(token.token);
        },

        onNotification: function (notification) {
          Logger.info('Bildirim alındı:', notification);
          NotificationService.handleNotification(notification);
        },

        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },

        popInitialNotification: true,
        requestPermissions: true,
      });

      // Create notification channels for Android
      if (Platform.OS === 'android') {
        PushNotification.createChannel(
          {
            channelId: 'kaptaze-orders',
            channelName: 'Sipariş Bildirimleri',
            channelDescription: 'Sipariş durumu ile ilgili bildirimler',
            playSound: true,
            soundName: 'default',
            importance: 4,
            vibrate: true,
          },
          () => {},
        );

        PushNotification.createChannel(
          {
            channelId: 'kaptaze-promotions',
            channelName: 'Promosyon Bildirimleri',
            channelDescription: 'Özel teklifler ve promosyonlar',
            playSound: true,
            soundName: 'default',
            importance: 3,
            vibrate: false,
          },
          () => {},
        );
      }

    } catch (error) {
      Logger.error('Bildirim servisi başlatma hatası:', error);
    }
  };

  const initializeLocationServices = async () => {
    try {
      let hasLocationPermission = false;

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Konum İzni',
            message: 'KAPTAZEAPPV5 size en yakın restoranları bulabilmek için konum bilginize ihtiyaç duyar.',
            buttonNeutral: 'Sonra Sor',
            buttonNegative: 'İptal',
            buttonPositive: 'İzin Ver',
          },
        );
        hasLocationPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS için permission handling
        Geolocation.requestAuthorization('whenInUse');
        hasLocationPermission = true;
      }

      if (hasLocationPermission) {
        Logger.info('Konum izni verildi');
      } else {
        Logger.warn('Konum izni verilmedi');
      }

    } catch (error) {
      Logger.error('Konum servisi başlatma hatası:', error);
    }
  };

  const initializeNetworkListener = async () => {
    try {
      // Check initial network state
      const netInfoState = await NetInfo.fetch();
      setIsNetworkConnected(netInfoState.isConnected ?? false);

      // Listen for network changes
      const unsubscribe = NetInfo.addEventListener(state => {
        setIsNetworkConnected(state.isConnected ?? false);
        
        if (state.isConnected) {
          Logger.info('İnternet bağlantısı restore edildi');
          // Sync pending data
          ApiService.syncPendingRequests();
        } else {
          Logger.warn('İnternet bağlantısı kesildi');
        }
      });

      return unsubscribe;
    } catch (error) {
      Logger.error('Network listener başlatma hatası:', error);
    }
  };

  const initializeAnalytics = async () => {
    try {
      // Initialize Firebase Analytics or other analytics service
      Logger.info('Analytics servisi başlatıldı');
    } catch (error) {
      Logger.error('Analytics başlatma hatası:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      // Load cached user data
      const userData = await AsyncStorage.getItem('@kaptaze_user');
      if (userData) {
        Logger.info('Önbelleğe alınmış kullanıcı verisi yüklendi');
      }

      // Load app settings
      const appSettings = await AsyncStorage.getItem('@kaptaze_settings');
      if (appSettings) {
        Logger.info('Uygulama ayarları yüklendi');
      }

      // Pre-load critical data
      await ApiService.preloadCriticalData();

    } catch (error) {
      Logger.error('İlk veri yükleme hatası:', error);
    }
  };

  if (!isReady) {
    // Show splash screen or loading indicator
    return null; // Splash component will be shown
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={AppTheme}>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <NavigationContainer>
                <StatusBar
                  barStyle="light-content"
                  backgroundColor={AppTheme.colors.primary}
                  translucent={false}
                />
                
                <RootNavigator />
                
                {/* Global Flash Message */}
                <FlashMessage 
                  position="top" 
                  titleStyle={{ fontFamily: 'System', fontSize: 16 }}
                  textStyle={{ fontFamily: 'System', fontSize: 14 }}
                />
              </NavigationContainer>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;