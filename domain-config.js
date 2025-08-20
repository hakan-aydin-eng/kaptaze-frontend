// KapTaze Domain Configuration
// Kalıcı domain organizasyonu ve yönlendirme sistemi

const DOMAIN_CONFIG = {
    // Production domains (.com.tr)
    production: {
        main: 'https://kaptazeapp.com.tr',
        customer: 'https://app.kaptazeapp.com.tr',
        restaurant: 'https://restoran.kaptazeapp.com.tr', 
        admin: 'https://admin.kaptazeapp.com.tr',
        api: 'https://api.kaptazeapp.com.tr',
        cdn: 'https://cdn.kaptazeapp.com.tr',
        monitor: 'https://monitor.kaptazeapp.com.tr'
    },
    
    // Staging domains
    staging: {
        main: 'https://staging.kaptazeapp.com.tr',
        customer: 'https://app-staging.kaptazeapp.com.tr',
        restaurant: 'https://restoran-staging.kaptazeapp.com.tr',
        admin: 'https://admin-staging.kaptazeapp.com.tr',
        api: 'https://api-staging.kaptazeapp.com.tr',
        cdn: 'https://cdn-staging.kaptazeapp.com.tr',
        monitor: 'https://monitor-staging.kaptazeapp.com.tr'
    },
    
    // Development domains (localhost)
    development: {
        main: 'http://localhost:8080',
        customer: 'http://localhost:3000',
        restaurant: 'http://localhost:3002',
        admin: 'http://localhost:3001',
        api: 'http://localhost:5000',
        cdn: 'http://localhost:9000',
        monitor: 'http://localhost:3003'
    }
};

// Port configuration for development
const DEV_PORTS = {
    main: 8080,           // Ana portal
    customer: 3000,       // Müşteri web arayüzü
    admin: 3001,          // Admin paneli
    restaurant: 3002,     // Restoran paneli
    monitor: 3003,        // Monitoring (Grafana)
    api: 5000,            // Backend API
    mongodb: 27017,       // MongoDB
    redis: 6379,          // Redis
    nginx: 80,            // Nginx (production)
    ssl: 443,             // SSL (production)
    cdn: 9000,            // MinIO/CDN
    elasticsearch: 9200,  // Elasticsearch
    prometheus: 9090      // Prometheus
};

// SSL Certificate configuration
const SSL_CONFIG = {
    domains: [
        'kaptazeapp.com.tr',
        'www.kaptazeapp.com.tr',
        'app.kaptazeapp.com.tr',
        'api.kaptazeapp.com.tr',
        'admin.kaptazeapp.com.tr',
        'restoran.kaptazeapp.com.tr',
        'cdn.kaptazeapp.com.tr',
        'monitor.kaptazeapp.com.tr'
    ],
    email: 'info@kaptazeapp.com.tr',
    provider: 'letsencrypt'
};

// Database connection strings
const DATABASE_CONFIG = {
    production: {
        mongodb: 'mongodb://admin:${MONGO_ROOT_PASSWORD}@mongodb:27017/kaptazeappv5?authSource=admin',
        redis: 'redis://:${REDIS_PASSWORD}@redis:6379/0'
    },
    
    development: {
        mongodb: 'mongodb://localhost:27017/kaptaze_dev',
        redis: 'redis://localhost:6379/0'
    },
    
    test: {
        mongodb: 'mongodb://localhost:27017/kaptaze_test',
        redis: 'redis://localhost:6379/1'
    }
};

// Service integration configuration
const SERVICE_INTEGRATION = {
    // API Base URLs for each environment
    api: {
        production: 'https://api.kaptazeapp.com.tr',
        staging: 'https://api-staging.kaptazeapp.com.tr',
        development: 'http://localhost:5000'
    },
    
    // WebSocket connections
    websocket: {
        production: 'wss://api.kaptazeapp.com.tr/ws',
        staging: 'wss://api-staging.kaptazeapp.com.tr/ws',
        development: 'ws://localhost:5000/ws'
    },
    
    // CDN/File storage
    storage: {
        production: 'https://cdn.kaptazeapp.com.tr',
        staging: 'https://cdn-staging.kaptazeapp.com.tr',
        development: 'http://localhost:9000'
    }
};

// Cross-platform authentication tokens
const AUTH_CONFIG = {
    jwt: {
        secret: '${JWT_SECRET}',
        refreshSecret: '${JWT_REFRESH_SECRET}',
        expiresIn: '24h',
        refreshExpiresIn: '7d'
    },
    
    cookies: {
        domain: '.kaptazeapp.com.tr', // Ana domain için cookie sharing
        secure: true, // HTTPS only in production
        sameSite: 'Lax',
        httpOnly: true
    },
    
    sessions: {
        name: 'kaptaze_session',
        secret: '${SESSION_SECRET}',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true,
            domain: '.kaptazeapp.com.tr',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }
};

// CORS configuration for cross-domain communication
const CORS_CONFIG = {
    production: {
        origin: [
            'https://kaptazeapp.com.tr',
            'https://www.kaptazeapp.com.tr',
            'https://app.kaptazeapp.com.tr',
            'https://admin.kaptazeapp.com.tr',
            'https://restoran.kaptazeapp.com.tr'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    
    development: {
        origin: [
            'http://localhost:8080',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }
};

// Monitoring and health check endpoints
const HEALTH_ENDPOINTS = {
    api: '/health',
    database: '/health/db',
    cache: '/health/redis',
    storage: '/health/storage',
    detailed: '/health/detailed'
};

// Environment detection utility
function detectEnvironment() {
    if (typeof window !== 'undefined') {
        // Browser environment
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('staging')) {
            return 'staging';
        } else {
            return 'production';
        }
    } else {
        // Node.js environment
        return process.env.NODE_ENV || 'development';
    }
}

// Get domain configuration for current environment
function getDomains(env = null) {
    const environment = env || detectEnvironment();
    return DOMAIN_CONFIG[environment] || DOMAIN_CONFIG.development;
}

// Get database configuration for current environment
function getDatabaseConfig(env = null) {
    const environment = env || detectEnvironment();
    return DATABASE_CONFIG[environment] || DATABASE_CONFIG.development;
}

// URL builder utility
function buildUrl(service, path = '', env = null) {
    const domains = getDomains(env);
    const baseUrl = domains[service];
    
    if (!baseUrl) {
        throw new Error(`Service '${service}' not found in domain configuration`);
    }
    
    return path ? `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}` : baseUrl;
}

// Health check utility
async function checkServiceHealth(service, env = null) {
    try {
        const url = buildUrl(service, HEALTH_ENDPOINTS.api, env);
        
        if (typeof fetch !== 'undefined') {
            // Browser environment
            const response = await fetch(url);
            return response.ok;
        } else {
            // Node.js environment
            const https = require('https');
            const http = require('http');
            const urlModule = require('url');
            
            return new Promise((resolve) => {
                const parsedUrl = urlModule.parse(url);
                const client = parsedUrl.protocol === 'https:' ? https : http;
                
                const req = client.get(url, (res) => {
                    resolve(res.statusCode === 200);
                });
                
                req.on('error', () => resolve(false));
                req.setTimeout(5000, () => {
                    req.abort();
                    resolve(false);
                });
            });
        }
    } catch (error) {
        return false;
    }
}

// Export configuration
module.exports = {
    DOMAIN_CONFIG,
    DEV_PORTS,
    SSL_CONFIG,
    DATABASE_CONFIG,
    SERVICE_INTEGRATION,
    AUTH_CONFIG,
    CORS_CONFIG,
    HEALTH_ENDPOINTS,
    
    // Utilities
    detectEnvironment,
    getDomains,
    getDatabaseConfig,
    buildUrl,
    checkServiceHealth
};

// Browser global (if in browser environment)
if (typeof window !== 'undefined') {
    window.KapTazeConfig = {
        domains: getDomains(),
        environment: detectEnvironment(),
        buildUrl,
        checkServiceHealth
    };
}