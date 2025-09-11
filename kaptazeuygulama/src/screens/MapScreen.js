import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import apiService from '../services/apiService';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapScreen = ({ navigation, route }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get user location from route params or use Antalya as fallback
  const { userLocation = 'Antalya', userCoordinates, selectedDistance = 10 } = route.params || {};
  
  const [mapRegion, setMapRegion] = useState({
    latitude: userCoordinates?.latitude || 36.8969,
    longitude: userCoordinates?.longitude || 30.7133,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      console.log('🗺️ Loading restaurants for map...');
      
      // Try to load from API first
      let apiRestaurants = [];
      try {
        const apiResponse = await apiService.getRestaurants();
        if (apiResponse.success && apiResponse.data) {
          apiRestaurants = apiResponse.data;
          console.log('✅ Loaded', apiRestaurants.length, 'restaurants from API');
        }
      } catch (error) {
        console.warn('⚠️ API failed, using local data:', error.message);
      }

      // Only use API data - no fallback
      const finalRestaurants = apiRestaurants;
      
      // Add coordinates to restaurants that don't have them
      const restaurantsWithCoords = finalRestaurants.map(restaurant => {
        if (!restaurant.location?.coordinates) {
          // Generate random coordinates around Antalya for demo
          const lat = 36.8969 + (Math.random() - 0.5) * 0.1;
          const lng = 30.7133 + (Math.random() - 0.5) * 0.1;
          return {
            ...restaurant,
            location: {
              type: 'Point',
              coordinates: [lng, lat]
            }
          };
        }
        return restaurant;
      });

      setRestaurants(restaurantsWithCoords);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Failed to load restaurants:', error);
      // No fallback - show empty map
      setRestaurants([]);
      setLoading(false);
    }
  };

  const handleMarkerPress = (restaurant) => {
    Alert.alert(
      restaurant.name,
      `📍 ${restaurant.category}\n⭐ ${restaurant.rating || 4.5}/5\n📦 ${restaurant.packages?.length || 0} paket mevcut`,
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Detayları Gör',
          onPress: () => navigation.navigate('RestaurantDetail', { restaurant }),
        },
      ],
    );
  };

  const getMarkerColor = (restaurant) => {
    const packageCount = restaurant.packages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;
    if (packageCount === 0) return '#9ca3af'; // Gray - no packages
    if (packageCount <= 3) return '#f59e0b'; // Orange - few packages
    return '#16a34a'; // Green - many packages
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Harita</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Harita yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{userLocation}</Text>
          <Text style={styles.headerSubtitle}>{selectedDistance} km çapında</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadRestaurants}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 36.8969,
          longitude: 30.7133,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        toolbarEnabled={false}
        onError={(e) => console.error('Map Error:', e)}
        onMapReady={() => console.log('✅ Map is ready')}
        loadingEnabled={true}
        loadingIndicatorColor="#16a34a"
        loadingBackgroundColor="#f8fafc"
      >
        {restaurants.map((restaurant) => {
          if (!restaurant.location?.coordinates) return null;
          
          const [longitude, latitude] = restaurant.location.coordinates;
          const packageCount = restaurant.packages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;
          
          return (
            <Marker
              key={restaurant._id || restaurant.id}
              coordinate={{
                latitude: latitude,
                longitude: longitude,
              }}
              title={restaurant.name}
              description={`${restaurant.category} • ${packageCount} paket`}
              pinColor={getMarkerColor(restaurant)}
              onPress={() => handleMarkerPress(restaurant)}
            />
          );
        })}
      </MapView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: '#16a34a',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  map: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
  },
});

export default MapScreen;