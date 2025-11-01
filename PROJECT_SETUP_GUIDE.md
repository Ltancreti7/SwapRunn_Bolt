# 🚀 SwapRunn Mobile App - Complete Setup Guide

## 📱 Project Information

- **App Name:** SwapRunn
- **Bundle ID:** com.swaprunn.app
- **Platform:** iOS (with Capacitor)
- **Tech Stack:** React + TypeScript + Vite + Capacitor
- **Location:** `/Users/ltancreti7/Desktop/swaprunn-live-deploy-main/`

## 🎯 Current Status: ✅ LIVE & READY FOR DEPLOYMENT

### 📂 Key Files & Directories

```
swaprunn-live-deploy-main/
├── 📱 ios/App/App.xcworkspace     ← OPEN THIS IN XCODE
├── 📦 dist/                       ← Built web assets
├── 🔨 src/                        ← React source code
├── 📄 capacitor.config.ts         ← Mobile app configuration
├── 📄 package.json                ← Dependencies & scripts
└── 📄 PROJECT_SETUP_GUIDE.md      ← This guide
```

## 🚀 How to Launch Your App

### Option 1: iOS Simulator (Instant)

1. Open Xcode: `open ios/App/App.xcworkspace`
2. Select iOS Simulator (iPhone 15 Pro recommended)
3. Click ▶️ Run button
4. App launches in simulator

### Option 2: Physical iPhone

1. Connect iPhone via USB
2. Open Xcode: `open ios/App/App.xcworkspace`
3. Select your iPhone from device list
4. Click ▶️ Run button
5. Trust developer certificate on iPhone if prompted

### Option 3: Web Development

```bash
npm run dev
# Opens at: http://localhost:8080
```

## 🛠 Development Commands

### Build & Deploy

```bash
# Build web app
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
open ios/App/App.xcworkspace
```

### Development

```bash
# Start dev server
npm run dev

# Install dependencies
npm install

# Lint code
npm run lint
```

## 📱 Features Enabled

- ✅ Camera & Photo Capture
- ✅ QR/Barcode Scanning
- ✅ GPS/Location Services
- ✅ Push Notifications
- ✅ Face ID/Touch ID
- ✅ Native iOS Components
- ✅ Splash Screen
- ✅ Status Bar Styling

## 🔧 Configuration Files

- `capacitor.config.ts` - Mobile app settings
- `capacitor.config.prod.ts` - Production config (no dev server)
- `capacitor.config.local.ts` - Local development config
- `ios/App/Podfile` - iOS dependencies (iOS 16.0+)

## 📋 Dependencies Status

- ✅ Node modules installed
- ✅ CocoaPods installed
- ✅ iOS project configured
- ✅ Development server ready

## 🚨 Important Notes

- **iOS Deployment Target:** 16.0+
- **Development Team:** Set in Xcode for device deployment
- **Bundle ID:** com.swaprunn.app
- **App Store:** Ready for submission after code signing

## 💾 Backup & Version Control

This setup is saved at:
`/Users/ltancreti7/Desktop/swaprunn-live-deploy-main/`

Created: October 12, 2025
Status: Production Ready ✅
