# SwapRunn Mobile App

Your SwapRunn web application has been successfully converted into a native mobile app using Capacitor!

## 🚀 What's New

### Native Mobile Features Added:

- **Push Notifications**: Real-time job alerts directly to your phone
- **Enhanced GPS**: Background location tracking for active deliveries
- **Native Camera**: Take proof-of-delivery photos with device camera
- **Haptic Feedback**: Tactile feedback for important actions
- **Offline Support**: Basic functionality works without internet
- **Native Performance**: Faster loading and smoother animations

### Mobile Services:

- `mobileNotificationService`: Handles push notifications and local notifications
- `mobileGeolocationService`: Enhanced location tracking with native GPS
- `mobileCameraService`: Native camera integration for photos
- `useMobileCapacitor`: React hook for mobile platform detection and haptics

## 📱 Development Setup

### Testing in Browser

Your app works exactly the same in the browser - all mobile features gracefully fall back to web alternatives.

### Testing on Device

1. **Export to GitHub**
   - Click "Export to GitHub" button in Lovable
   - Clone your repository locally

2. **Install Dependencies**

   ```bash
   git clone [your-repo-url]
   cd [your-repo-name]
   npm install
   ```

3. **Add Mobile Platforms**

   ```bash
   # For iOS (requires Mac + Xcode)
   npx cap add ios

   # For Android (requires Android Studio)
   npx cap add android
   ```

4. **Build and Sync**

   ```bash
   npm run build
   npx cap sync
   ```

5. **Run on Device**

   ```bash
   # For iOS
   npx cap run ios

   # For Android
   npx cap run android
   ```

## 🔧 Configuration

### App Configuration

- **App ID**: `app.lovable.8d6c882b4c9b4fefb7b8ef9a044dc4f6`
- **App Name**: SwapRunn
- **Hot Reload**: Enabled for development

### Mobile Permissions

The app requests these permissions:

- **Location**: For GPS tracking and delivery navigation
- **Camera**: For taking proof-of-delivery photos
- **Notifications**: For real-time job alerts
- **Network**: For API communication

## 📋 Features for Each User Type

### 🚛 Drivers

- Native push notifications for new jobs
- Background GPS tracking during deliveries
- Camera integration for proof photos
- Haptic feedback for job acceptance
- Offline job details access

### 🏢 Dealers

- Real-time job status notifications
- Professional mobile app presence
- Enhanced dashboard performance
- Native mobile navigation

### 📦 End Users (Tracking)

- Native tracking experience
- Better mobile performance
- Smoother map interactions

## 🔄 Hot Reload Development

During development, the mobile app connects to your Lovable preview URL for instant updates. Changes you make in Lovable will immediately appear on your mobile device!

## 🏪 App Store Deployment

To publish to app stores, you'll need:

### iOS App Store

- Apple Developer Account ($99/year)
- App Store Connect setup
- Xcode for final build and upload

### Google Play Store

- Google Play Developer Account ($25 one-time)
- Android Studio for final build
- Play Console setup

## ⚡ Performance Tips

- Mobile app uses native rendering for better performance
- Automatic image optimization for mobile screens
- Efficient battery usage with background task management
- Optimized network requests for mobile data

## 🆘 Troubleshooting

If you encounter issues:

1. **Build Errors**: Run `npx cap sync` after pulling updates
2. **Permission Issues**: Check mobile device settings
3. **Hot Reload Not Working**: Verify network connection
4. **Push Notifications**: Ensure proper certificates are configured

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development Setup](https://capacitorjs.com/docs/ios)
- [Android Development Setup](https://capacitorjs.com/docs/android)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://developer.android.com/distribute/google-play/policies)

---

Your SwapRunn app is now ready for mobile! The web version continues to work perfectly, and you now have a professional native mobile app to complement it. 🎉
