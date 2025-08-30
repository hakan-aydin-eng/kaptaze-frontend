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
      
      // Koordinatları olan restaurantları filtrele
      const restaurantsWithCoords = allRestaurants.filter(r => {
        if (r.location?.coordinates) return true;
        if (r.location?.lat && r.location?.lng) return true;
        return false;
      });
      
      // Ensure unique restaurants by ID
      const uniqueRestaurants = restaurantsWithCoords.reduce((acc, current) => {
        const exists = acc.find(item => item._id === current._id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      console.log(`📍 Found ${uniqueRestaurants.length} restaurants with coordinates`);
      setRestaurants(uniqueRestaurants);
      
      // Delay to ensure WebView is ready
      setTimeout(() => setLoading(false), 100);
      
    } catch (error) {
      console.error('❌ Error loading restaurants:', error);
      setLoading(false);
    }
  };

  const generateMapHTML = () => {
    const markersData = restaurants.map(restaurant => ({
      id: restaurant._id,
      name: restaurant.name,
      category: restaurant.category || 'Restaurant',
      description: restaurant.description || '',
      coordinates: restaurant.location?.coordinates || [restaurant.location?.lng, restaurant.location?.lat],
      address: restaurant.address?.street || restaurant.location?.address || '',
      rating: typeof restaurant.rating === 'object' ? restaurant.rating.average : restaurant.rating,
      price: restaurant.avgPrice || restaurant.price || '',
      distance: restaurant.distance || ''
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
            .restaurant-category {
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
                console.log('🗺️ Initializing Google Maps...');
                
                try {
                    // Initialize Google Maps
                    map = new google.maps.Map(document.getElementById('map'), {
                        center: { lat: ${mapCenter.lat}, lng: ${mapCenter.lng} },
                        zoom: 13,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                        styles: [
                            {
                                featureType: "poi.business",
                                stylers: [{ visibility: "off" }]
                            }
                        ]
                    });
                    
                    console.log('✅ Google Maps initialized successfully');
                    
                    // Add restaurant markers
                    restaurants.forEach(restaurant => {
                        if (restaurant.coordinates && restaurant.coordinates.length >= 2) {
                            const position = {
                                lat: parseFloat(restaurant.coordinates[1]),
                                lng: parseFloat(restaurant.coordinates[0])
                            };
                            
                            // Create custom marker
                            const marker = new google.maps.Marker({
                                position: position,
                                map: map,
                                title: restaurant.name,
                                icon: {
                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                                        '<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">' +
                                        '<circle cx="20" cy="20" r="18" fill="#16a34a" stroke="white" stroke-width="2"/>' +
                                        '<text x="20" y="25" text-anchor="middle" font-size="16">🍽️</text>' +
                                        '</svg>'
                                    ),
                                    scaledSize: new google.maps.Size(40, 40),
                                    anchor: new google.maps.Point(20, 20)
                                }
                            });
                            
                            // Create info window content
                            const contentString = createInfoWindowContent(restaurant);
                            const infoWindow = new google.maps.InfoWindow({
                                content: contentString
                            });
                            
                            marker.addListener('click', () => {
                                // Close all other info windows
                                markers.forEach(m => {
                                    if (m.infoWindow) {
                                        m.infoWindow.close();
                                    }
                                });
                                infoWindow.open(map, marker);
                            });
                            
                            marker.infoWindow = infoWindow;
                            markers.push(marker);
                        }
                    });
                    
                    // Add user location marker
                    const userMarker = new google.maps.Marker({
                        position: { lat: ${mapCenter.lat}, lng: ${mapCenter.lng} },
                        map: map,
                        title: 'Konumunuz',
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                                '<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">' +
                                '<circle cx="25" cy="25" r="22" fill="#3b82f6" stroke="white" stroke-width="3"/>' +
                                '<circle cx="25" cy="25" r="8" fill="white"/>' +
                                '<circle cx="25" cy="25" r="5" fill="#3b82f6"/>' +
                                '</svg>'
                            ),
                            scaledSize: new google.maps.Size(50, 50),
                            anchor: new google.maps.Point(25, 25)
                        },
                        zIndex: 999
                    });
                    
                    const userInfoWindow = new google.maps.InfoWindow({
                        content: '<div class="info-window"><p class="restaurant-name">📍 Konumunuz</p><p class="restaurant-category">${userLocation}</p></div>'
                    });
                    
                    userMarker.addListener('click', () => {
                        userInfoWindow.open(map, userMarker);
                    });
                    
                    console.log('✅ Added ' + markers.length + ' restaurant markers');
                    
                } catch (error) {
                    console.error('❌ Map initialization error:', error);
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            }
            
            function createInfoWindowContent(restaurant) {
                return \`
                    <div class="info-window">
                        <p class="restaurant-name">\${restaurant.name}</p>
                        <p class="restaurant-category">\${restaurant.category}</p>
                        \${restaurant.rating ? \`<p class="restaurant-category">⭐ \${restaurant.rating}</p>\` : ''}
                        \${restaurant.price ? \`<p class="restaurant-price">💰 \${restaurant.price}</p>\` : ''}
                        \${restaurant.distance ? \`<p class="restaurant-category">📍 \${restaurant.distance}km</p>\` : ''}
                        <button class="view-details-btn" onclick="viewDetails('\${restaurant.id}')">
                            Detayları Gör
                        </button>
                    </div>
                \`;
            }
            
            function viewDetails(restaurantId) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'navigate',
                    restaurantId: restaurantId
                }));
            }
            
            // Initialize map when page loads
            window.onload = function() {
                console.log('Window loaded, waiting for Google Maps...');
            };
        </script>
        <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&callback=initMap" async defer></script>
    </body>
    </html>
    `;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'navigate' && data.restaurantId) {
        const restaurant = restaurants.find(r => r._id === data.restaurantId);
        if (restaurant) {
          navigation.navigate('RestaurantDetail', { restaurant });
        }
      } else if (data.type === 'error') {
        console.error('WebView error:', data.message);
        Alert.alert('Hata', 'Harita yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.log('Message parse error:', error);
    }
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
        <Text style={styles.headerTitle}>Haritada Gör</Text>
        <Text style={styles.locationText}>{userLocation}</Text>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={styles.loadingText}>Harita yükleniyor...</Text>
          </View>
        ) : (
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
            }}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16a34a" />
              </View>
            )}
          />
        )}
      </View>
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
  locationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  mapContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});

export default MapScreen;