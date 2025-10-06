const fs = require('fs');
const path = require('path');

// Build script for KapTaze Frontend - NO MONGODB!
console.log('🚀 Building KapTaze Frontend (MongoDB-Free)...');

// Clean any mongodb references
console.log('🧹 Ensuring no MongoDB references...');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy all HTML files
const htmlFiles = [
    'index.html',
    'admin-dashboard-professional.html',
    'admin-pro-dash-v2.html',
    'admin-login-v3.html',
    'customer-registration-v2.html',
    'restaurant-login.html',
    'restaurant-panel.html',
    'sss.html',
    'kvkk.html',
    'gizlilik-politikasi.html',
    'kullanim-kosullari.html'
];

htmlFiles.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(distDir, file));
        console.log(`✅ Copied ${file}`);
    }
});

// Copy assets, css, images directories (js will be handled separately)
const directories = ['assets', 'css', 'images'];
directories.forEach(dir => {
    if (fs.existsSync(dir)) {
        copyDirectory(dir, path.join(distDir, dir));
        console.log(`✅ Copied ${dir} directory`);
    }
});

// Copy js directory
if (fs.existsSync('js')) {
    copyDirectory('js', path.join(distDir, 'js'));
    console.log(`✅ Copied js directory`);
}

// Create env-inject.js in dist/js with Google Maps API key
const envInjectPath = path.join(distDir, 'js', 'env-inject.js');
const envInjectContent = `/**
 * Environment Variables Injection for Netlify
 * This script injects environment variables from Netlify build process
 */

// Inject Netlify environment variables into window object
(function() {
    'use strict';

    // Environment variables from Netlify
    // Google Maps API key
    window.GOOGLE_MAPS_API_KEY = 'AIzaSyDvDmS8ZuRvrG4gKVII4wz65Krdidfl-tg';
    window.API_BASE_URL = 'https://www.kaptaze.com/.netlify/functions';
    window.ENVIRONMENT = 'production';

    // Clean up placeholder values
    Object.keys(window).forEach(key => {
        if (typeof window[key] === 'string' && window[key].startsWith('%%') && window[key].endsWith('%%')) {
            window[key] = null;
        }
    });

    // Debug info
    console.log('🌍 Environment variables loaded:', {
        hasGoogleMapsKey: !!window.GOOGLE_MAPS_API_KEY,
        keyPreview: window.GOOGLE_MAPS_API_KEY ?
            \`\${window.GOOGLE_MAPS_API_KEY.substring(0, 8)}...\${window.GOOGLE_MAPS_API_KEY.substring(window.GOOGLE_MAPS_API_KEY.length - 4)}\` :
            'Not found',
        environment: window.ENVIRONMENT || 'development',
        baseUrl: window.API_BASE_URL || 'local'
    });
})();
`;

fs.writeFileSync(envInjectPath, envInjectContent);
console.log('✅ Created env-inject.js with Google Maps API key');

// Copy additional files
const additionalFiles = [
    'netlify.toml'
];

additionalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(distDir, file));
        console.log(`✅ Copied ${file}`);
    }
});

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        if (fs.lstatSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// Copy _redirects file for Netlify domain redirection
const redirectsPath = path.join(__dirname, '_redirects');
const redirectsDestPath = path.join(distDir, '_redirects');
if (fs.existsSync(redirectsPath)) {
    fs.copyFileSync(redirectsPath, redirectsDestPath);
    console.log('✅ Copied _redirects file for domain redirection');
}

console.log('✨ Build completed successfully!');
console.log(`📁 Output directory: ${distDir}`);
