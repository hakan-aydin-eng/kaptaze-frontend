import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Swiper from 'react-native-deck-swiper';
import apiService from '../services/apiService';
import { useUserData } from '../context/UserDataContext';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.7;
const CARD_LEFT = (width - CARD_WIDTH) / 2; // Center the card

// Calculate distance helper
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10;
};

const OpportunityFinderScreen = ({ navigation, route }) => {
  const { currentUser } = useUserData();
  const [restaurants, setRestaurants] = useState([]);
  const [likedOpportunities, setLikedOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const swiperRef = useRef(null);
  const { userCoordinates } = route.params || {};

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setLikedOpportunities([]);
      setShowSummary(false);
      setCardIndex(0);
      console.log('🎯 Loading opportunity packages...');

      const response = await apiService.getRestaurants();

      if (response.success && response.data && response.data.restaurants) {
        // 1. Filter restaurants with active packages
        let validRestaurants = response.data.restaurants.filter(r =>
          r.packages && r.packages.length > 0 &&
          r.packages.some(p => p.status === 'active' && p.quantity > 0)
        );

        // 2. Calculate distances and sort by nearest if coordinates exist
        if (userCoordinates) {
          validRestaurants = validRestaurants.map(r => {
            let dist = 999;
            if (r.location && (r.location.coordinates || (r.location.lat && r.location.lng))) {
              const lat = r.location.coordinates ? r.location.coordinates[1] : r.location.lat;
              const lng = r.location.coordinates ? r.location.coordinates[0] : r.location.lng;
              dist = calculateDistance(
                userCoordinates.latitude,
                userCoordinates.longitude,
                lat,
                lng
              );
            }
            return { ...r, distanceValue: dist, formattedDistance: `${dist}km` };
          }).sort((a, b) => a.distanceValue - b.distanceValue);
        } else {
          // Fallback: Random shuffle if no location
          validRestaurants = validRestaurants.sort(() => 0.5 - Math.random());
        }

        // 3. Take top 10
        const selectedRestaurants = validRestaurants.slice(0, 10);

        console.log(`✅ Loaded ${selectedRestaurants.length} opportunity restaurants`);
        setRestaurants(selectedRestaurants);
      } else {
        setRestaurants([]);
      }
    } catch (error) {
      console.error('❌ Error loading opportunities:', error);
      Alert.alert('Hata', 'Fırsatlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeLeft = (index) => {
    console.log('👈 Swiped left (Pass) on:', restaurants[index]?.name);
  };

  const handleSwipeRight = (index) => {
    const restaurant = restaurants[index];
    console.log('👉 Swiped right (Like) on:', restaurant?.name);
    if (restaurant) {
      setLikedOpportunities(prev => {
        // Prevent duplicates just in case
        if (prev.some(item => item._id === restaurant._id)) return prev;
        return [...prev, restaurant];
      });
    }
  };

  const handleSwipeAll = () => {
    console.log('🎉 All cards swiped!');
    setShowSummary(true);
  };

  const handlePurchase = (restaurant) => {
    if (!currentUser) {
      Alert.alert(
        'Giriş Yapmalısın',
        'Bu fırsatı yakalamak için lütfen giriş yap veya kayıt ol.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    navigation.navigate('RestaurantDetail', { restaurant });
  };

  const renderCard = (restaurant) => {
    if (!restaurant) return null;

    const mainPackage = restaurant.packages.find(p => p.status === 'active') || restaurant.packages[0];
    const totalPackages = restaurant.packages.reduce((sum, pkg) => sum + pkg.quantity, 0);
    const hasImage = restaurant.imageUrl || restaurant.profileImage || restaurant.restaurantImage;

    return (
      <View style={styles.card}>
        <LinearGradient
          colors={['#ffffff', '#f9fafb']}
          style={styles.cardGradient}
        >
          {/* Restaurant Image */}
          <View style={styles.imageContainer}>
            {hasImage ? (
              <Image
                source={{ uri: restaurant.imageUrl || restaurant.profileImage || restaurant.restaurantImage }}
                style={styles.restaurantImage}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#16a34a', '#059669']}
                style={styles.placeholderGradient}
              >
                <Text style={styles.placeholderEmoji}>🍽️</Text>
              </LinearGradient>
            )}

            <View style={styles.packageBadge}>
              <Text style={styles.packageBadgeText}>{totalPackages} paket</Text>
            </View>

            {mainPackage.originalPrice && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  %{Math.round((1 - (mainPackage.discountedPrice || mainPackage.price) / mainPackage.originalPrice) * 100)}
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
            <Text style={styles.restaurantCategory}>{restaurant.category}</Text>

            <View style={styles.packageInfo}>
              <View style={styles.priceContainer}>
                {mainPackage.originalPrice && (
                  <Text style={styles.originalPrice}>₺{mainPackage.originalPrice}</Text>
                )}
                <Text style={styles.salePrice}>₺{mainPackage.discountedPrice || mainPackage.price}</Text>
              </View>
              <View style={styles.metaInfo}>
                <Text style={styles.metaText}>📍 {restaurant.formattedDistance || '2.5km'}</Text>
                <Text style={styles.metaText}>⭐ {(restaurant.rating?.average || 4.5).toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderSummaryItem = ({ item }) => {
    const mainPackage = item.packages.find(p => p.status === 'active') || item.packages[0];
    const hasImage = item.imageUrl || item.profileImage || item.restaurantImage;

    return (
      <TouchableOpacity
        style={styles.summaryCard}
        onPress={() => handlePurchase(item)}
      >
        <View style={styles.summaryImageContainer}>
          {hasImage ? (
            <Image
              source={{ uri: item.imageUrl || item.profileImage || item.restaurantImage }}
              style={styles.summaryImage}
            />
          ) : (
            <View style={[styles.summaryImage, styles.summaryPlaceholder]}>
              <Text>🍽️</Text>
            </View>
          )}
        </View>

        <View style={styles.summaryInfo}>
          <Text style={styles.summaryName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.summaryDistance}>📍 {item.formattedDistance || 'Yakın'}</Text>
        </View>

        <View style={styles.summaryPriceContainer}>
          {mainPackage.originalPrice && (
            <Text style={styles.summaryOriginalPrice}>₺{mainPackage.originalPrice}</Text>
          )}
          <Text style={styles.summaryPrice}>₺{mainPackage.discountedPrice || mainPackage.price}</Text>
          <View style={styles.buyButton}>
            <Text style={styles.buyButtonText}>Al</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Fırsatlar aranıyor...</Text>
      </View>
    );
  }

  if (showSummary) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#16a34a', '#059669']} style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Text style={styles.headerBackIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Seçtikleriniz</Text>
            <Text style={styles.headerSubtitle}>{likedOpportunities.length} fırsat beğendiniz</Text>
          </View>
          <View style={styles.headerRight} />
        </LinearGradient>

        {likedOpportunities.length > 0 ? (
          <FlatList
            data={likedOpportunities}
            renderItem={renderSummaryItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.summaryList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🤷‍♂️</Text>
            <Text style={styles.emptyTitle}>Hiçbirini Beğenmediniz</Text>
            <Text style={styles.emptyText}>Zevkler ve renkler tartışılmaz...</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={loadOpportunities}>
              <Text style={styles.reloadButtonText}>🔄 Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (restaurants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>😔</Text>
        <Text style={styles.emptyTitle}>Fırsat Bulunamadı</Text>
        <Text style={styles.emptyText}>Şu anda yakınınızda aktif paket yok.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#16a34a', '#059669']} style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Fırsat Bul</Text>
          <Text style={styles.headerSubtitle}>{cardIndex + 1} / {restaurants.length}</Text>
        </View>
        <TouchableOpacity style={styles.headerRight} onPress={() => setShowSummary(true)}>
          <Text style={styles.finishText}>Bitir</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Swiper */}
      <View style={styles.swiperContainer} pointerEvents="box-none">
        <Swiper
          ref={swiperRef}
          cards={restaurants}
          renderCard={renderCard}
          onSwipedLeft={handleSwipeLeft}
          onSwipedRight={handleSwipeRight}
          onSwipedAll={handleSwipeAll}
          cardIndex={cardIndex}
          backgroundColor="transparent"
          stackSize={3}
          stackScale={10}
          stackSeparation={15}
          disableTopSwipe
          disableBottomSwipe
          animateOverlayLabelsOpacity
          animateCardOpacity
          containerStyle={styles.swiperInner}
          cardStyle={styles.cardStyle} // Uses calculated LEFT for centering
          overlayLabels={{
            left: {
              title: 'ATLA',
              style: {
                label: {
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 'bold',
                  padding: 10,
                  borderRadius: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: -30,
                },
              },
            },
            right: {
              title: 'İLGİLENİYORUM',
              style: {
                label: {
                  backgroundColor: '#16a34a',
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 'bold',
                  padding: 10,
                  borderRadius: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: 30,
                },
              },
            },
          }}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton]}
          onPress={() => {
            console.log('👈 Skip button pressed');
            swiperRef.current?.swipeLeft();
          }}
        >
          <Text style={styles.actionButtonIcon}>👈</Text>
          <Text style={styles.actionButtonText}>Geç</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => {
            console.log('👉 Like button pressed');
            swiperRef.current?.swipeRight();
          }}
        >
          <Text style={styles.actionButtonIcon}>👉</Text>
          <Text style={styles.actionButtonText}>Beğen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6b7280' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  backButton: { backgroundColor: '#16a34a', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  backButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  reloadButton: { backgroundColor: '#16a34a', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, marginTop: 16 },
  reloadButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerBackButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerBackIcon: { fontSize: 24, color: '#ffffff' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerRight: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  finishText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

  swiperContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1, // Ensure swiper is below header but above background
  },
  swiperInner: {
    flex: 1,
  },
  cardStyle: {
    top: 40, // Added margin from top to prevent touching header
    left: CARD_LEFT,
  },
  card: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  cardGradient: { flex: 1 },
  imageContainer: { height: CARD_HEIGHT * 0.6, position: 'relative' },
  restaurantImage: { width: '100%', height: '100%' },
  placeholderGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 80 },
  packageBadge: { position: 'absolute', bottom: 16, left: 16, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  packageBadgeText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  discountBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  discountText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  infoContainer: { padding: 20 },
  restaurantName: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  restaurantCategory: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  packageInfo: { marginBottom: 12 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  originalPrice: { fontSize: 18, color: '#9ca3af', textDecorationLine: 'line-through' },
  salePrice: { fontSize: 28, fontWeight: 'bold', color: '#16a34a' },
  metaInfo: { flexDirection: 'row', gap: 16 },
  metaText: { fontSize: 14, color: '#6b7280' },

  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    position: 'absolute', // Fix: Position absolutely at bottom
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Fix: Ensure buttons are on top
    paddingBottom: 40 // Add safe area padding
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  skipButton: { backgroundColor: '#ef4444' },
  likeButton: { backgroundColor: '#16a34a' },
  actionButtonIcon: { fontSize: 24 },
  actionButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },

  summaryList: { padding: 16 },
  summaryCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, padding: 12, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  summaryImageContainer: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', marginRight: 12 },
  summaryImage: { width: '100%', height: '100%' },
  summaryPlaceholder: { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  summaryInfo: { flex: 1 },
  summaryName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  summaryDistance: { fontSize: 14, color: '#6b7280' },
  summaryPriceContainer: { alignItems: 'flex-end' },
  summaryOriginalPrice: { fontSize: 12, color: '#9ca3af', textDecorationLine: 'line-through' },
  summaryPrice: { fontSize: 16, fontWeight: 'bold', color: '#16a34a', marginBottom: 4 },
  buyButton: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  buyButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
});

export default OpportunityFinderScreen;
