# SwapRunn App Store Submission Guide

## 📋 Pre-Submission Requirements

### 1. Apple Developer Account Setup

- [ ] Valid Apple Developer Program membership ($99/year)
- [ ] Development certificates installed
- [ ] App Store Connect access configured

### 2. App Information Required

- **App Name**: SwapRunn
- **Bundle ID**: Should match in `capacitor.config.ts` and iOS project
- **Category**: Business / Transportation
- **Content Rating**: 4+ (Business app)
- **Keywords**: dealership, vehicle, swap, driver, transportation, automotive

### 3. Required Assets

#### App Icons (Required Sizes):

- [ ] 1024x1024 (App Store)
- [ ] 180x180 (iPhone)
- [ ] 167x167 (iPad Pro)
- [ ] 152x152 (iPad)
- [ ] 120x120 (iPhone smaller)
- [ ] 76x76 (iPad)

#### Screenshots Required:

- [ ] **iPhone 6.7"** (iPhone 14 Pro Max): 1290 x 2796 px
- [ ] **iPhone 6.5"** (iPhone 11 Pro Max): 1242 x 2688 px
- [ ] **iPhone 5.5"** (iPhone 8 Plus): 1242 x 2208 px
- [ ] **iPad Pro 12.9"**: 2048 x 2732 px
- [ ] **iPad Pro 11"**: 1668 x 2388 px

### 4. Legal Requirements

- [ ] **Privacy Policy**: Already have in `src/pages/Privacy.tsx`
- [ ] **Terms of Service**: Already have in `src/pages/Terms.tsx`
- [ ] **Support URL**: Need to set up support page
- [ ] **Marketing URL**: Can use main app URL

### 5. App Description Template

```
SwapRunn - Professional Vehicle Delivery Service

Streamline your dealership's vehicle delivery operations with SwapRunn. Our platform connects dealerships with professional drivers for secure, tracked vehicle transportation.

KEY FEATURES:
• Instant driver requests with VIN scanning
• Real-time GPS tracking and updates
• Professional driver network
• Vehicle inspection photos
• Secure payment processing
• 24/7 customer support

PERFECT FOR:
• Car dealerships
• Auto auction houses
• Fleet managers
• Service centers

Download SwapRunn today and revolutionize your vehicle delivery process.
```

## 🔧 Technical Preparation

### 1. Build Configuration Check

```bash
# Verify production config
cat capacitor.config.ts
cat package.json | grep version

# Check iOS project settings
open ios/App/App.xcworkspace
```

### 2. Required iOS Settings

- [ ] **Deployment Target**: iOS 13.0+ minimum
- [ ] **Device Support**: iPhone and iPad
- [ ] **Orientation**: Portrait (primary)
- [ ] **Background Modes**: Location updates (if using GPS)
- [ ] **Permissions**: Camera, Location, Notifications

### 3. App Store Connect Setup Steps

#### Create App Listing:

1. Log into App Store Connect
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - Platform: iOS
   - Name: SwapRunn
   - Primary Language: English
   - Bundle ID: (from your iOS project)
   - SKU: swaprunn-ios-v1

#### App Information:

- **Subtitle**: Professional Vehicle Delivery
- **Promotional Text**: Connect dealerships with professional drivers
- **Description**: Use template above
- **Keywords**: dealership,vehicle,delivery,driver,automotive,transportation,swap,professional
- **Support URL**: https://swaprunn.com/support
- **Marketing URL**: https://swaprunn.com

#### Pricing and Availability:

- [ ] **Price**: Free (if no in-app purchases) or set pricing
- [ ] **Availability**: All countries or specific regions
- [ ] **Release**: Manual or automatic after approval

### 4. Final Build Steps

```bash
# 1. Create production build
npm run build

# 2. Sync with iOS
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# 4. In Xcode:
# - Select "Any iOS Device" as target
# - Product → Archive
# - Upload to App Store Connect
```

## 📱 Testing Checklist

### Critical User Flows:

- [ ] App launches successfully
- [ ] Home page loads and displays correctly
- [ ] Dealer login works
- [ ] Dealer can create new requests
- [ ] VIN scanner opens camera and functions
- [ ] Forms submit successfully
- [ ] Navigation works on all pages
- [ ] App doesn't crash on any screen

### Device Testing:

- [ ] iPhone (various sizes)
- [ ] iPad compatibility
- [ ] Different iOS versions (13.0+)
- [ ] Portrait and landscape orientations

## 🚨 Common Rejection Reasons to Avoid

### App Store Review Guidelines:

- [ ] **Privacy**: All camera/location permissions properly explained
- [ ] **Functionality**: App must be fully functional, no placeholder content
- [ ] **Metadata**: Screenshots must match actual app content
- [ ] **Business Model**: Clear value proposition for users
- [ ] **Content**: No inappropriate or misleading content

### Technical Issues:

- [ ] **Crashes**: App must not crash during review
- [ ] **Performance**: Reasonable load times and responsiveness
- [ ] **UI/UX**: Professional design, intuitive navigation
- [ ] **Integration**: All features work as described

## 📞 Support Preparation

### Set Up:

- [ ] Support email: support@swaprunn.com
- [ ] FAQ page with common questions
- [ ] Contact form on website
- [ ] Response time commitment (24-48 hours)

---

## ⏰ Timeline Estimate:

- **App Store Connect Setup**: 2-3 hours
- **Asset Creation**: 3-4 hours
- **Final Testing**: 2-3 hours
- **Submission**: 1 hour
- **Apple Review**: 1-7 days
- **Total**: ~3-4 days from start to approval

## 🎯 Success Metrics:

- Clean submission with no rejections
- Approval within 3 business days
- 4+ star rating from initial users
- Successful dealer onboarding flow
