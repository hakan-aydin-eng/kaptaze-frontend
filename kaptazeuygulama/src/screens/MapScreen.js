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
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    </head>
    <body>
        <div id="map"></div>
        <div id="error-container" style="position: absolute; top: 10px; left: 10px; right: 10px; background: red; color: white; padding: 10px; border-radius: 8px; display: none; z-index: 1000;"></div>
        <script>
            let map;
            let markers = [];
            const restaurants = ${JSON.stringify(markersData)};
            
            function initMap() {
                console.log('initMap called with Leaflet');
                
                try {
                    // Initialize Leaflet map
                    map = L.map('map').setView([${mapCenter.lat}, ${mapCenter.lng}], 12);
                    
                    // Add OpenStreetMap tiles
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19
                    }).addTo(map);
                    
                    console.log('Leaflet map initialized successfully');
                
                restaurants.forEach(restaurant => {
                    if (restaurant.coordinates && restaurant.coordinates.length >= 2) {
                        const position = [
                            parseFloat(restaurant.coordinates[1]),
                            parseFloat(restaurant.coordinates[0])
                        ];
                        
                        // Create custom icon for restaurant markers
                        const restaurantIcon = L.divIcon({
                            className: 'restaurant-marker',
                            html: '<div style="background: #16a34a; border: 2px solid white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🍽️</div>',
                            iconSize: [40, 40],
                            iconAnchor: [20, 20],
                            popupAnchor: [0, -20]
                        });
                        
                        const marker = L.marker(position, { icon: restaurantIcon })
                            .addTo(map)
                            .bindPopup(createInfoWindowContent(restaurant))
                            .on('click', () => {
                                marker.openPopup();
                            });
                        
                        markers.push({ marker });
                    }
                });

                // Add user location marker
                const userIcon = L.divIcon({
                    className: 'user-marker',
                    html: '<div style="background: #3b82f6; border: 3px solid white; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><div style="background: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; opacity: 0.8;"><div style="background: #3b82f6; border-radius: 50%; width: 16px; height: 16px;"></div></div><div style="position: absolute; top: 8px; font-size: 12px;">📍</div></div>',
                    iconSize: [50, 50],
                    iconAnchor: [25, 25],
                    popupAnchor: [0, -25]
                });

                const userLocationMarker = L.marker([${mapCenter.lat}, ${mapCenter.lng}], { 
                    icon: userIcon,
                    zIndexOffset: 1000
                })
                .addTo(map)
                .bindPopup(\`
                    <div class="info-window">
                        <div class="restaurant-name">📍 Konumunuz</div>
                        <div class="restaurant-info">${userLocation || 'Mevcut Konum'}</div>
                        <div class="restaurant-info">Çevresindeki restoranları görüntülüyorsunuz</div>
                    </div>
                \`);
                
                } catch (error) {
                    console.error('Map initialization error:', error);
                    document.getElementById('error-container').style.display = 'block';
                    document.getElementById('error-container').innerHTML = 'Harita yüklenirken bir hata oluştu: ' + error.message;
                }
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
      
      // Handle console messages from WebView
      if (data.type === 'console.log') {
        console.log('📱 WebView Log:', ...data.data);
      } else if (data.type === 'console.error') {
        console.error('📱 WebView Error:', ...data.data);
      } else if (data.type === 'console.warn') {
        console.warn('📱 WebView Warning:', ...data.data);
      } else if (data.type === 'RESTAURANT_SELECTED') {
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
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        originWhitelist={['*']}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          Alert.alert('Harita Hatası', 'Harita yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent);
        }}
        onLoadEnd={() => {
          console.log('🗺️ Map loaded successfully');
        }}
        injectedJavaScript={`
          const meta = document.createElement('meta');
          meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
          meta.setAttribute('name', 'viewport');
          document.getElementsByTagName('head')[0].appendChild(meta);
          
          // Forward console messages to React Native
          const consoleLog = console.log;
          const consoleError = console.error;
          const consoleWarn = console.warn;
          
          console.log = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'console.log', data: Array.from(arguments)}));
            consoleLog.apply(console, arguments);
          };
          
          console.error = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'console.error', data: Array.from(arguments)}));
            consoleError.apply(console, arguments);
          };
          
          console.warn = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'console.warn', data: Array.from(arguments)}));
            consoleWarn.apply(console, arguments);
          };
          
          true;
        `}
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