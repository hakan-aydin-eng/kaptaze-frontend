import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { antalyaRestaurants } from '../data/antalyaRestaurants';
import { useUserData } from '../context/UserDataContext';
import apiService from '../services/apiService';

const NearbyScreen = ({ navigation }) => {
  const { toggleFavorite, isFavorite } = useUserData();
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('distance'); // distance, rating, price
  const [userLocation, setUserLocation] = useState('Antalya');
  const [selectedDistance, setSelectedDistance] = useState(10);

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

  useEffect(() => {
    loadNearbyRestaurants();
  }, [sortBy, selectedDistance]);

  const loadNearbyRestaurants = async () => {
    try {
      setLoading(true);
      console.log('🗺️ Loading nearby restaurants...');
      
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
        distance: restaurant.distance || calculateDistance(restaurant),
        packages: restaurant.packages || [{ originalPrice: 50, salePrice: 25, discount: 50, quantity: 3 }]
      }));

      // Duplicate removal (by id or name)
      const uniqueRestaurants = formattedRestaurants.filter((restaurant, index, self) => 
        index === self.findIndex(r => r._id === restaurant._id || r.name === restaurant.name)
      );
      
      // Filter by distance
      const nearbyFiltered = uniqueRestaurants.filter(restaurant => {
        const restaurantDistance = parseFloat(restaurant.distance) || 0;
        return restaurantDistance <= selectedDistance;
      });
      
      // Sort restaurants based on selected criteria
      let sorted = [...nearbyFiltered];
      
      switch (sortBy) {
        case 'distance':
          sorted = sorted.sort((a, b) => parseFloat(a.distance || 0) - parseFloat(b.distance || 0));
          break;
        case 'rating':
          sorted = sorted.sort((a, b) => {
            const aRating = typeof a.rating === 'object' ? a.rating.average || 0 : a.rating || 0;
            const bRating = typeof b.rating === 'object' ? b.rating.average || 0 : b.rating || 0;
            return bRating - aRating;
          });
          break;
        case 'price':
          sorted = sorted.sort((a, b) => {
            const aPrice = a.packages?.[0]?.salePrice || a.packages?.[0]?.discountedPrice || a.packages?.[0]?.price || 0;
            const bPrice = b.packages?.[0]?.salePrice || b.packages?.[0]?.discountedPrice || b.packages?.[0]?.price || 0;
            return aPrice - bPrice;
          });
          break;
        default:
          break;
      }
      
      setNearbyRestaurants(sorted);
      console.log(`🗺️ Toplam ${sorted.length} yakın restoran yüklendi (${selectedDistance}km çapında)`);
      
    } catch (error) {
      console.error('Nearby restaurants loading error:', error);
      // Hata durumunda fallback data kullan
      const fallbackData = antalyaRestaurants.filter(r => parseFloat(r.distance) <= selectedDistance);
      setNearbyRestaurants(fallbackData.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance based on coordinates (simplified)
  const calculateDistance = (restaurant) => {
    if (restaurant.location?.coordinates) {
      // Simple distance calculation - in real app would use proper geo calculations
      return (Math.random() * selectedDistance).toFixed(1);
    }
    return (Math.random() * 5 + 1).toFixed(1); // Random fallback distance
  };

  const getSortOptions = () => [
    { id: 'distance', name: 'Mesafe', icon: '📍' },
    { id: 'rating', name: 'Puan', icon: '⭐' },
    { id: 'price', name: 'Fiyat', icon: '💰' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yakınımdaki Restoranlar</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Yakın restoranlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yakınımdaki Restoranlar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.title}>📍 Yakınımdaki Restoranlar</Text>
          <Text style={styles.subtitle}>
            {userLocation} konumunda {nearbyRestaurants.length} restoran bulundu ({selectedDistance}km çapında)
          </Text>
        </View>

        {/* Sort Options */}
        <View style={styles.sortSection}>
          <Text style={styles.sortLabel}>Sıralama:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.sortOptions}>
              {getSortOptions().map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.sortButton,
                    sortBy === option.id && styles.sortButtonActive
                  ]}
                  onPress={() => setSortBy(option.id)}
                >
                  <Text style={styles.sortIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.sortText,
                    sortBy === option.id && styles.sortTextActive
                  ]}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Restaurant List */}
        <View style={styles.restaurantList}>
          {nearbyRestaurants.map((restaurant) => {
            const mainPackage = restaurant.packages?.[0] || {};
            const totalPackages = restaurant.packages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;
            
            return (
              <TouchableOpacity 
                key={restaurant._id} 
                style={styles.restaurantCard}
                onPress={() => navigation.navigate('RestaurantDetail', { restaurant })}
              >
                {/* Restaurant Image */}
                <View style={styles.restaurantImageContainer}>
                  {restaurant.imageUrl ? (
                    <Image 
                      source={{ uri: restaurant.imageUrl }} 
                      style={styles.restaurantImage}
                    />
                  ) : (
                    <View style={styles.restaurantGradient}>
                      <Text style={styles.restaurantIcon}>
                        {restaurant.image || getRestaurantIcon(restaurant.category)}
                      </Text>
                    </View>
                  )}
                  
                  {/* Heart Button */}
                  <TouchableOpacity 
                    style={styles.heartButton}
                    onPress={() => toggleFavorite(restaurant)}
                  >
                    <Text style={styles.heartIcon}>
                      {isFavorite(restaurant._id) ? '♥' : '♡'}
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Package Count */}
                  <View style={styles.packageBadge}>
                    <Text style={styles.packageBadgeText}>{totalPackages} paket</Text>
                  </View>

                  {/* Distance Badge */}
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceBadgeText}>{restaurant.distance}km</Text>
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
                        {typeof restaurant.rating === 'object' ? restaurant.rating.average || 0 : restaurant.rating || 0}
                      </Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeIcon}>⏰</Text>
                      <Text style={styles.timeText}>18:00-21:00</Text>
                    </View>
                    {(mainPackage.salePrice || mainPackage.discountedPrice || mainPackage.price) && (
                      <Text style={styles.priceText}>
                        ₺{mainPackage.salePrice || mainPackage.discountedPrice || mainPackage.price}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
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
  headerInfo: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  comingSoon: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  sortSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sortLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  sortButtonActive: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  sortIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  sortText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#16a34a',
  },
  restaurantList: {
    padding: 16,
    gap: 16,
  },
  restaurantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  restaurantImageContainer: {
    height: 140,
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
  heartButton: {
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
  heartIcon: {
    fontSize: 16,
    color: '#ef4444',
  },
  packageBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  packageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  distanceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(22,163,74,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
});

export default NearbyScreen;