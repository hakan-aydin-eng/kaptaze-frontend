import 'dotenv/config';

export default {
  expo: {
    name: "KapTaze",
    slug: "kaptaze",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    plugins: [
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "deploymentTarget": "15.1"
          },
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "newArchEnabled": true
          }
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Bu uygulama yakınındaki restoranları göstermek için konum bilginizi kullanır."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#16a34a",
          "defaultChannel": "default"
        }
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/messaging"
    ],
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#16a34a"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.kaptaze.app",
      buildNumber: "12",
      jsEngine: "hermes",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Bu uygulama yakınındaki restoranları göstermek için konum bilginizi kullanır.",
        NSLocationAlwaysUsageDescription: "Bu uygulama yakınındaki restoranları göstermek için konum bilginizi kullanır.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Bu uygulama yakınındaki restoranları göstermek için konum bilginizi kullanır.",
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["location", "fetch"],
        LSApplicationQueriesSchemes: ["googlemaps", "comgooglemaps"],
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        },
        // CRITICAL: Google Maps API Key for iOS
        GMSApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY || "AIzaSyBGEzq8t3l5L1H4n5v8Y9yW1uF9O5dQ7X2"
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY || "AIzaSyBGEzq8t3l5L1H4n5v8Y9yW1uF9O5dQ7X2"
      },
      googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY || "AIzaSyBGEzq8t3l5L1H4n5v8Y9yW1uF9O5dQ7X2"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#16a34a"
      },
      package: "com.kaptaze.app",
      versionCode: 2,
      edgeToEdgeEnabled: true,
      jsEngine: "hermes",
      googleServicesFile: "./android/app/google-services.json",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      config: {
        googleMaps: {
          apiKey: "AIzaSyBGEzq8t3l5L1H4n5v8Y9yW1uF9O5dQ7X2"
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    cli: {
      appVersionSource: "local"
    },
    owner: "haknaydin",
    updates: {
      enabled: false
    },
    extra: {
      eas: {
        projectId: "20e11315-3be4-4335-af55-44487c0e423a"
      }
    }
  }
};