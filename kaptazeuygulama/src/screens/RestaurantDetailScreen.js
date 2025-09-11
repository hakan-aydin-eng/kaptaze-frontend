import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Linking,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useUserData } from '../context/UserDataContext';
import apiService from '../services/apiService';

const RestaurantDetailScreen = ({ route, navigation }) => {
  const { restaurant: initialRestaurant } = route.params;
  const { toggleFavorite, isFavorite } = useUserData();
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRestaurantDetails();
  }, []);

  const loadRestaurantDetails = async () => {
    if (!initialRestaurant._id) return;
    
    try {
      setLoading(true);
      const response = await apiService.getRestaurantById(initialRestaurant._id);
      
      if (response.success && response.data) {
        const apiRestaurant = {
          ...response.data,
          // Format packages to match expected structure
          packages: response.data.packages?.map(pkg => ({
            ...pkg,
            _id: pkg.id,
            originalPrice: pkg.originalPrice || pkg.price * 2,
            salePrice: pkg.discountedPrice || pkg.price,
            discount: pkg.originalPrice ? Math.round((1 - pkg.discountedPrice / pkg.originalPrice) * 100) : 50
          })) || [],
          // Ensure rating is a number
          rating: typeof response.data.rating === 'object' ? response.data.rating.average || 0 : response.data.rating || 0
        };
        
        setRestaurant(apiRestaurant);
        setSelectedPackage(apiRestaurant.packages?.[0] || null);
        
        console.log('📍 Restaurant details loaded:', apiRestaurant.name);
        console.log('📦 Packages found:', apiRestaurant.packages?.length || 0);
      }
    } catch (error) {
      console.error('Restaurant details loading error:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getPackageStatus = (restaurant) => {
    const totalPackages = restaurant.packages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;
    if (totalPackages === 0) return { text: 'Tükendi', color: '#9ca3af' };
    if (totalPackages === 1) return { text: 'Son paket!', color: '#f59e0b' };
    return { text: 'Şimdi al', color: '#16a34a' };
  };

  const openWebsite = () => {
    // Check both website field and socialMedia.website
    const websiteUrl = restaurant.website || restaurant.socialMedia?.website;
    
    if (websiteUrl) {
      Linking.openURL(websiteUrl);
    } else {
      Alert.alert('Bilgi', 'Bu restoran için website bilgisi bulunmuyor.');
    }
  };


  const getDirections = () => {
    if (restaurant.location?.coordinates) {
      const [lng, lat] = restaurant.location.coordinates;
      const url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
      Linking.openURL(url);
    } else if (restaurant.location?.lat && restaurant.location?.lng) {
      const { lat, lng } = restaurant.location;
      const url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Bilgi', 'Bu restoran için konum bilgisi bulunmuyor.');
    }
  };

  const openMap = () => {
    if (restaurant.location?.coordinates) {
      const [lng, lat] = restaurant.location.coordinates;
      const url = `https://maps.google.com/maps?q=${lat},${lng}&zoom=15`;
      Linking.openURL(url);
    } else if (restaurant.location?.lat && restaurant.location?.lng) {
      const { lat, lng } = restaurant.location;
      const url = `https://maps.google.com/maps?q=${lat},${lng}&zoom=15`;
      Linking.openURL(url);
    }
  };

  const increaseQuantity = () => {
    if (selectedPackage && quantity < selectedPackage.quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const goToPurchase = () => {
    if (selectedPackage) {
      navigation.navigate('Purchase', { 
        restaurant, 
        package: selectedPackage, 
        quantity 
      });
    } else {
      Alert.alert('Uyarı', 'Lütfen bir paket seçin.');
    }
  };

  const statusInfo = getPackageStatus(restaurant);
  const mainPackage = restaurant.packages?.[0];
  const totalPackages = restaurant.packages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{restaurant.name}</Text>
        <TouchableOpacity 
          style={styles.heartButton}
          onPress={() => toggleFavorite(restaurant)}
        >
          <Text style={styles.heartIcon}>
            {isFavorite(restaurant._id) ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Restaurant Image Header - Ana sayfa kartları gibi */}
        <View style={styles.restaurantImageContainer}>
          {(restaurant.restaurantImage || restaurant.profileImage || restaurant.imageUrl) ? (
            <Image 
              source={{ uri: restaurant.restaurantImage || restaurant.profileImage || restaurant.imageUrl }} 
              style={styles.restaurantImage}
              onError={() => console.log('Restaurant detail image failed to load:', restaurant.name)}
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
          
          
          {/* Package Count Badge */}
          <View style={styles.restaurantPackageBadge}>
            <Text style={styles.restaurantPackageText}>{totalPackages} paket</Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>

          {/* Price Info */}
          {mainPackage && (
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
          )}
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantCategory}>{restaurant.category}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.ratingContainer}>
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={styles.ratingText}>
                {typeof restaurant.rating === 'object' ? restaurant.rating.average || 0 : restaurant.rating || 0}
              </Text>
            </View>
            <View style={styles.pickupTimeContainer}>
              <Text style={styles.pickupTimeIcon}>⏰</Text>
              <Text style={styles.pickupTimeText}>
                {restaurant.workingHours?.weekday ? 
                  `${restaurant.workingHours.weekday.open}-${restaurant.workingHours.weekday.close}` : 
                  '18:00-21:00'}
              </Text>
            </View>
            <Text style={styles.distanceText}>📍 {restaurant.distance || '2.5'}km</Text>
          </View>

        </View>

        {/* Ne alacaksınız? - İşletme Açıklaması */}
        <View style={styles.adminSection}>
          <Text style={styles.adminTitle}>🍽️ Ne alacaksınız?</Text>
          <View style={styles.adminNoteContainer}>
            <Text style={styles.adminNote}>
              {restaurant.description || 'Restoran sahibi henüz işletme açıklaması eklememiş.'}
            </Text>
          </View>
          
          {/* Paket Fiyatları ve Rezervasyon */}
          {restaurant.packages && restaurant.packages.length > 0 && (
            <View style={styles.packageContainer}>
              {restaurant.packages.map((pkg, index) => (
                <View key={pkg._id || index} style={styles.packageItem}>
                  <View style={styles.packageInfo}>
                    <Text style={styles.packageName}>
                      {pkg.name || `Paket ${index + 1}`}
                    </Text>
                    {pkg.description && (
                      <Text style={styles.packageDescription}>
                        {pkg.description}
                      </Text>
                    )}
                    <View style={styles.packagePricing}>
                      <Text style={styles.packageOriginalPrice}>₺{pkg.originalPrice}</Text>
                      <Text style={styles.packageSalePrice}>₺{pkg.salePrice}</Text>
                      <View style={styles.packageDiscountBadge}>
                        <Text style={styles.packageDiscountText}>%{pkg.discount} İndirim</Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.packageReserveButton}
                    onPress={() => {
                      setSelectedPackage(pkg);
                      goToPurchase();
                    }}
                  >
                    <Text style={styles.packageReserveText}>Rezerve Et</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Harita Konumu */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>📍 Konum</Text>
          <View style={styles.mapContainer}>
            {restaurant.location?.coordinates ? (
              <View style={styles.mapViewContainer}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.mapImage}
                  initialRegion={{
                    latitude: restaurant.location.coordinates[1],
                    longitude: restaurant.location.coordinates[0],
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  region={{
                    latitude: restaurant.location.coordinates[1],
                    longitude: restaurant.location.coordinates[0],
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  onError={(e) => console.error('Restaurant Map Error:', e)}
                  onMapReady={() => console.log('✅ Restaurant map is ready')}
                  loadingEnabled={true}
                  loadingIndicatorColor="#16a34a"
                  loadingBackgroundColor="#f8fafc"
                >
                  <Marker
                    coordinate={{
                      latitude: restaurant.location.coordinates[1],
                      longitude: restaurant.location.coordinates[0],
                    }}
                    title={restaurant.name}
                    description={restaurant.category}
                    pinColor="#16a34a"
                  />
                </MapView>
              </View>
            ) : (
              <TouchableOpacity style={styles.mapPlaceholder} onPress={openMap}>
                <Text style={styles.mapIcon}>🗺️</Text>
                <Text style={styles.mapText}>Haritada Görüntüle</Text>
              </TouchableOpacity>
            )}
            <View style={styles.addressContainer}>
              <Text style={styles.addressText}>
                {restaurant.address?.street || restaurant.location?.address || 'Adres bilgisi yok'}
              </Text>
              <TouchableOpacity style={styles.directionsSmallButton} onPress={getDirections}>
                <Text style={styles.directionsIcon}>🧭</Text>
                <Text style={styles.directionsSmallText}>Yol Tarifi Al</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Website */}
        <View style={styles.websiteSection}>
          <Text style={styles.sectionTitle}>🌐 Website</Text>
          <TouchableOpacity style={styles.websiteButton} onPress={openWebsite}>
            <Text style={styles.websiteButtonText}>
              {restaurant.website || restaurant.socialMedia?.website || 'Website bilgisi yok'}
            </Text>
            <Text style={styles.websiteArrow}>→</Text>
          </TouchableOpacity>
        </View>


        {/* Empty state for no packages */}
        {(!restaurant.packages || restaurant.packages.length === 0) && (
          <View style={styles.emptyPackages}>
            <Text style={styles.emptyPackagesIcon}>📦</Text>
            <Text style={styles.emptyPackagesText}>
              Bu restoranda şu anda mevcut paket bulunmuyor.
            </Text>
          </View>
        )}

        {/* Satış ve Sorumluluk */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>📜 Satış ve Sorumluluk</Text>
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              Paketler satıcılar tarafından satılmaktadır. 6502 no'lu Tüketicinin Korunması Hakkında Kanun kapmasında korunmaktasınız.
            </Text>
          </View>
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
    flex: 1,
    textAlign: 'center',
  },
  heartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 20,
    color: '#ef4444',
  },
  content: {
    flex: 1,
  },
  restaurantImageContainer: {
    height: 200,
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
    fontSize: 64,
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
  infoSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  restaurantCategory: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pickupTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupTimeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  pickupTimeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  distanceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  adminSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  adminNoteContainer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  adminNote: {
    fontSize: 14,
    color: '#15803d',
    lineHeight: 20,
  },
  packageContainer: {
    marginTop: 16,
  },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  packageInfo: {
    flex: 1,
    marginRight: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  packagePricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageOriginalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  packageSalePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  packageDiscountBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  packageDiscountText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  packageReserveButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  packageReserveText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  websiteSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  websiteButtonText: {
    fontSize: 14,
    color: '#1d4ed8',
    flex: 1,
  },
  websiteArrow: {
    fontSize: 16,
    color: '#9ca3af',
  },
  directionsSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d4ed8',
    padding: 12,
    borderRadius: 8,
  },
  directionsIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  directionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  mapSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  mapContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  mapViewContainer: {
    height: 200,
  },
  staticMap: {
    height: 200,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapFallbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(243, 244, 246, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapFallbackText: {
    fontSize: 32,
    marginBottom: 8,
  },
  mapFallbackSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mapOverlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginRight: 12,
  },
  directionsSmallButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directionsIcon: {
    fontSize: 14,
    color: '#ffffff',
  },
  directionsSmallText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  inventorySection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  inventoryItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  inventoryItemSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  inventoryLeft: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  inventoryDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  inventoryPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inventoryOriginalPrice: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  inventorySalePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  inventoryDiscount: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  inventoryRight: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
  },
  reserveButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  reserveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyPackages: {
    backgroundColor: '#ffffff',
    padding: 32,
    marginTop: 8,
    alignItems: 'center',
  },
  emptyPackagesIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyPackagesText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  legalSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  legalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  legalContainer: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  legalText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
    textAlign: 'justify',
  },
});

export default RestaurantDetailScreen;