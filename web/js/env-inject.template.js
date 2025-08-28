/**
 * Environment Variables Injection Template for Netlify
 * This file is a template - placeholders will be replaced during build
 * NO ACTUAL API KEYS SHOULD BE IN THIS FILE
 */

// Inject Netlify environment variables into window object
(function() {
    'use strict';
    
    // Environment variables from Netlify
    // These placeholders will be replaced during Netlify build process
    window.GOOGLE_MAPS_API_KEY = '%%GOOGLE_MAPS_API_KEY%%';
    window.API_BASE_URL = '%%API_BASE_URL%%';
    window.ENVIRONMENT = '%%ENVIRONMENT%%';
    
    // Clean up placeholder values
    Object.keys(window).forEach(key => {
        if (typeof window[key] === 'string' && window[key].startsWith('%%') && window[key].endsWith('%%')) {
            window[key] = null;
        }
    });
    
    // Debug info - show on all environments for testing
    console.log('🌍 Environment variables loaded:', {
        hasGoogleMapsKey: !!window.GOOGLE_MAPS_API_KEY,
        keyPreview: window.GOOGLE_MAPS_API_KEY ? 
            `${window.GOOGLE_MAPS_API_KEY.substring(0, 8)}...${window.GOOGLE_MAPS_API_KEY.substring(window.GOOGLE_MAPS_API_KEY.length - 4)}` : 
            'Not found',
        environment: window.ENVIRONMENT || 'development',
        baseUrl: window.API_BASE_URL || 'local',
        buildTime: new Date().toISOString()
    });
})();