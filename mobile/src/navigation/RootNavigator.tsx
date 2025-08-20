/**
 * KAPTAZEAPPV5 - Root Navigator
 * Ana navigasyon yapısı - Türkçe
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Context
import { useAuth } from '../context/AuthContext';

// Screens
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main App Screens
import HomeScreen from '../screens/main/HomeScreen';
import RestaurantsScreen from '../screens/main/RestaurantsScreen';
import RestaurantDetailScreen from '../screens/main/RestaurantDetailScreen';
import OrdersScreen from '../screens/main/OrdersScreen';
import OrderDetailScreen from '../screens/main/OrderDetailScreen';
import FavoritesScreen from '../screens/main/FavoritesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CartScreen from '../screens/main/CartScreen';
import CheckoutScreen from '../screens/main/CheckoutScreen';
import MapScreen from '../screens/main/MapScreen';
import SearchScreen from '../screens/main/SearchScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Types
export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  RestaurantDetail: { restaurantId: string };
  OrderDetail: { orderId: string };
  Cart: undefined;
  Checkout: { restaurantId: string; packageId: string; quantity: number };
  Map: { restaurants?: any[] };
  Search: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Restaurants: undefined;
  Orders: undefined;
  Favorites: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab Navigator
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Restaurants':
              iconName = focused ? 'store' : 'store-outline';
              break;
            case 'Orders':
              iconName = focused ? 'shopping' : 'shopping-outline';
              break;
            case 'Favorites':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'help-circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          tabBarLabel: 'Ana Sayfa',
          tabBarBadge: undefined,
        }} 
      />
      <Tab.Screen 
        name="Restaurants" 
        component={RestaurantsScreen} 
        options={{ 
          tabBarLabel: 'Restoranlar',
        }} 
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen} 
        options={{ 
          tabBarLabel: 'Siparişler',
          // Badge for pending orders can be added here
        }} 
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{ 
          tabBarLabel: 'Favoriler',
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          tabBarLabel: 'Profil',
        }} 
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const RootNavigator: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
      initialRouteName={isAuthenticated ? 'MainTabs' : 'Welcome'}
    >
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              headerShown: true,
              headerTitle: 'Giriş Yap',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: '#10b981',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
            }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{
              headerShown: true,
              headerTitle: 'Kayıt Ol',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: '#10b981',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
            }}
          />
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen}
            options={{
              headerShown: true,
              headerTitle: 'Şifremi Unuttum',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: '#10b981',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
            }}
          />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabNavigator}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="RestaurantDetail" 
            component={RestaurantDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Restoran Detayı',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: '#10b981',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
              headerRight: () => (
                <Icon 
                  name="heart-outline" 
                  size={24} 
                  color="#ffffff" 
                  style={{ marginRight: 15 }}
                />
              ),
            }}
          />
          <Stack.Screen 
            name="OrderDetail" 
            component={OrderDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Sipariş Detayı',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: '#10b981',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
            }}
          />
          <Stack.Screen 
            name="Cart" 
            component={CartScreen}
            options={{
              headerShown: true,
              headerTitle: 'Sepetim',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: '#10b981',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
            }}
          />
          <Stack.Screen 
            name="Checkout" 
            component={CheckoutScreen}
            options={{
              headerShown: true,
              headerTitle: 'Ödeme',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: '#10b981',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
              gestureEnabled: false, // Prevent back gesture during checkout
            }}
          />
          <Stack.Screen 
            name="Map" 
            component={MapScreen}
            options={{
              headerShown: true,
              headerTitle: 'Harita',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: '#10b981',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
              headerRight: () => (
                <Icon 
                  name="map-search" 
                  size={24} 
                  color="#ffffff" 
                  style={{ marginRight: 15 }}
                />
              ),
            }}
          />
          <Stack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{
              headerShown: false, // Custom header in SearchScreen
              presentation: 'modal',
              gestureDirection: 'vertical',
            }}
          />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{
              headerShown: true,
              headerTitle: 'Bildirimler',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: '#10b981',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
              headerRight: () => (
                <Icon 
                  name="check-all" 
                  size={24} 
                  color="#ffffff" 
                  style={{ marginRight: 15 }}
                />
              ),
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              headerShown: true,
              headerTitle: 'Ayarlar',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: '#10b981',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;