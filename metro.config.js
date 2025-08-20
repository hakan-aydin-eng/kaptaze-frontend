const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Backend klasörünü tamamen exclude et
config.resolver.blockList = [
  /backend\/.*/,
  /kaptaze-backend\/.*/,
  /.*\/backend\/.*/,
  /.*\/kaptaze-backend\/.*/,
  new RegExp(path.resolve(__dirname, 'backend').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/.*'),
  new RegExp(path.resolve(__dirname, 'kaptaze-backend').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/.*'),
];

// Watch folders'dan backend'i çıkar
config.watchFolders = [];

module.exports = config;