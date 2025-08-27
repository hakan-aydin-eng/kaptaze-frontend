const fs = require('fs');
const path = require('path');

// Build script for KapTaze Frontend
console.log('🚀 Building KapTaze Frontend...');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy all HTML files
const htmlFiles = [
    'index.html',
    'admin-dashboard-professional.html',
    'admin-login-v2.html',
    'customer-registration-v2.html',
    'restaurant-login-v2.html',
    'restaurant-login.html',
    'restaurant-panel.html'
];

htmlFiles.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(distDir, file));
        console.log(`✅ Copied ${file}`);
    }
});

// Copy assets, css, js directories
const directories = ['assets', 'css', 'js'];
directories.forEach(dir => {
    if (fs.existsSync(dir)) {
        copyDirectory(dir, path.join(distDir, dir));
        console.log(`✅ Copied ${dir} directory`);
    }
});

// Copy additional files
const additionalFiles = [
    'netlify.toml',
    'mongodb.js',
    '_redirects'
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

console.log('✨ Build completed successfully!');
console.log(`📁 Output directory: ${distDir}`);
