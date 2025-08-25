import React, { useState } from 'react';
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
} from 'react-native';
import { useUserData } from '../context/UserDataContext';

const RestaurantDetailScreen = ({ route, navigation }) => {
  const { restaurant } = route.params;
  const { toggleFavorite, isFavorite } = useUserData();
  const [selectedPackage, setSelectedPackage] = useState(restaurant.packages?.[0] || null);
  const [quantity, setQuantity] = useState(1);

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

  const getPackageStatus = (restaurant) => {
    const totalPackages = restaurant.packages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;
    if (totalPackages === 0) return { text: 'Tükendi', color: '#9ca3af' };
    if (totalPackages === 1) return { text: 'Son paket!', color: '#f59e0b' };
    return { text: 'Şimdi al', color: '#16a34a' };
  };

  const openWebsite = () => {
    if (restaurant.website) {
      Linking.openURL(restaurant.website);
    } else {
      Alert.alert('Bilgi', 'Bu restoran için website bilgisi bulunmuyor.');
    }
  };

  const getDirections = () => {
    if (restaurant.location) {
      const { lat, lng } = restaurant.location;
      const url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Bilgi', 'Bu restoran için konum bilgisi bulunmuyor.');
    }
  };

  const openMap = () => {
    if (restaurant.location) {
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
          {restaurant.imageUrl ? (
            <Image 
              source={{ uri: restaurant.imageUrl }} 
              style={styles.restaurantImage}
              onError={() => console.log('Image failed to load')}
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
              <Text style={styles.ratingText}>{restaurant.rating}</Text>
            </View>
            <View style={styles.pickupTimeContainer}>
              <Text style={styles.pickupTimeIcon}>⏰</Text>
              <Text style={styles.pickupTimeText}>18:00-21:00</Text>
            </View>
            <Text style={styles.distanceText}>{restaurant.distance}km</Text>
          </View>

          <Text style={styles.description}>
            {restaurant.description}
          </Text>
        </View>

        {/* Neyi Kurtarıyorsun? - Admin Alanı */}
        <View style={styles.adminSection}>
          <Text style={styles.adminTitle}>🍽️ Neyi Kurtarıyorsun?</Text>
          <View style={styles.adminNoteContainer}>
            <Text style={styles.adminNote}>
              {restaurant.adminNote || 'Restoran sahibi henüz ürün açıklaması eklememiş.'}
            </Text>
          </View>
        </View>

        {/* Website */}
        <View style={styles.websiteSection}>
          <Text style={styles.sectionTitle}>🌐 Website</Text>
          <TouchableOpacity style={styles.websiteButton} onPress={openWebsite}>
            <Text style={styles.websiteButtonText}>
              {restaurant.website || 'Website bilgisi yok'}
            </Text>
            <Text style={styles.websiteArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Yol Tarifi */}
        <View style={styles.directionsSection}>
          <TouchableOpacity style={styles.directionsButton} onPress={getDirections}>
            <Text style={styles.directionsIcon}>🧭</Text>
            <Text style={styles.directionsText}>Yol Tarifi Al</Text>
          </TouchableOpacity>
        </View>

        {/* Harita Konumu */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>📍 Konum</Text>
          <TouchableOpacity style={styles.mapContainer} onPress={openMap}>
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapIcon}>🗺️</Text>
              <Text style={styles.mapText}>Haritada Görüntüle</Text>
            </View>
            <Text style={styles.addressText}>
              {restaurant.location?.address || 'Adres bilgisi yok'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ürün Envanteri */}
        {restaurant.packages && restaurant.packages.length > 0 && (
          <View style={styles.inventorySection}>
            <Text style={styles.sectionTitle}>📦 Ürün Envanteri</Text>
            
            {restaurant.packages.map((pkg, index) => (
              <View key={pkg._id || index} style={[
                styles.inventoryItem,
                selectedPackage?._id === pkg._id && styles.inventoryItemSelected
              ]}>
                <TouchableOpacity 
                  style={styles.inventoryLeft}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  <Text style={styles.inventoryName}>
                    {pkg.name || `Paket ${index + 1}`}
                  </Text>
                  <Text style={styles.inventoryDescription}>
                    {pkg.description}
                  </Text>
                  <View style={styles.inventoryPricing}>
                    <Text style={styles.inventoryOriginalPrice}>₺{pkg.originalPrice}</Text>
                    <Text style={styles.inventorySalePrice}>₺{pkg.salePrice}</Text>
                    <Text style={styles.inventoryDiscount}>%{pkg.discount} İndirim</Text>
                  </View>
                </TouchableOpacity>
                
                {selectedPackage?._id === pkg._id && (
                  <View style={styles.inventoryRight}>
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={decreaseQuantity}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{quantity}</Text>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={increaseQuantity}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.reserveButton}
                      onPress={goToPurchase}
                    >
                      <Text style={styles.reserveButtonText}>Rezerve Et</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Empty state for no packages */}
        {(!restaurant.packages || restaurant.packages.length === 0) && (
          <View style={styles.emptyPackages}>
            <Text style={styles.emptyPackagesIcon}>📦</Text>
            <Text style={styles.emptyPackagesText}>
              Bu restoranda şu anda mevcut paket bulunmuyor.
            </Text>
          </View>
        )}
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
    borderRadius: 8,
    overflow: 'hidden',
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
  addressText: {
    padding: 12,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#ffffff',
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
});

export default RestaurantDetailScreen;