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
} from 'react-native';
// import * as Location from 'expo-location';
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
  const [userLocation, setUserLocation] = useState('Antalya');
  const [locationPermissionStatus, setLocationPermissionStatus] = useState(null);
  
  // Infinite scroll states
  const [displayedRestaurants, setDisplayedRestaurants] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    loadRestaurants();
    loadFeaturedRestaurants();
  }, []);

  const handleLocationChange = async () => {
    Alert.alert(
      'Konum Seçimi',
      'Şu anda Antalya konumundasınız.',
      [{ text: 'Tamam' }]
    );
  };

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      console.log('📱 Loading restaurants for mobile app...');
      
      // Yeni mobil API metodunu kullan
      let webRestaurants = [];
      try {
        const mobileData = await apiService.getMobileRestaurants();
        if (mobileData.success && mobileData.data.restaurants) {
          webRestaurants = mobileData.data.restaurants;
          console.log('✅ Mobile restaurants loaded:', webRestaurants.length);
          
          if (mobileData.data.meta) {
            console.log('📊 Meta info:', mobileData.data.meta);
          }
        }
      } catch (error) {
        console.log('❌ Mobile data failed:', error);
      }
      
      // Fallback: Web storage direct access dene
      if (webRestaurants.length === 0) {
        try {
          const webData = await apiService.getWebStorageData();
          if (webData.success && webData.data.restaurants) {
            webRestaurants = webData.data.restaurants;
            console.log('🔄 Fallback web storage loaded:', webRestaurants.length);
          }
        } catch (error) {
          console.log('Web storage okunamadı:', error);
        }
      }
      
      // API'den veri çekmeye çalış
      let apiRestaurants = [];
      try {
        const response = await apiService.getRestaurants();
        if (response.success && response.data.restaurants) {
          apiRestaurants = response.data.restaurants;
          console.log('API restaurants loaded:', apiRestaurants.length);
        }
      } catch (error) {
        console.log('API failed, using fallback data');
      }
      
      // Tüm veri kaynaklarını birleştir
      const allRestaurants = [
        ...webRestaurants, // Web'den onaylanan restoranlar öncelikli
        ...apiRestaurants,
        ...antalyaRestaurants // Varsayılan demo restoranlar
      ];
      
      // Duplicate removal (by id or name)
      const uniqueRestaurants = allRestaurants.filter((restaurant, index, self) => 
        index === self.findIndex(r => r._id === restaurant._id || r.ad === restaurant.ad)
      );
      
      setRestaurants(uniqueRestaurants);
      setDisplayedRestaurants(uniqueRestaurants.slice(0, ITEMS_PER_PAGE));
      setHasMore(uniqueRestaurants.length > ITEMS_PER_PAGE);
      
      console.log(`📱 Toplam ${uniqueRestaurants.length} restoran yüklendi (${webRestaurants.length} web + ${apiRestaurants.length} API + ${antalyaRestaurants.length} yerel)`);
      
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
      const response = await apiService.get('/restaurants');
      
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

  const filteredRestaurants = restaurants.filter(restaurant => {
    if (activeFilter === 'all') return true;
    const categoryMap = {
      'coffee': ['Kahve & Atıştırmalık', 'Özel Kahve'],
      'fastfood': ['Pizza & Fast Food', 'Fast Food'],
      'turkish': ['Türk Mutfağı'],
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
              <Text style={styles.ratingText}>{item.rating}</Text>
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

        {/* High Rated Restaurants Section */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yüksek Puanlı Restoranlar</Text>
            <Text style={styles.sectionSubtitle}>3km çevrendeki en iyi restoranlar</Text>
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
              {categoryFilters.map((category) => (
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
                        <Text style={styles.ratingText}>{restaurant.rating}</Text>
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
});

export default MainScreen;