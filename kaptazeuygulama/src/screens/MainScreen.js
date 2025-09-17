import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  FlatList,
  Alert,
  Platform,
  Image,
  Modal,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Slider removed for build compatibility
import * as Location from 'expo-location';
import apiService from '../services/apiService';
import { useUserData } from '../context/UserDataContext';
import NotificationPanel from '../components/NotificationPanel';

const getRestaurantIcon = (category) => {
  const icons = {
    'Türk Mutfağı': '🇹🇷',
    'Yerel Lezzetler': '🏠',
    'Unlu Mamüller': '🍞',
    'Tatlı': '🧁',
    'Manav': '🥬',
    'Çiçek': '🌸',
    'Uzakdoğu Mutfağı': '🥢',
    'Vegan': '🌱',
    'Vejeteryan': '🥗',
    'Fast Food': '🍔',
    // Legacy support for old categories
    'Pizza & Fast Food': '🍕',
    'Kahve & Atıştırmalık': '☕',
    'Vegan & Sağlıklı': '🥗',
    'Özel Kahve': '☕'
  };
  return icons[category] || '🍽️';
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10; // Round to 1 decimal place
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
  const [selectedDistance, setSelectedDistance] = useState(25);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Infinite scroll states
  const [displayedRestaurants, setDisplayedRestaurants] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    // Load data in parallel for faster loading
    const loadInitialData = async () => {
      try {
        // Show screen immediately while data loads in background
        await Promise.allSettled([
          loadRestaurants(),
          loadCategories(),
          loadUserLocation()
        ]);
      } catch (error) {
        console.error('❌ Failed to load initial data:', error);
      }
    };
    
    loadInitialData();
  }, []);

  // Load featured restaurants after main restaurants are loaded
  useEffect(() => {
    if (restaurants.length > 0) {
      loadFeaturedRestaurants();
    }
  }, [restaurants]);

  // Search functionality with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        console.log('🔍 Searching for:', searchQuery);
        loadRestaurants(searchQuery);
      } else if (searchQuery === '') {
        console.log('🔍 Clearing search, loading all restaurants');
        loadRestaurants();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // 🔄 PHASE 2: Real-time Restaurant Updates
  useEffect(() => {
    console.log('📡 Setting up real-time restaurant updates...');
    
    const intervalId = setInterval(async () => {
      console.log('🔄 Auto-refreshing restaurant data...');
      try {
        await loadRestaurants();
        console.log('✅ Restaurant data refreshed automatically');
      } catch (error) {
        console.error('❌ Auto-refresh failed:', error);
      }
    }, 120000); // Refresh every 2 minutes
    
    return () => {
      console.log('🛑 Stopping real-time updates');
      clearInterval(intervalId);
    };
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
        const districtName = address.district || address.subregion || address.city || 'Konum Tespit Edildi';
        setUserLocation(districtName);
        console.log('🏙️ User district:', districtName);
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

  const applyDistanceFilter = () => {
    console.log('📏 Applying distance filter:', selectedDistance, 'km');
    
    if (!userCoordinates) {
      console.log('⚠️ No user coordinates available for distance filtering');
      return;
    }
    
    // Filter restaurants by distance
    const filteredByDistance = restaurants.filter(restaurant => {
      if (!restaurant.location || !restaurant.location.coordinates) {
        return true; // Keep restaurants without coordinates
      }
      
      const [lon, lat] = restaurant.location.coordinates;
      const distance = calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        lat,
        lon
      );
      
      return distance <= selectedDistance;
    });
    
    console.log(`✅ Filtered ${restaurants.length} restaurants to ${filteredByDistance.length} within ${selectedDistance}km`);
    
    // Update displayed restaurants
    setDisplayedRestaurants(filteredByDistance.slice(0, ITEMS_PER_PAGE));
    setHasMore(filteredByDistance.length > ITEMS_PER_PAGE);
    setCurrentPage(1);
  };

  const loadRestaurants = async (searchTerm = '') => {
    try {
      setLoading(false); // Don't block UI
      console.log('📱 Loading restaurants for mobile app...', searchTerm ? `Search: "${searchTerm}"` : '');

      // API'den gerçek restaurant verilerini çek
      let apiRestaurants = [];
      try {
        console.log('🔄 Loading restaurants from KapTaze API...');

        // Build filters object with search term
        const filters = {};
        if (searchTerm && searchTerm.trim()) {
          filters.search = searchTerm.trim();
        }

        const apiResponse = await apiService.getRestaurants(filters);
        console.log('📊 API response:', apiResponse);
        
        if (apiResponse.success && apiResponse.data) {
          apiRestaurants = apiResponse.data;
          console.log('✅ API restaurants loaded:', apiRestaurants.length);
          console.log('📋 Restaurant names:', apiRestaurants.map(r => r.name));
          
        } else {
          console.log('⚠️ No restaurants in API response');
        }
      } catch (error) {
        console.log('❌ API request failed:', error);
      }
      
      
      
      // Only use API data - no fallback
      const allRestaurants = apiRestaurants;
      
      // Format API data to match expected structure
      const formattedRestaurants = allRestaurants.map((restaurant, index) => {
        // Calculate real distance from user coordinates
        let calculatedDistance = '2.5km';
        if (userCoordinates && restaurant.location) {
          let restaurantLat, restaurantLng;
          
          // Handle different coordinate formats
          if (restaurant.location.coordinates && Array.isArray(restaurant.location.coordinates)) {
            // MongoDB GeoJSON format: [longitude, latitude]
            restaurantLng = restaurant.location.coordinates[0];
            restaurantLat = restaurant.location.coordinates[1];
          } else if (restaurant.location.lat && restaurant.location.lng) {
            // Direct lat/lng format
            restaurantLat = restaurant.location.lat;
            restaurantLng = restaurant.location.lng;
          }
          
          if (restaurantLat && restaurantLng) {
            const distance = calculateDistance(
              userCoordinates.latitude, 
              userCoordinates.longitude,
              restaurantLat, 
              restaurantLng
            );
            calculatedDistance = `${distance}km`;
          }
        } else {
          // If no user coordinates, assign default distance based on index for demo
          calculatedDistance = `${(2 + (index * 0.5)).toFixed(1)}km`;
        }
        
        return {
          ...restaurant,
          name: restaurant.name || restaurant.ad, // API uses 'name', fallback uses 'ad'
          rating: typeof restaurant.rating === 'object' ? restaurant.rating.average || 4.5 : restaurant.rating || 4.5,
          distance: calculatedDistance,
          distanceValue: parseFloat(calculatedDistance), // For sorting
          // Add isNew flag to first few restaurants for demo
          isNew: index < 2,
          // Add image support for restaurant profile images
          profileImage: restaurant.profileImage || restaurant.images?.logo || restaurant.imageUrl,
          restaurantImage: restaurant.profileImage || restaurant.images?.logo || restaurant.imageUrl || restaurant.image,
          // Use description for business description
          businessDescription: restaurant.description || '',
          // Use operatingHours from restaurant profile (new simple system)
          operatingHours: restaurant.operatingHours || {
            open: '09:00',
            close: '22:00'
          },
          // Format packages to match restaurant detail screen - only active packages
          packages: restaurant.packages && restaurant.packages.length > 0 ? 
            restaurant.packages
              .filter(pkg => pkg.status === 'active') // Only active packages
              .map(pkg => ({
                ...pkg,
                originalPrice: pkg.originalPrice || pkg.price * 2,
                salePrice: pkg.discountedPrice || pkg.price,
                discount: pkg.originalPrice ? Math.round((1 - (pkg.discountedPrice || pkg.price) / pkg.originalPrice) * 100) : 50,
                quantity: pkg.quantity || 3,
                isAvailable: true
              })) : []
        };
      });

      // Duplicate removal (by id or name)
      const uniqueRestaurants = formattedRestaurants.filter((restaurant, index, self) => 
        index === self.findIndex(r => r._id === restaurant._id || r.name === restaurant.name)
      );
      
      // Sort: nearest with packages first, then nearest without packages
      const sortedRestaurants = uniqueRestaurants.sort((a, b) => {
        const aHasPackages = a.packages && a.packages.length > 0;
        const bHasPackages = b.packages && b.packages.length > 0;
        const distanceA = a.distanceValue || parseFloat(a.distance) || 999;
        const distanceB = b.distanceValue || parseFloat(b.distance) || 999;
        
        // First priority: restaurants with packages
        if (aHasPackages && !bHasPackages) return -1;
        if (!aHasPackages && bHasPackages) return 1;
        
        // Second priority: distance (nearest first)
        return distanceA - distanceB;
      });
      
      setRestaurants(sortedRestaurants);
      setDisplayedRestaurants(sortedRestaurants.slice(0, ITEMS_PER_PAGE));
      setHasMore(sortedRestaurants.length > ITEMS_PER_PAGE);
      
      console.log(`📱 Toplam ${uniqueRestaurants.length} restoran API'den yüklendi`);
      
    } catch (error) {
      console.error('Restaurant loading error:', error);
      // No fallback - show empty state
      setRestaurants([]);
      setDisplayedRestaurants([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedRestaurants = async () => {
    try {
      console.log('Loading featured restaurants from API...');
      
      // Use already loaded restaurants from main list (for consistency)
      if (restaurants.length > 0) {
        const nearbyHighRated = restaurants.filter(restaurant => {
          const rating = typeof restaurant.rating === 'object' ? 
            restaurant.rating.average : restaurant.rating;
          const distance = restaurant.distanceValue || parseFloat(restaurant.distance) || 999;
          
          // Filter: Within 5km radius AND 4+ rating
          return distance <= 5 && rating >= 4.0;
        }).slice(0, 8);
        
        setFeaturedRestaurants(nearbyHighRated);
        console.log(`✨ Featured: ${nearbyHighRated.length} restaurants within 5km with 4+ rating`);
      } else {
        // Fallback to API call if restaurants not loaded yet
        const response = await apiService.getRestaurants();
        
        if (response.success && response.data) {
          const apiRestaurants = response.data;
          setFeaturedRestaurants(apiRestaurants.filter(r => {
            const rating = typeof r.rating === 'object' ? r.rating.average : r.rating;
            return rating >= 4.0;
          }).slice(0, 8));
          console.log('Featured restaurants loaded from API:', apiRestaurants.length);
        } else {
          setFeaturedRestaurants([]);
          console.log('No featured restaurants available');
        }
      }
    } catch (error) {
      console.error('Featured restaurants error:', error);
      setFeaturedRestaurants([]);
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
        // No categories from API - use default categories
        setCategories([
          { id: 'all', name: 'Hepsi', emoji: '🍽️' },
          { id: 'turkish', name: 'Türk Mutfağı', emoji: '🇹🇷' },
          { id: 'local', name: 'Yerel Lezzetler', emoji: '🏠' },
          { id: 'bakery', name: 'Unlu Mamüller', emoji: '🍞' },
          { id: 'dessert', name: 'Tatlı', emoji: '🧁' },
          { id: 'grocery', name: 'Manav', emoji: '🥬' },
          { id: 'flower', name: 'Çiçek', emoji: '🌸' },
          { id: 'asian', name: 'Uzakdoğu Mutfağı', emoji: '🥢' },
          { id: 'vegan', name: 'Vegan', emoji: '🌱' },
          { id: 'vegetarian', name: 'Vejeteryan', emoji: '🥗' },
          { id: 'fastfood', name: 'Fast Food', emoji: '🍔' },
        ]);
      }
    } catch (error) {
      console.log('❌ Categories failed');
      // Error loading categories - use default categories
      setCategories([
        { id: 'all', name: 'Hepsi', emoji: '🍽️' },
        { id: 'turkish', name: 'Türk Mutfağı', emoji: '🇹🇷' },
        { id: 'local', name: 'Yerel Lezzetler', emoji: '🏠' },
        { id: 'bakery', name: 'Unlu Mamüller', emoji: '🍞' },
        { id: 'dessert', name: 'Tatlı', emoji: '🧁' },
        { id: 'grocery', name: 'Manav', emoji: '🥬' },
        { id: 'flower', name: 'Çiçek', emoji: '🌸' },
        { id: 'asian', name: 'Uzakdoğu Mutfağı', emoji: '🥢' },
        { id: 'vegan', name: 'Vegan', emoji: '🌱' },
        { id: 'vegetarian', name: 'Vejeteryan', emoji: '🥗' },
        { id: 'fastfood', name: 'Fast Food', emoji: '🍔' },
      ]);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    // Only category filter - search is now handled by backend API
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

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadRestaurants(),
        loadFeaturedRestaurants(),
        loadCategories()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

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
          {item.packages && item.packages.length > 0 && item.packages[0].originalPrice && (
            <View style={styles.priceBadge}>
              <View style={styles.priceRow}>
                <Text style={styles.originalPriceFeatured}>
                  ₺{item.packages[0].originalPrice}
                </Text>
                <Text style={styles.salePriceFeatured}>
                  ₺{item.packages[0].salePrice}
                </Text>
              </View>
              <Text style={styles.discountText}>
                %{item.packages[0].discount}
              </Text>
            </View>
          )}
        </View>
        
        {/* Card Info */}
        <View style={styles.featuredInfo}>
          <Text style={styles.featuredName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.featuredCategory}>{item.category}</Text>
          <View style={styles.featuredMeta}>
            <View style={styles.pickupTimeContainer}>
              <Text style={styles.pickupTimeIcon}>⏰</Text>
              <Text style={styles.pickupTimeText}>
                {item.operatingHours ?
                  `${item.operatingHours.open}-${item.operatingHours.close}` :
                  '09:00-22:00'}
              </Text>
            </View>
            <Text style={styles.distanceText}>{item.distance}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Restoranlar yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#f0fdf4', '#dcfce7']}
      style={styles.container}
    >
      <View style={styles.safeArea}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#16a34a']}
            progressBackgroundColor="#ffffff"
            tintColor="#16a34a"
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#16a34a', '#059669', '#065f46']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <View style={styles.locationContainer}>
              <Text style={styles.locationIcon}>📍</Text>
              <View>
                <TouchableOpacity onPress={() => setShowLocationModal(true)}>
                  <Text style={styles.locationText}>{userLocation}</Text>
                  <Text style={styles.radiusText}>{selectedDistance} km çapı</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowNotificationPanel(true)}
              >
                <Text style={styles.headerButtonIcon}>🔔</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchGlass}>
              <TextInput
                style={styles.searchInput}
                placeholder="Restoran ara..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Text style={styles.searchIcon}>🔍</Text>
            </View>
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
        </LinearGradient>


        {/* Featured Restaurants Section */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Keşfettin mi?</Text>
            <Text style={styles.sectionSubtitle}>5km çevrendeki 4+ puanlı restoranlar</Text>
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
                  <View style={[
                    styles.restaurantImageContainer,
                    totalPackages === 0 && styles.restaurantImageContainerNoPackages
                  ]}>
                    {(restaurant.restaurantImage || restaurant.profileImage || restaurant.imageUrl) ? (
                      <Image 
                        source={{ uri: restaurant.restaurantImage || restaurant.profileImage || restaurant.imageUrl }} 
                        style={styles.restaurantImage}
                        onError={() => console.log('Restaurant image failed to load:', restaurant.name)}
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
                    
                    {/* NEW Badge (for new restaurants) */}
                    {restaurant.isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>YENİ</Text>
                      </View>
                    )}

                    {/* Package Count Badge (Featured Style) */}
                    {totalPackages > 0 && (
                      <View style={styles.packageBadge}>
                        <Text style={styles.packageBadgeText}>{totalPackages} paket</Text>
                      </View>
                    )}

                    {/* Price Badge (Featured Style) */}
                    {restaurant.packages && restaurant.packages.length > 0 && restaurant.packages[0].originalPrice && (
                      <View style={styles.priceBadge}>
                        <View style={styles.priceRow}>
                          <Text style={styles.originalPriceFeatured}>
                            ₺{restaurant.packages[0].originalPrice}
                          </Text>
                          <Text style={styles.salePriceFeatured}>
                            ₺{restaurant.packages[0].salePrice}
                          </Text>
                        </View>
                        <Text style={styles.discountText}>
                          %{restaurant.packages[0].discount}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Restaurant Info - HTML Style Compact */}
                  <View style={styles.cardContent}>
                    <Text style={styles.restaurantName}>{restaurant.name}</Text>
                    <Text style={styles.restaurantCategory}>{restaurant.category}</Text>
                    <View style={styles.restaurantMeta}>
                      <View style={styles.ratingContainer}>
                        <Text style={styles.starIcon}>⭐</Text>
                        <Text style={styles.ratingText}>
                          {typeof restaurant.rating === 'object' ? 
                            (restaurant.rating.average || 4.5).toFixed(1) : 
                            (restaurant.rating || 4.5).toFixed(1)
                          }
                        </Text>
                      </View>
                      <View style={styles.pickupTimeContainer}>
                        <Text style={styles.pickupTimeIcon}>⏰</Text>
                        <Text style={styles.pickupTimeText}>
                          {restaurant.operatingHours ?
                            `${restaurant.operatingHours.open}-${restaurant.operatingHours.close}` :
                            '09:00-22:00'}
                        </Text>
                      </View>
                      <View style={styles.distanceContainer}>
                        <Text style={styles.distanceIcon}>📍</Text>
                        <Text style={styles.distanceText}>{restaurant.distance}</Text>
                      </View>
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
            <Text style={styles.modalTitle}>Konum ve Çap Ayarı</Text>
            <Text style={styles.modalSubtitle}>
              {userLocation} konumundaki restoranları görüyorsunuz
            </Text>
            
            <Text style={styles.distanceLabel}>
              Arama Çapı: {selectedDistance} km
            </Text>
            
            <View style={styles.sliderContainer}>
              {/* Distance controls replaced slider for build compatibility */}
              
              {/* Distance Controls */}
              <View style={styles.distanceControls}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => setSelectedDistance(Math.max(1, selectedDistance - 1))}
                >
                  <Text style={styles.adjustButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.currentDistance}>{selectedDistance} km</Text>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => setSelectedDistance(Math.min(25, selectedDistance + 1))}
                >
                  <Text style={styles.adjustButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              
              {/* Quick Distance Options */}
              <View style={styles.quickOptions}>
                {[1, 5, 10, 15, 25].map((distance) => (
                  <TouchableOpacity
                    key={distance}
                    style={[
                      styles.quickOption,
                      selectedDistance === distance && styles.quickOptionActive
                    ]}
                    onPress={() => setSelectedDistance(distance)}
                  >
                    <Text style={[
                      styles.quickOptionText,
                      selectedDistance === distance && styles.quickOptionTextActive
                    ]}>
                      {distance}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Use My Location Button */}
            <TouchableOpacity 
              style={styles.useLocationButton}
              onPress={async () => {
                await loadUserLocation();
                setShowLocationModal(false);
              }}
            >
              <Text style={styles.useLocationIcon}>📍</Text>
              <Text style={styles.useLocationText}>Konumumu Kullan</Text>
            </TouchableOpacity>
            
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
                  // Apply distance filter to restaurants
                  applyDistanceFilter();
                }}
              >
                <Text style={styles.modalButtonConfirmText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Panel */}
      <NotificationPanel
        visible={showNotificationPanel}
        onClose={() => setShowNotificationPanel(false)}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Ana Sayfa</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Map', {
            userLocation,
            userCoordinates,
            selectedDistance
          })}
        >
          <Text style={styles.navIcon}>🗺️</Text>
          <Text style={styles.navLabel}>Harita</Text>
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
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  radiusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  changeLocationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerButtonIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchGlass: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  searchIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 8,
  },
  tabContainer: {
    alignItems: 'center',
  },
  deliveryTab: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
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
  offerBanner: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  offerGradient: {
    padding: 20,
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  offerText: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  offerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  offerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  featuredImageContainer: {
    height: 100,
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
    padding: 16,
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
    paddingVertical: 20,
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
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#16a34a',
    borderWidth: 1,
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  filterEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  statsBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    marginHorizontal: 10,
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
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 8,
  },
  restaurantImageContainer: {
    height: 160,
    position: 'relative',
  },
  restaurantImageContainerNoPackages: {
    opacity: 0.6,
    backgroundColor: '#f3f4f6',
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
  newBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priceTagOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  originalPrice: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  salePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 15,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  packageCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  packageCountText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
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
    marginBottom: 2,
  },
  restaurantCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  restaurantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.3)',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
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
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 16,
  },
  sliderThumb: {
    width: 22,
    height: 22,
    backgroundColor: '#16a34a',
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  distanceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 20,
  },
  currentDistance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    minWidth: 60,
    textAlign: 'center',
  },
  adjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  adjustButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  quickOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickOption: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickOptionActive: {
    backgroundColor: '#16a34a',
  },
  quickOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  quickOptionTextActive: {
    color: '#ffffff',
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  useLocationIcon: {
    fontSize: 16,
  },
  useLocationText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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