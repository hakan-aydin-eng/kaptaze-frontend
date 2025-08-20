/**
 * KAPTAZEAPPV5 - Ana Sayfa Ekranı
 * TSX kodundan React Native'e uyarlanmış
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// Components
import RestaurantCard from '../../components/RestaurantCard';
import PromotedRestaurantCard from '../../components/PromotedRestaurantCard';
import CategoryFilter from '../../components/CategoryFilter';
import LocationHeader from '../../components/LocationHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

// Context
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

// Services
import { ApiService } from '../../services/ApiService';
import { LocationService } from '../../services/LocationService';

// Utils
import { Logger } from '../../utils/Logger';

// Types
import { Restaurant, PromotedRestaurant, FilterCategory } from '../../types/Restaurant';

// Styles
import { styles } from './HomeScreen.styles';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, isGuest } = useAuth();
  const { currentLocation, requestLocationPermission } = useLocation();

  // State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [promotedRestaurants, setPromotedRestaurants] = useState<PromotedRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [displayedCount, setDisplayedCount] = useState(3);
  const [showLoadMore, setShowLoadMore] = useState(true);

  // Filter categories (TSX kodundan)
  const filterCategories: FilterCategory[] = [
    { id: 'all', name: 'Tümü', emoji: '🍽️' },
    { id: 'local', name: 'Yerel', emoji: '🏠' },
    { id: 'sweet', name: 'Tatlı', emoji: '🧁' },
    { id: 'vegan', name: 'Vegan', emoji: '🥗' },
    { id: 'turkish', name: 'Türk', emoji: '🇹🇷' },
  ];

  useEffect(() => {
    loadInitialData();
  }, [currentLocation]);

  useEffect(() => {
    if (user) {
      Logger.info(`Ana sayfa yüklendi - Kullanıcı: ${user.ad} ${user.soyad}`);
    }
  }, [user]);

  // Load initial data
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      await Promise.all([
        loadPromotedRestaurants(),
        loadRestaurants(),
      ]);

    } catch (error) {
      Logger.error('Ana sayfa veri yükleme hatası:', error);
      showMessage({
        message: 'Veri Yükleme Hatası',
        description: 'Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
        type: 'danger',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load promoted restaurants
  const loadPromotedRestaurants = async () => {
    try {
      const response = await ApiService.getPromotedRestaurants();
      if (response.basarili) {
        setPromotedRestaurants(response.restoranlar || []);
      }
    } catch (error) {
      Logger.error('Önerilen restoranlar yükleme hatası:', error);
    }
  };

  // Load restaurants
  const loadRestaurants = async () => {
    try {
      const params = {
        kategori: activeFilter,
        sayfa: 1,
        limit: displayedCount,
        ...(currentLocation?.latitude && {
          enlem: currentLocation.latitude,
          boylam: currentLocation.longitude,
          mesafe: 10,
        }),
      };

      const response = await ApiService.getRestaurants(params);
      if (response.basarili) {
        setRestaurants(response.restoranlar || []);
        setShowLoadMore(response.restoranlar?.length >= displayedCount);
      }
    } catch (error) {
      Logger.error('Restoran yükleme hatası:', error);
    }
  };

  // Load more restaurants
  const loadMoreRestaurants = async () => {
    try {
      const newDisplayedCount = displayedCount + 3;
      const params = {
        kategori: activeFilter,
        sayfa: 1,
        limit: newDisplayedCount,
        ...(currentLocation?.latitude && {
          enlem: currentLocation.latitude,
          boylam: currentLocation.longitude,
          mesafe: 10,
        }),
      };

      const response = await ApiService.getRestaurants(params);
      if (response.basarili) {
        setRestaurants(response.restoranlar || []);
        setDisplayedCount(newDisplayedCount);
        setShowLoadMore(response.restoranlar?.length >= newDisplayedCount);
      }
    } catch (error) {
      Logger.error('Daha fazla restoran yükleme hatası:', error);
    }
  };

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setDisplayedCount(3);
    await loadInitialData();
    setIsRefreshing(false);
  }, [currentLocation]);

  // Filter change handler
  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
    setDisplayedCount(3);
    loadRestaurants();
  };

  // Restaurant detail navigation
  const handleRestaurantPress = (restaurant: Restaurant) => {
    navigation.navigate('RestaurantDetail', { 
      restaurantId: restaurant.id 
    });
  };

  // Location request handler
  const handleLocationRequest = async () => {
    try {
      const granted = await requestLocationPermission();
      if (granted) {
        showMessage({
          message: 'Konum İzni Verildi',
          description: 'Size en yakın restoranlar yükleniyor...',
          type: 'success',
          duration: 3000,
        });
        await loadRestaurants();
      } else {
        showMessage({
          message: 'Konum İzni Gerekli',
          description: 'En yakın restoranları gösterebilmek için konum izni gereklidir.',
          type: 'warning',
          duration: 4000,
        });
      }
    } catch (error) {
      Logger.error('Konum izni hatası:', error);
    }
  };

  // Search navigation
  const handleSearchPress = () => {
    navigation.navigate('Search');
  };

  // Map navigation
  const handleMapPress = () => {
    navigation.navigate('Map', { restaurants });
  };

  // Guest user info
  const showGuestInfo = () => {
    Alert.alert(
      'Misafir Kullanıcı',
      'Sipariş verebilmek için kayıt olmanız gerekmektedir. Şimdi kayıt olmak ister misiniz?',
      [
        { text: 'Sonra', style: 'cancel' },
        { text: 'Kayıt Ol', onPress: () => navigation.navigate('Register') },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Ana sayfa yükleniyor..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#10b981" barStyle="light-content" />
      
      {/* Header */}
      <LocationHeader
        location={currentLocation?.address || 'Antalya'}
        onLocationPress={handleLocationRequest}
        onSearchPress={handleSearchPress}
        onMapPress={handleMapPress}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#10b981']}
            tintColor="#10b981"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Banner */}
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.welcomeBanner}
        >
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>
              Merhaba {user?.ad || 'Kullanıcı'}! 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Bugün hangi lezzeti kurtarmak istiyorsun?
            </Text>
            
            {isGuest && (
              <TouchableOpacity
                style={styles.guestButton}
                onPress={showGuestInfo}
              >
                <Icon name="information" size={16} color="#10b981" />
                <Text style={styles.guestButtonText}>
                  Kayıt ol ve tüm özelliklerden faydalan
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.welcomeIcon}>
            <Text style={styles.welcomeEmoji}>🥗</Text>
          </View>
        </LinearGradient>

        {/* Category Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <CategoryFilter
            categories={filterCategories}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />
        </View>

        {/* Promoted Restaurants */}
        {promotedRestaurants.length > 0 && (
          <View style={styles.promotedSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Keşfettin mi? 🤔</Text>
              <Text style={styles.sectionSubtitle}>
                Yöneticinin önerdiği yakın yerler
              </Text>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promotedScrollContainer}
            >
              {promotedRestaurants.map((restaurant, index) => (
                <PromotedRestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onPress={() => handleRestaurantPress(restaurant)}
                  style={index === 0 ? { marginLeft: 20 } : undefined}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Restaurants */}
        <View style={styles.restaurantsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Şimdi teslim al 🍽️</Text>
            <Text style={styles.sectionSubtitle}>
              Bu paketler hazır ve sizi bekliyor
            </Text>
          </View>

          {restaurants.length > 0 ? (
            <View style={styles.restaurantsGrid}>
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onPress={() => handleRestaurantPress(restaurant)}
                />
              ))}
              
              {/* Load More Button */}
              {showLoadMore && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={loadMoreRestaurants}
                >
                  <Icon name="plus" size={20} color="#10b981" />
                  <Text style={styles.loadMoreText}>Daha Fazla Göster</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <EmptyState
              icon="store-off"
              title="Restoran Bulunamadı"
              description="Bu kategoride henüz restoran bulunmuyor. Farklı bir kategori deneyin."
              actionText="Kategorileri Görüntüle"
              onActionPress={() => setActiveFilter('all')}
            />
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;