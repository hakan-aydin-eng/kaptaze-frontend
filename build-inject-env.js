#!/usr/bin/env node

/**
 * Netlify Build Script - Environment Variables Injection
 * This script replaces placeholders in env-inject.js with actual environment variables
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Building environment variables injection...');

const envInjectPath = path.join(__dirname, 'web', 'js', 'env-inject.js');
let envContent = fs.readFileSync(envInjectPath, 'utf8');

// Environment variables to inject
const envVars = {
    'GOOGLE_MAPS_API_KEY': process.env.GOOGLE_MAPS_API_KEY || null,
    'API_BASE_URL': process.env.API_BASE_URL || 'https://kaptaze.netlify.app/.netlify/functions',
    'ENVIRONMENT': process.env.NODE_ENV || 'production'
};

console.log('📋 Environment variables:');
Object.entries(envVars).forEach(([key, value]) => {
    const placeholder = `%%${key}%%`;
    const safeValue = value ? `'${value}'` : 'null';
    
    envContent = envContent.replace(new RegExp(placeholder, 'g'), safeValue);
    
    // Log without exposing sensitive values
    if (key === 'GOOGLE_MAPS_API_KEY' && value) {
        console.log(`  ✅ ${key}: ${value.substring(0, 8)}...${value.substring(value.length - 4)}`);
    } else {
        console.log(`  ✅ ${key}: ${value || 'null'}`);
    }
});

// Write the updated file
fs.writeFileSync(envInjectPath, envContent);

console.log('✅ Environment variables injected successfully!');
console.log(`📄 Updated file: ${envInjectPath}`);

// Verify the injection worked
const updatedContent = fs.readFileSync(envInjectPath, 'utf8');
const hasPlaceholders = updatedContent.includes('%%');

if (hasPlaceholders) {
    console.warn('⚠️  Warning: Some placeholders may not have been replaced');
} else {
    console.log('🎯 All placeholders successfully replaced');
}