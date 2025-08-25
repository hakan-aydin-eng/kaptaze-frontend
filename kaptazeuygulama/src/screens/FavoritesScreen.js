import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { useUserData } from '../context/UserDataContext';

const FavoritesScreen = ({ navigation }) => {
  const { favorites, currentUser, toggleFavorite } = useUserData();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorilerim</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>❤️ Favori Restoranlarım</Text>
          <Text style={styles.subtitle}>
            {currentUser ? `${favorites.length} favori restoran` : 'Giriş yapın'}
          </Text>
        </View>
        
        {!currentUser ? (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginIcon}>👤</Text>
            <Text style={styles.loginTitle}>Giriş Yapın</Text>
            <Text style={styles.loginDescription}>
              Favori restoranlarınızı görmek için giriş yapmalısınız.
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💔</Text>
            <Text style={styles.emptyTitle}>Henüz favori yok</Text>
            <Text style={styles.emptyDescription}>
              Restoranları beğenmeye başlayın, favorileriniz burada görünsün!
            </Text>
          </View>
        ) : (
          <View style={styles.favoritesList}>
            {favorites.map((restaurant) => {
              const mainPackage = restaurant.packages?.[0] || {};
              const totalPackages = restaurant.packages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;
              
              return (
                <TouchableOpacity 
                  key={restaurant._id} 
                  style={styles.favoriteCard}
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
                      <Text style={styles.heartIcon}>♥</Text>
                    </TouchableOpacity>
                    
                    {/* Package Count */}
                    <View style={styles.packageBadge}>
                      <Text style={styles.packageBadgeText}>{totalPackages} paket</Text>
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
                      <Text style={styles.distanceText}>{restaurant.distance}km</Text>
                      {mainPackage.salePrice && (
                        <Text style={styles.priceText}>₺{mainPackage.salePrice}</Text>
                      )}
                    </View>
                    <Text style={styles.addedDate}>
                      Eklenme: {new Date(restaurant.addedAt).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  header: {
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
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginPrompt: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  loginIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  loginDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  favoritesList: {
    padding: 16,
    gap: 16,
  },
  favoriteCard: {
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
    marginBottom: 8,
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
  distanceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  addedDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default FavoritesScreen;