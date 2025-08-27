import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import apiService from '../services/apiService';
import { antalyaRestaurants } from '../data/antalyaRestaurants';

const MapScreen = ({ navigation, route }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get user location from route params or use Antalya as fallback
  const { userLocation = 'Antalya', userCoordinates, selectedDistance = 10 } = route.params || {};
  const [mapCenter] = useState({
    lat: userCoordinates?.latitude || 36.8969, 
    lng: userCoordinates?.longitude || 30.7133
  });

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      console.log('🗺️ Loading restaurants for map...');
      
      // API'den gerçek restaurant verilerini çek
      let apiRestaurants = [];
      try {
        const apiResponse = await apiService.getRestaurants();
        if (apiResponse.success && apiResponse.data.restaurants) {
          apiRestaurants = apiResponse.data.restaurants;
        }
      } catch (error) {
        console.log('❌ API request failed:', error);
      }
      
      // Tüm veri kaynaklarını birleştir
      const allRestaurants = [
        ...apiRestaurants,
        ...antalyaRestaurants
      ];
      
      // Format restaurants with coordinates
      const formattedRestaurants = allRestaurants.map(restaurant => ({
        ...restaurant,
        name: restaurant.name || restaurant.ad,
        rating: typeof restaurant.rating === 'object' ? restaurant.rating.average || 0 : restaurant.rating || 0,
        coordinates: restaurant.location?.coordinates || [30.7133 + (Math.random() - 0.5) * 0.1, 36.8969 + (Math.random() - 0.5) * 0.1],
        packages: restaurant.packages || [{ originalPrice: 50, salePrice: 25, discount: 50, quantity: 3 }]
      }));

      // Remove duplicates
      const uniqueRestaurants = formattedRestaurants.filter((restaurant, index, self) => 
        index === self.findIndex(r => r._id === restaurant._id || r.name === restaurant.name)
      );
      
      setRestaurants(uniqueRestaurants);
      console.log(`🗺️ Map loaded with ${uniqueRestaurants.length} restaurants`);
      
    } catch (error) {
      console.error('Map restaurants loading error:', error);
      setRestaurants(antalyaRestaurants);
    } finally {
      setLoading(false);
    }
  };

  const generateMapHTML = () => {
    const markersData = restaurants.map(restaurant => ({
      id: restaurant._id,
      name: restaurant.name,
      category: restaurant.category,
      rating: restaurant.rating,
      coordinates: restaurant.coordinates,
      packages: restaurant.packages?.length || 0,
      price: restaurant.packages?.[0]?.salePrice || restaurant.packages?.[0]?.discountedPrice || restaurant.packages?.[0]?.price || 0
    }));

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDvDmS8ZuRvrG4gKVII4wz65Krdidfl-tg&libraries=places"></script>
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100%; }
            .info-window {
                padding: 10px;
                max-width: 200px;
            }
            .restaurant-name {
                font-weight: bold;
                font-size: 14px;
                color: #111827;
                margin-bottom: 4px;
            }
            .restaurant-info {
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 2px;
            }
            .restaurant-price {
                font-weight: bold;
                color: #16a34a;
                font-size: 13px;
            }
            .view-details-btn {
                background: #16a34a;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 8px;
                width: 100%;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            let map;
            let markers = [];
            const restaurants = ${JSON.stringify(markersData)};
            
            function initMap() {
                map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: ${mapCenter.lat}, lng: ${mapCenter.lng} },
                    zoom: 12,
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        }
                    ]
                });
                
                restaurants.forEach(restaurant => {
                    if (restaurant.coordinates && restaurant.coordinates.length >= 2) {
                        const position = {
                            lat: parseFloat(restaurant.coordinates[1]),
                            lng: parseFloat(restaurant.coordinates[0])
                        };
                        
                        const marker = new google.maps.Marker({
                            position: position,
                            map: map,
                            title: restaurant.name,
                            icon: {
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                                    '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
                                    '<circle cx="20" cy="20" r="18" fill="#16a34a" stroke="#ffffff" stroke-width="2"/>' +
                                    '<text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">🍽️</text>' +
                                    '</svg>'
                                ),
                                scaledSize: new google.maps.Size(40, 40),
                                anchor: new google.maps.Point(20, 20)
                            }
                        });
                        
                        const infoWindow = new google.maps.InfoWindow({
                            content: createInfoWindowContent(restaurant)
                        });
                        
                        marker.addListener('click', () => {
                            markers.forEach(m => m.infoWindow.close());
                            infoWindow.open(map, marker);
                        });
                        
                        markers.push({ marker, infoWindow });
                    }
                });
            }
            
            function createInfoWindowContent(restaurant) {
                return \`
                    <div class="info-window">
                        <div class="restaurant-name">\${restaurant.name}</div>
                        <div class="restaurant-info">📍 \${restaurant.category}</div>
                        <div class="restaurant-info">⭐ \${restaurant.rating}/5</div>
                        <div class="restaurant-info">📦 \${restaurant.packages} paket mevcut</div>
                        \${restaurant.price > 0 ? \`<div class="restaurant-price">₺\${restaurant.price}</div>\` : ''}
                        <button class="view-details-btn" onclick="viewRestaurantDetails('\${restaurant.id}')">
                            Detayları Görüntüle
                        </button>
                    </div>
                \`;
            }
            
            function viewRestaurantDetails(restaurantId) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'RESTAURANT_SELECTED',
                    restaurantId: restaurantId
                }));
            }
            
            // Initialize map when page loads
            window.onload = initMap;
        </script>
    </body>
    </html>
    `;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'RESTAURANT_SELECTED') {
        const selectedRestaurant = restaurants.find(r => r._id === data.restaurantId);
        if (selectedRestaurant) {
          navigation.navigate('RestaurantDetail', { restaurant: selectedRestaurant });
        }
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

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
          <Text style={styles.headerTitle}>Harita</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Harita yükleniyor...</Text>
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
        <Text style={styles.headerTitle}>{userLocation} Haritası</Text>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => Alert.alert(
            'Harita Kullanımı',
            'Haritadaki yeşil işaretlere tıklayarak restoran detaylarını görüntüleyebilirsiniz.',
            [{ text: 'Tamam' }]
          )}
        >
          <Text style={styles.infoIcon}>ℹ️</Text>
        </TouchableOpacity>
      </View>
      
      <WebView
        source={{ html: generateMapHTML() }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        onError={(error) => console.error('WebView error:', error)}
        onHttpError={(error) => console.error('WebView HTTP error:', error)}
      />
    </SafeAreaView>
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
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 16,
  },
  placeholder: {
    width: 40,
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
  webView: {
    flex: 1,
  },
});

export default MapScreen;