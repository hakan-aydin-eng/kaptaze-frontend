import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import Constants from 'expo-constants';

// Conditional Firebase initialization for Expo Go compatibility
const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo) {
  // Initialize Firebase only in standalone app (production/development builds)
  require('@react-native-firebase/app');
  console.log('🔥 Firebase initialized for standalone app');
} else {
  console.log('📱 Expo Go detected - Firebase skipped for development');
}

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import MainScreen from './src/screens/MainScreen';
import RestaurantDetailScreen from './src/screens/RestaurantDetailScreen';
import NearbyScreen from './src/screens/NearbyScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PurchaseScreen from './src/screens/PurchaseScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import MapScreen from './src/screens/MapScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import AboutScreen from './src/screens/AboutScreen';
import SupportScreen from './src/screens/SupportScreen';
import RatingScreen from './src/screens/RatingScreen';
import OpportunityFinderScreen from './src/screens/OpportunityFinderScreen';
import UserDataProvider from './src/context/UserDataContext';
import AuthProvider, { useAuth } from './src/context/AuthContext';
import SplashScreen from './src/components/SplashScreen';

const Stack = createStackNavigator();

// App Navigator Component with authentication check
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingTitle}>🌱 KapTaze</Text>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
          <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "Main" : "Welcome"}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Main" component={MainScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="Nearby" component={NearbyScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Purchase" component={PurchaseScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
      <Stack.Screen name="OpportunityFinder" component={OpportunityFinderScreen} />
    </Stack.Navigator>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Reset state after 3 seconds
    setTimeout(() => {
      this.setState({ hasError: false });
    }, 3000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>🍽️ KapTaze</Text>
            <Text style={styles.errorText}>Uygulama başlatılıyor...</Text>
            <Text style={styles.errorSubText}>Lütfen bir kaç saniye bekleyin</Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Wake up backend immediately (prevent cold start)
    fetch('https://kaptaze-backend-api.onrender.com/health')
      .then(() => console.log('✅ Backend warmed up'))
      .catch(() => console.log('⚠️ Backend wake-up failed'));

    // Show UI immediately
    setIsReady(true);
  }, []);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingTitle}>🌱 KapTaze</Text>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <UserDataProvider>
        <AuthProvider>
          <View style={styles.container}>
            <StatusBar style="auto" translucent backgroundColor="transparent" />
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </View>
        </AuthProvider>
      </UserDataProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  debugContainer: {
    backgroundColor: '#16a34a',
    padding: 10,
    alignItems: 'center',
  },
  debugText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    padding: 20,
  },
  errorTitle: {
    fontSize: 48,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#e2e8f0',
    fontWeight: '500',
  }
});
