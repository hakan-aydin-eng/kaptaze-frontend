import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, View, Text, ActivityIndicator } from 'react-native';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainScreen from './src/screens/MainScreen';
import RestaurantDetailScreen from './src/screens/RestaurantDetailScreen';
import NearbyScreen from './src/screens/NearbyScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PurchaseScreen from './src/screens/PurchaseScreen';
import UserDataProvider from './src/context/UserDataContext';
import AuthProvider from './src/context/AuthContext';

const Stack = createStackNavigator();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>🍽️ KapTaze</Text>
            <Text style={styles.errorText}>Uygulama başlatılıyor...</Text>
            <Text style={styles.errorSubText}>Lütfen bir kaç saniye bekleyin</Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [debugInfo, setDebugInfo] = useState('App başlatılıyor...');
  
  React.useEffect(() => {
    console.log('App component mounted');
    setDebugInfo('App component hazır');
  }, []);

  return (
    <ErrorBoundary>
      <UserDataProvider>
        <AuthProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>🌱 KapTaze - {debugInfo}</Text>
            </View>
            <NavigationContainer>
              <Stack.Navigator 
                initialRouteName="Welcome"
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true,
                }}
              >
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Main" component={MainScreen} />
                <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
                <Stack.Screen name="Nearby" component={NearbyScreen} />
                <Stack.Screen name="Favorites" component={FavoritesScreen} />
                <Stack.Screen name="Orders" component={OrdersScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Purchase" component={PurchaseScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaView>
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
    backgroundColor: '#0f172a',
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
