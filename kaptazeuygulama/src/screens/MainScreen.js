import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TextInput,
  FlatList,
  Alert,
  Platform,
  Image,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';
import apiService from '../services/apiService';
import { antalyaRestaurants, categoryFilters } from '../data/antalyaRestaurants';
import { useUserData } from '../context/UserDataContext';

const getRestaurantIcon = (category) => {
  const icons = {
    'Pizza & Fast Food': '🍕',
    'Fast Food': '🍔',
    'Kahve & Atıştırmalık': '☕',
    'Türk Mutfağı': '🍽️',
    'Vegan & Sağlıklı': '🥗',
    'Özel Kahve': '☕'
  };
  return icons[category] || '🍽️';
};


const MainScreen = ({ navigation }) => {
  const { toggleFavorite, isFavorite } = useUserData();
  const [restaurants, setRestaurants] = useState([]);
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userLocation, setUserLocation] = useState('Konum alınıyor...');
  const [locationPermissionStatus, setLocationPermissionStatus] = useState(null);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistance, setSelectedDistance] = useState(10);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Infinite scroll states
  const [displayedRestaurants, setDisplayedRestaurants] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    loadRestaurants();
    loadFeaturedRestaurants(); 
    loadCategories();
    loadUserLocation();
  }, []);

  const loadUserLocation = async () => {
    try {
      console.log('📍 Requesting location permission...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status);
      
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        setUserLocation('Antalya'); // Fallback to default
        return;
      }

      console.log('✅ Location permission granted, getting position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 30000, // Cache for 30 seconds
      });
      
      const { latitude, longitude } = location.coords;
      setUserCoordinates({ latitude, longitude });
      console.log('📍 User coordinates:', { latitude, longitude });
      
      // Reverse geocoding to get city name
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const cityName = address.city || address.district || address.subregion || 'Konum Tespit Edildi';
        setUserLocation(cityName);
        console.log('🏙️ User city:', cityName);
      } else {
        setUserLocation('Konum Tespit Edildi');
      }
      
    } catch (error) {
      console.error('📍 Location error:', error);
      setUserLocation('Antalya'); // Fallback to default
    }
  };

  const handleLocationChange = () => {
    // Pass user location data to map
    navigation.navigate('Map', { 
      userLocation,
      userCoordinates,
      selectedDistance
    });
  };

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      console.log('📱 Loading restaurants for mobile app...');
      
      // API'den gerçek restaurant verilerini çek
      let apiRestaurants = [];
      try {
        console.log('🔄 Loading restaurants from KapTaze API...');
        const apiResponse = await apiService.getRestaurants();
        console.log('📊 API response:', apiResponse);
        
        if (apiResponse.success && apiResponse.data.restaurants) {
          apiRestaurants = apiResponse.data.restaurants;
          console.log('✅ API restaurants loaded:', apiRestaurants.length);
          console.log('📋 Restaurant names:', apiRestaurants.map(r => r.name));
        } else {
          console.log('⚠️ No restaurants in API response');
        }
      } catch (error) {
        console.log('❌ API request failed:', error);
      }
      
      
      
      // Tüm veri kaynaklarını birleştir
      const allRestaurants = [
        ...apiRestaurants, // Gerçek API verisi öncelikli
        ...antalyaRestaurants // Fallback demo restoranlar
      ];
      
      // Format API data to match expected structure
      const formattedRestaurants = allRestaurants.map(restaurant => ({
        ...restaurant,
        name: restaurant.name || restaurant.ad, // API uses 'name', fallback uses 'ad'
        rating: typeof restaurant.rating === 'object' ? restaurant.rating.average || 0 : restaurant.rating || 0,
        distance: restaurant.distance || '2.5km',
        packages: restaurant.packages || [{ originalPrice: 50, salePrice: 25, discount: 50, quantity: 3 }]
      }));

      // Duplicate removal (by id or name)
      const uniqueRestaurants = formattedRestaurants.filter((restaurant, index, self) => 
        index === self.findIndex(r => r._id === restaurant._id || r.name === restaurant.name)
      );
      
      setRestaurants(uniqueRestaurants);
      setDisplayedRestaurants(uniqueRestaurants.slice(0, ITEMS_PER_PAGE));
      setHasMore(uniqueRestaurants.length > ITEMS_PER_PAGE);
      
      console.log(`📱 Toplam ${uniqueRestaurants.length} restoran yüklendi (${apiRestaurants.length} API + ${antalyaRestaurants.length} fallback)`);
      
    } catch (error) {
      console.error('Restaurant loading error:', error);
      // Hata durumunda fallback data kullan
      setRestaurants(antalyaRestaurants);
      setDisplayedRestaurants(antalyaRestaurants.slice(0, ITEMS_PER_PAGE));
      setHasMore(antalyaRestaurants.length > ITEMS_PER_PAGE);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedRestaurants = async () => {
    try {
      console.log('Loading featured restaurants from API...');
      
      // Gerçek API'den restoranları yükle
      const response = await apiService.getRestaurants();
      
      if (response.success && response.data.restaurants) {
        const apiRestaurants = response.data.restaurants;
        // Yüksek puanlı restoranları featured olarak kullan
        setFeaturedRestaurants(apiRestaurants.filter(r => r.rating >= 4.0).slice(0, 8));
        console.log('Featured restaurants loaded from API:', apiRestaurants.length);
      } else {
        // Fallback olarak mock data kullan
        setFeaturedRestaurants(antalyaRestaurants.filter(r => r.rating >= 4.5).slice(0, 8));
        console.log('Featured restaurants loaded from fallback data');
      }
    } catch (error) {
      console.error('Featured restaurants error:', error);
      // Hata durumunda fallback data kullan
      setFeaturedRestaurants(antalyaRestaurants.filter(r => r.rating >= 4.5).slice(0, 8));
    }
  };

  const loadCategories = async () => {
    try {
      console.log('🏷️ Loading categories from API...');
      const response = await apiService.getCategories();
      
      if (response.success && response.data) {
        // Convert API categories to filter format
        const apiCategories = response.data.map(cat => ({
          id: cat._id || cat.name.toLowerCase().replace(/\s+/g, ''),
          name: cat.name,
          emoji: cat.emoji || '🍽️'
        }));
        
        // Add "All" option at the beginning
        const allCategories = [
          { id: 'all', name: 'Hepsi', emoji: '🍽️' },
          ...apiCategories
        ];
        
        setCategories(allCategories);
        console.log('✅ Categories loaded:', allCategories);
      } else {
        // Fallback to default categories
        setCategories([
          { id: 'all', name: 'Hepsi', emoji: '🍽️' },
          { id: 'turkish', name: 'Türk Mutfağı', emoji: '🇹🇷' },
          { id: 'fastfood', name: 'Fast Food', emoji: '🍔' },
          { id: 'coffee', name: 'Kahve', emoji: '☕' },
        ]);
      }
    } catch (error) {
      console.log('❌ Categories failed, using fallback');
      setCategories([
        { id: 'all', name: 'Hepsi', emoji: '🍽️' },
        { id: 'turkish', name: 'Türk Mutfağı', emoji: '🇹🇷' },
        { id: 'fastfood', name: 'Fast Food', emoji: '🍔' },
        { id: 'coffee', name: 'Kahve', emoji: '☕' },
      ]);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesName = restaurant.name?.toLowerCase().includes(searchLower);
      const matchesCategory = restaurant.category?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesCategory) return false;
    }
    
    // Category filter
    if (activeFilter === 'all') return true;
    const categoryMap = {
      'coffee': ['Kahve & Atıştırmalık', 'Özel Kahve'],
      'fastfood': ['Pizza & Fast Food', 'Fast Food'],
      'turkish': ['Türk Mutfağı', 'Turkish Cuisine'],
      'vegan': ['Vegan & Sağlıklı']
    };
    return categoryMap[activeFilter]?.includes(restaurant.category);
  });

  // Filter değiştiğinde displayed restaurants'ı sıfırla
  useEffect(() => {
    setDisplayedRestaurants(filteredRestaurants.slice(0, ITEMS_PER_PAGE));
    setHasMore(filteredRestaurants.length > ITEMS_PER_PAGE);
    setCurrentPage(1);
  }, [activeFilter, restaurants]);

  // Load more function for infinite scroll
  const loadMoreRestaurants = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      
      setTimeout(() => {
        const nextPage = currentPage + 1;
        const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const newItems = filteredRestaurants.slice(startIndex, endIndex);
        
        if (newItems.length > 0) {
          setDisplayedRestaurants(prev => [...prev, ...newItems]);
          setCurrentPage(nextPage);
          setHasMore(endIndex < filteredRestaurants.length);
        } else {
          setHasMore(false);
        }
        
        setIsLoadingMore(false);
      }, 1000); // Simulate loading delay
    }
  };

  // Scroll event handler
  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
    
    if (isCloseToBottom) {
      loadMoreRestaurants();
    }
  };

  const getPackageStatus = (restaurant) => {
    const totalPackages = restaurant.packages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;
    if (totalPackages === 0) return { text: 'Tükendi', color: '#9ca3af' };
    if (totalPackages === 1) return { text: 'Son paket!', color: '#f59e0b' };
    return { text: 'Şimdi al', color: '#16a34a' };
  };

  const renderFeaturedItem = ({ item }) => {
    const mainPackage = item.packages?.[0] || {};
    const statusInfo = getPackageStatus(item);
    const totalPackages = item.packages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;

    return (
      <TouchableOpacity 
        style={styles.featuredCard}
        onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
      >
        {/* Image Header */}
        <View style={styles.featuredImageContainer}>
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.featuredImage}
              onError={() => console.log('Featured image failed to load')}
            />
          ) : (
            <View style={styles.gradientBackground}>
              <Text style={styles.featuredIcon}>
                {item.image || getRestaurantIcon(item.category)}
              </Text>
            </View>
          )}
          
          {/* Heart Button */}
          <TouchableOpacity 
            style={styles.heartButton}
            onPress={() => toggleFavorite(item)}
          >
            <Text style={styles.heartIcon}>
              {isFavorite(item._id) ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
          
          {/* Package Count Badge */}
          <View style={styles.packageBadge}>
            <Text style={styles.packageBadgeText}>{totalPackages} paket</Text>
          </View>

          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <View style={styles.priceRow}>
              <Text style={styles.originalPriceFeatured}>
                ₺{mainPackage.originalPrice || 0}
              </Text>
              <Text style={styles.salePriceFeatured}>
                ₺{mainPackage.salePrice || 0}
              </Text>
            </View>
            <Text style={styles.discountText}>
              %{mainPackage.discount || 0}
            </Text>
          </View>
        </View>
        
        {/* Card Info */}
        <View style={styles.featuredInfo}>
          <Text style={styles.featuredName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.featuredCategory}>{item.category}</Text>
          <View style={styles.featuredMeta}>
            <View style={styles.ratingContainer}>
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={styles.ratingText}>
                {typeof item.rating === 'object' ? item.rating.average || item.rating : item.rating}
              </Text>
            </View>
            <View style={styles.pickupTimeContainer}>
              <Text style={styles.pickupTimeIcon}>⏰</Text>
              <Text style={styles.pickupTimeText}>18:00-21:00</Text>
            </View>
            <Text style={styles.distanceText}>{item.distance}km</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Restoranlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.locationContainer}>
              <Text style={styles.locationIcon}>📍</Text>
              <View>
                <Text style={styles.locationText}>{userLocation}</Text>
                <TouchableOpacity onPress={handleLocationChange}>
                  <Text style={styles.changeLocationText}>Konum değiştir</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => navigation.navigate('Map', {
                  userLocation,
                  userCoordinates,
                  selectedDistance
                })}
              >
                <Text style={styles.headerButtonIcon}>🗺️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Text style={styles.headerButtonIcon}>🔔</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Restoran ara..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Teslim Al Tab */}
          <View style={styles.tabContainer}>
            <View style={styles.deliveryTab}>
              <Text style={styles.deliveryIcon}>📦</Text>
              <Text style={styles.deliveryText}>Teslim Al</Text>
              <View style={styles.deliveryBadge}>
                <Text style={styles.deliveryBadgeText}>Gıda İsrafını Durdur</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Featured Restaurants Section */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Keşfettin mi?</Text>
            <Text style={styles.sectionSubtitle}>{selectedDistance}km çevrendeki en iyi restoranlar</Text>
          </View>
          
          <FlatList
            data={featuredRestaurants}
            renderItem={renderFeaturedItem}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>

        {/* Filter Categories */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setActiveFilter(category.id)}
                  style={[
                    styles.filterButton,
                    activeFilter === category.id && styles.filterButtonActive
                  ]}
                >
                  <Text style={styles.filterEmoji}>{category.emoji}</Text>
                  <Text style={[
                    styles.filterText,
                    activeFilter === category.id && styles.filterTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Stats Header */}
        <View style={styles.statsContainer}>
          <View>
            <Text style={styles.statsTitle}>
              {filteredRestaurants.length} restoran
            </Text>
            <Text style={styles.statsSubtitle}>
              {filteredRestaurants.reduce((sum, r) => sum + (r.packages?.reduce((pSum, p) => pSum + p.quantity, 0) || 0), 0)} paket mevcut
            </Text>
          </View>
          <View style={styles.statsRight}>
            <Text style={styles.savingsAmount}>
              ₺{filteredRestaurants.reduce((sum, r) => {
                const pkg = r.packages?.[0];
                return sum + ((pkg?.originalPrice || 0) - (pkg?.salePrice || 0));
              }, 0).toFixed(0)}
            </Text>
            <Text style={styles.savingsText}>toplam tasarruf</Text>
          </View>
        </View>

        {/* Restaurant List */}
        <View style={styles.restaurantList}>
          {displayedRestaurants.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bu kategoride restoran bulunamadı.</Text>
            </View>
          ) : (
            displayedRestaurants.map((restaurant) => {
              const statusInfo = getPackageStatus(restaurant);
              const mainPackage = restaurant.packages?.[0] || {};
              const totalPackages = restaurant.packages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;

              return (
                <TouchableOpacity 
                  key={restaurant._id} 
                  style={styles.restaurantCard}
                  onPress={() => navigation.navigate('RestaurantDetail', { restaurant })}
                >
                  {/* Restaurant Image Header */}
                  <View style={styles.restaurantImageContainer}>
                    {restaurant.imageUrl ? (
                      <Image 
                        source={{ uri: restaurant.imageUrl }} 
                        style={styles.restaurantImage}
                        onError={() => console.log('Restaurant image failed to load')}
                      />
                    ) : (
                      <View style={styles.restaurantGradient}>
                        <Text style={styles.restaurantIcon}>
                          {restaurant.image || getRestaurantIcon(restaurant.category)}
                        </Text>
                      </View>
                    )}
                    
                    {/* Overlay Gradient */}
                    <View style={styles.imageOverlay} />
                    
                    {/* Heart Button */}
                    <TouchableOpacity 
                      style={styles.restaurantHeart}
                      onPress={() => toggleFavorite(restaurant)}
                    >
                      <Text style={styles.heartIcon}>
                        {isFavorite(restaurant._id) ? '♥' : '♡'}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Package Count */}
                    <View style={styles.restaurantPackageBadge}>
                      <Text style={styles.restaurantPackageText}>{totalPackages} paket</Text>
                    </View>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                      <Text style={styles.statusText}>{statusInfo.text}</Text>
                    </View>

                    {/* Price Info */}
                    <View style={styles.restaurantPriceBadge}>
                      <View style={styles.restaurantPriceRow}>
                        <Text style={styles.restaurantOriginalPrice}>
                          ₺{mainPackage.originalPrice || 0}
                        </Text>
                        <Text style={styles.restaurantSalePrice}>
                          ₺{mainPackage.salePrice || 0}
                        </Text>
                      </View>
                      <Text style={styles.restaurantDiscount}>
                        %{mainPackage.discount || 0}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Restaurant Info */}
                  <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName}>{restaurant.name}</Text>
                    <Text style={styles.restaurantCategory}>{restaurant.category}</Text>
                    <View style={styles.restaurantMeta}>
                      <View style={styles.ratingContainer}>
                        <Text style={styles.starIcon}>⭐</Text>
                        <Text style={styles.ratingText}>
                          {typeof restaurant.rating === 'object' ? restaurant.rating.average || restaurant.rating : restaurant.rating}
                        </Text>
                      </View>
                      <View style={styles.pickupTimeContainer}>
                        <Text style={styles.pickupTimeIcon}>⏰</Text>
                        <Text style={styles.pickupTimeText}>18:00-21:00</Text>
                      </View>
                      <Text style={styles.distanceText}>{restaurant.distance}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          
          {/* Loading Indicator for Infinite Scroll */}
          {isLoadingMore && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={styles.loadingMoreText}>Daha fazla restoran yükleniyor...</Text>
            </View>
          )}
          
          {/* End Message */}
          {!hasMore && displayedRestaurants.length > ITEMS_PER_PAGE && (
            <View style={styles.endMessage}>
              <Text style={styles.endMessageText}>🎉 Tüm restoranları gördünüz!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLocationModal}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Konum Seç</Text>
            <Text style={styles.modalSubtitle}>
              {userLocation} konumundaki teklifleri görüyorsunuz.
            </Text>
            
            <Text style={styles.distanceLabel}>
              Kaç km mesafedeki teklifleri görmek istersin?
            </Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{selectedDistance} km</Text>
              
              {/* Distance Options */}
              <View style={styles.distanceOptions}>
                {[0, 5, 10, 15, 20].map((distance) => (
                  <TouchableOpacity
                    key={distance}
                    style={[
                      styles.distanceOption,
                      selectedDistance === distance && styles.distanceOptionActive
                    ]}
                    onPress={() => setSelectedDistance(distance)}
                  >
                    <Text style={[
                      styles.distanceOptionText,
                      selectedDistance === distance && styles.distanceOptionTextActive
                    ]}>
                      {distance}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Manual Adjustment */}
              <View style={styles.manualAdjustment}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => setSelectedDistance(Math.max(0, selectedDistance - 1))}
                >
                  <Text style={styles.adjustButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.currentDistance}>{selectedDistance} km</Text>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => setSelectedDistance(Math.min(20, selectedDistance + 1))}
                >
                  <Text style={styles.adjustButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => setShowLocationModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonConfirm}
                onPress={() => {
                  setShowLocationModal(false);
                  // Refresh restaurants with new distance
                }}
              >
                <Text style={styles.modalButtonConfirmText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Ana Sayfa</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Nearby')}
        >
          <Text style={styles.navIcon}>📍</Text>
          <Text style={styles.navLabel}>Yakınımdaki</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Favorites')}
        >
          <Text style={styles.navIcon}>❤️</Text>
          <Text style={styles.navLabel}>Favoriler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navLabel}>Siparişler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  changeLocationText: {
    fontSize: 12,
    color: '#16a34a',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonIcon: {
    fontSize: 18,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  tabContainer: {
    alignItems: 'center',
  },
  deliveryTab: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  deliveryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  deliveryText: {
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 8,
  },
  deliveryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveryBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
  featuredSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  featuredImageContainer: {
    height: 80,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredIcon: {
    fontSize: 32,
    color: '#ffffff',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 12,
    color: '#ef4444',
  },
  packageBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  packageBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#111827',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 6,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  originalPriceFeatured: {
    fontSize: 10,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  salePriceFeatured: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  discountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
    textAlign: 'center',
  },
  featuredInfo: {
    padding: 12,
  },
  featuredName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featuredCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  filterSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#16a34a',
  },
  statsContainer: {
    backgroundColor: '#f0fdf4',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsRight: {
    alignItems: 'flex-end',
  },
  savingsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  savingsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  restaurantList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  restaurantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  restaurantImageContainer: {
    height: 160,
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  restaurantGradient: {
    flex: 1,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantIcon: {
    fontSize: 48,
    color: '#ffffff',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  restaurantHeart: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantPackageBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  restaurantPackageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  restaurantPriceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 8,
    borderRadius: 12,
  },
  restaurantPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restaurantOriginalPrice: {
    fontSize: 12,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  restaurantSalePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  restaurantDiscount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
    textAlign: 'center',
    marginTop: 2,
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  restaurantCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6b7280',
  },
  endMessage: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endMessageText: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '600',
  },
  pickupTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupTimeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  pickupTimeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  distanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 16,
  },
  distanceOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  distanceOption: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  distanceOptionActive: {
    backgroundColor: '#16a34a',
  },
  distanceOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  distanceOptionTextActive: {
    color: '#ffffff',
  },
  manualAdjustment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  adjustButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  currentDistance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 60,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default MainScreen;