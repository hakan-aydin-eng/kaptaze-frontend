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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Swiper from 'react-native-deck-swiper';
import apiService from '../services/apiService';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.7;

const OpportunityFinderScreen = ({ navigation, route }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const [noMoreCards, setNoMoreCards] = useState(false);
  const swiperRef = useRef(null);
  const { userCoordinates } = route.params || {};

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      console.log('🎯 Loading opportunity packages...');

      const response = await apiService.getRestaurants();

      if (response.success && response.data && response.data.restaurants) {
        // Sadece aktif paketleri olan restoranları filtrele
        const restaurantsWithPackages = response.data.restaurants.filter(r =>
          r.packages && r.packages.length > 0 &&
          r.packages.some(p => p.status === 'active' && p.quantity > 0)
        );

        // Rastgele 10 restoran seç
        const shuffled = restaurantsWithPackages.sort(() => 0.5 - Math.random());
        const selectedRestaurants = shuffled.slice(0, 10);

        console.log(`✅ Loaded ${selectedRestaurants.length} opportunity restaurants`);
        setRestaurants(selectedRestaurants);
      } else {
        console.log('⚠️ No restaurants with packages found');
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
    console.log('👈 Swiped left on:', restaurants[index]?.name);
  };

  const handleSwipeRight = (index) => {
    console.log('👉 Swiped right on:', restaurants[index]?.name);
    const restaurant = restaurants[index];
    if (restaurant) {
      // Kart kaydırma animasyonu bitince restoran detayına git
      setTimeout(() => {
        navigation.navigate('RestaurantDetail', { restaurant });
      }, 300);
    }
  };

  const handleSwipeAll = () => {
    console.log('🎉 All cards swiped!');
    setNoMoreCards(true);
  };

  const renderCard = (restaurant) => {
    if (!restaurant) return null;

    const mainPackage = restaurant.packages[0];
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

            {/* Package Count Badge */}
            <View style={styles.packageBadge}>
              <Text style={styles.packageBadgeText}>{totalPackages} paket</Text>
            </View>

            {/* Discount Badge */}
            {mainPackage.originalPrice && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  %{Math.round((1 - mainPackage.discountedPrice / mainPackage.originalPrice) * 100)}
                </Text>
              </View>
            )}
          </View>

          {/* Restaurant Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {restaurant.name}
            </Text>
            <Text style={styles.restaurantCategory}>{restaurant.category}</Text>

            {/* Package Info */}
            <View style={styles.packageInfo}>
              <View style={styles.priceContainer}>
                {mainPackage.originalPrice && (
                  <Text style={styles.originalPrice}>
                    ₺{mainPackage.originalPrice}
                  </Text>
                )}
                <Text style={styles.salePrice}>
                  ₺{mainPackage.discountedPrice || mainPackage.price}
                </Text>
              </View>
              <View style={styles.metaInfo}>
                <Text style={styles.metaText}>⏰ {restaurant.operatingHours?.open || '09:00'}-{restaurant.operatingHours?.close || '22:00'}</Text>
                <Text style={styles.metaText}>⭐ {(restaurant.rating?.average || 4.5).toFixed(1)}</Text>
              </View>
            </View>

            {/* Description */}
            {restaurant.description && (
              <Text style={styles.description} numberOfLines={2}>
                {restaurant.description}
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderNoMoreCards = () => {
    return (
      <View style={styles.noMoreCardsContainer}>
        <LinearGradient
          colors={['#16a34a', '#059669']}
          style={styles.noMoreCardsGradient}
        >
          <Text style={styles.noMoreCardsEmoji}>🎉</Text>
          <Text style={styles.noMoreCardsTitle}>Tüm Fırsatları Gördünüz!</Text>
          <Text style={styles.noMoreCardsText}>
            10 harika restoran keşfettiniz
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={() => {
              setNoMoreCards(false);
              setCardIndex(0);
              loadOpportunities();
            }}
          >
            <Text style={styles.reloadButtonText}>🔄 Yenile</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Fırsatlar yükleniyor...</Text>
      </View>
    );
  }

  if (restaurants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>😔</Text>
        <Text style={styles.emptyTitle}>Fırsat Bulunamadı</Text>
        <Text style={styles.emptyText}>
          Şu anda aktif paket bulunan restoran yok.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#16a34a', '#059669']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Fırsat Bul</Text>
          <Text style={styles.headerSubtitle}>
            {noMoreCards ? '10/10' : `${cardIndex + 1}/10`}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <View style={styles.instruction}>
          <Text style={styles.instructionIcon}>👈</Text>
          <Text style={styles.instructionText}>Kaydır: Geç</Text>
        </View>
        <View style={styles.instruction}>
          <Text style={styles.instructionIcon}>👉</Text>
          <Text style={styles.instructionText}>Kaydır: Detay</Text>
        </View>
      </View>

      {/* Swiper */}
      <View style={styles.swiperContainer}>
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
          cardStyle={styles.cardStyle}
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
        {noMoreCards && renderNoMoreCards()}
      </View>

      {/* Action Buttons */}
      {!noMoreCards && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={() => swiperRef.current?.swipeLeft()}
          >
            <Text style={styles.actionButtonIcon}>👈</Text>
            <Text style={styles.actionButtonText}>Geç</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => swiperRef.current?.swipeRight()}
          >
            <Text style={styles.actionButtonIcon}>👉</Text>
            <Text style={styles.actionButtonText}>İncele</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  instructionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionIcon: {
    fontSize: 24,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  swiperContainer: {
    flex: 1,
    position: 'relative',
  },
  swiperInner: {
    flex: 1,
  },
  cardStyle: {
    top: 0,
    left: 0,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    flex: 1,
  },
  imageContainer: {
    height: CARD_HEIGHT * 0.6,
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  packageBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  packageBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoContainer: {
    padding: 20,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  restaurantCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  packageInfo: {
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 18,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  salePrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  skipButton: {
    backgroundColor: '#ef4444',
  },
  likeButton: {
    backgroundColor: '#16a34a',
  },
  actionButtonIcon: {
    fontSize: 24,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  noMoreCardsContainer: {
    position: 'absolute',
    top: 0,
    left: (width - CARD_WIDTH) / 2,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
  },
  noMoreCardsGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noMoreCardsEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  noMoreCardsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  noMoreCardsText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 32,
    textAlign: 'center',
  },
  reloadButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  reloadButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default OpportunityFinderScreen;
