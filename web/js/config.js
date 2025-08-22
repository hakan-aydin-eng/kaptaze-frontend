/**
 * KapTaze Configuration
 * Environment-based configuration for different deployment environments
 */

window.KapTazeConfig = {
    // Google Maps API Configuration
    maps: {
        // Production API key for KapTaze
        apiKey: 'AIzaSyBTPj8fON_ie4OjJUFi1FCDCRD6V6d4xWk',
        
        // Map configuration
        defaultCenter: { lat: 39.925533, lng: 32.866287 }, // Turkey center
        defaultZoom: 6,
        
        // Places API configuration
        autocompleteOptions: {
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: 'tr' },
            fields: ['place_id', 'geometry', 'name', 'formatted_address', 'types']
        },
        
        // Allowed domains for this API key (for reference)
        allowedDomains: [
            'kaptaze.netlify.app',
            'localhost',
            '127.0.0.1'
        ]
    },
    
    // API Endpoints
    api: {
        baseUrl: process?.env?.API_BASE_URL || 'https://kaptaze.netlify.app/.netlify/functions',
        endpoints: {
            submitRegistration: '/submit-registration',
            approveRegistration: '/approve-registration',
            sharedStorage: '/shared-storage'
        }
    },
    
    // Environment detection
    environment: window.location.hostname === 'localhost' ? 'development' : 'production',
    
    // Feature flags
    features: {
        mapsEnabled: true,
        placesAutocomplete: true,
        fallbackMaps: true,
        debugMode: window.location.hostname === 'localhost'
    },
    
    // Fallback locations for Turkish cities
    turkishCities: {
        'Antalya': { lat: 36.8969, lng: 30.7133 },
        'İstanbul': { lat: 41.0082, lng: 28.9784 },
        'Ankara': { lat: 39.9334, lng: 32.8597 },
        'İzmir': { lat: 38.4192, lng: 27.1287 },
        'Bursa': { lat: 40.1826, lng: 29.0665 },
        'Adana': { lat: 37.0000, lng: 35.3213 }
    }
};

// Debug info
if (window.KapTazeConfig.features.debugMode) {
    const config = { ...window.KapTazeConfig };
    // Mask API key for security (show only first/last 4 chars)
    if (config.maps?.apiKey) {
        const key = config.maps.apiKey;
        config.maps.apiKey = `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    }
    console.log('🔧 KapTaze Config loaded:', config);
    console.log('🗺️ Maps API: Ready to load');
}