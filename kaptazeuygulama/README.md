# KapTaze Mobile App

React Native/Expo mobile application for KapTaze restaurant delivery platform.

## 🎯 Features

- **Restaurant Listing**: Browse approved restaurants from admin panel
- **Package Display**: View packages added by restaurant owners
- **Order System**: Place orders and track status
- **Real-time Updates**: Connected to KapTaze backend API
- **Cross-platform**: iOS and Android support via Expo

## 🏗️ Architecture

- **Frontend**: React Native + Expo
- **Backend**: KapTaze Backend API (`https://kaptaze-backend-api.onrender.com`)
- **Database**: MongoDB Atlas
- **Authentication**: JWT tokens
- **Navigation**: React Navigation v7

## 📱 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Or with tunnel (for better connectivity)
npx expo start --tunnel
```

## 🔗 API Integration

The app connects to KapTaze backend API endpoints:

- `GET /public/restaurants` - List approved restaurants
- `GET /public/packages` - Get restaurant packages  
- `POST /orders` - Create new orders
- `GET /orders/customer/:id` - Order history
- `PATCH /orders/:id/status` - Update order status

## 📊 Data Flow

```
Web Admin Panel → Restaurant Approval → Mobile App Restaurant List
Restaurant Panel → Add Packages → Mobile App Package Display
Mobile App → Create Order → Backend API → Restaurant Notification
```

## 🚀 Development

- **Entry Point**: `index.js`
- **Main App**: `App.js`  
- **API Service**: `src/services/apiService.js`
- **Screens**: `src/screens/`
- **Context**: `src/context/`

## 🔧 Environment

- Node.js 18+
- Expo CLI
- Expo Go app (for testing)

## 📱 Testing

1. Run `npm start`
2. Scan QR code with Expo Go
3. Test real restaurant data from web admin panel

---

*Generated with Claude Code - Professional mobile-web integration*