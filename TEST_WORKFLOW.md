# SwapRunn Test Workflow

## Overview
This guide provides a comprehensive testing workflow for the SwapRunn application. The app is currently running in **mock mode** with local data, making it perfect for testing all features without external dependencies.

## App URL
🚀 **Development Server**: http://localhost:8082

## Test Environment Setup
- ✅ Mock data enabled (`USE_MOCK_DATA = true`)
- ✅ Local auth enabled (`USE_LOCAL_DB = true`) 
- ✅ Three user types available: `dealer`, `driver`, `swap_coordinator`
- ✅ Pre-populated sample data for testing

## 1. Authentication Flow Testing

### Test User Registration
1. **Navigate to**: http://localhost:8082
2. **Test Dealer Registration**:
   - Go to dealership registration page
   - Fill out complete form with test data:
     - Dealership Name: "Test Motors"
     - Email: "dealer@test.com"
     - Password: "password123"
     - Complete address and contact info
   - Submit registration
   - ✅ **Expected**: User created and redirected to dealer dashboard

3. **Test Driver Registration**:
   - Navigate to driver auth page
   - Register with:
     - Email: "driver@test.com"
     - Password: "password123"
     - User type: "driver"
   - ✅ **Expected**: Driver profile created

4. **Test Login Flow**:
   - Sign out and sign back in with created credentials
   - ✅ **Expected**: Successful login with profile loading

## 2. Dealer Workflow Testing

### Access Dealer Dashboard
- **URL**: http://localhost:8082/dealer/dashboard
- **Login as**: dealer@test.com / password123

### Test Job Creation
1. **Navigate to**: Create Job page
2. **Create Delivery Job**:
   - Customer Name: "John Doe"
   - Phone: "(555) 123-4567"
   - Pickup: "123 Main St, Springfield"
   - Delivery: "456 Oak Ave, Springfield"
   - Job Type: "Delivery"
   - Notes: "Ring doorbell twice"
3. **Submit and verify**:
   - ✅ Job appears in active jobs list
   - ✅ Tracking token generated
   - ✅ Job status is "Posted"

### Test Job Management
1. **View Active Jobs**: Check jobs list displays correctly
2. **Job Details**: Click into job details view
3. **Job Tracking**: Test tracking token lookup
4. **Job History**: View completed jobs

## 3. Driver Workflow Testing

### Access Driver Dashboard
- **URL**: http://localhost:8082/driver/dashboard
- **Login as**: driver@test.com / password123

### Test Driver Features
1. **Profile View**: 
   - ✅ Driver info displays correctly
   - ✅ Vehicle information shown
   - ✅ Documents status visible

2. **Available Jobs**:
   - ✅ Posted jobs appear in available list
   - ✅ Job details accessible
   - ✅ Accept job functionality

3. **Job Acceptance Flow**:
   - Accept a posted job
   - ✅ **Expected**: Job moves to "Accepted" status
   - ✅ **Expected**: Appears in driver's active jobs

4. **Time Tracking**:
   - Clock in to accepted job
   - ✅ **Expected**: Status changes to "In Progress"
   - Clock out when complete
   - ✅ **Expected**: Job marked as "Completed"

5. **Earnings & Timecard**:
   - ✅ View today/week/month earnings
   - ✅ Check timecard hours
   - ✅ Review job history

## 4. Real-time Features Testing

### Test Live Updates
1. **Open two browser windows**:
   - Window 1: Dealer dashboard
   - Window 2: Driver dashboard
2. **Create job in dealer window**:
   - ✅ **Expected**: Job appears in driver's available jobs (may need refresh)
3. **Accept job in driver window**:
   - ✅ **Expected**: Job status updates in dealer dashboard
4. **Clock in/out workflow**:
   - ✅ **Expected**: Status changes reflect across dashboards

## 5. Mobile Responsiveness Testing

### Test Mobile Layout
1. **Open dev tools** (F12)
2. **Toggle device toolbar** (mobile view)
3. **Test responsive components**:
   - ✅ Navigation adapts to mobile
   - ✅ Forms are touch-friendly
   - ✅ Cards and lists stack properly
   - ✅ Headers collapse appropriately

## 6. Navigation & Routing Testing

### Test Protected Routes
1. **Without login**: Try accessing protected pages
   - ✅ **Expected**: Redirected to login/setup
2. **With wrong role**: Dealer trying to access driver pages
   - ✅ **Expected**: Appropriate access control

### Test Core Navigation
- ✅ Home page loads
- ✅ Auth pages work
- ✅ Dashboard routing works
- ✅ Settings pages accessible
- ✅ Back navigation functions

## 7. Form Validation Testing

### Test Input Validation
1. **Registration forms**: Try invalid emails, weak passwords
2. **Job creation**: Test required field validation
3. **Address inputs**: Test address autocomplete (if configured)
4. **Phone numbers**: Test phone format validation

## 8. Error Handling Testing

### Test Error Scenarios
1. **Network simulation**: Throttle network in dev tools
2. **Invalid data**: Submit malformed requests
3. **Session expiry**: Clear localStorage and test auth recovery
4. **Missing data**: Test empty states

## 9. Data Persistence Testing

### Test Local Storage
1. **Create data**: Jobs, profiles, etc.
2. **Refresh browser**: Verify data persists
3. **Clear storage**: Test app recovery from empty state
4. **Mock data reset**: Verify sample data loads

## 10. Performance Testing

### Test Loading States
1. **Network throttling**: Test on slow connections
2. **Loading indicators**: Verify spinners/skeletons show
3. **Large data sets**: Create multiple jobs and test performance
4. **Memory usage**: Monitor browser memory with dev tools

## Quick Test Commands

```bash
# Start fresh testing session
npm run dev

# Reset mock data (if needed)
# Clear browser localStorage at http://localhost:8082

# Test specific features
# Check browser console for detailed logs
# Look for "🔧 Local mode:" messages confirming mock operations
```

## Common Test Scenarios

### Scenario 1: Complete Job Lifecycle
1. Dealer creates delivery job
2. Driver views available jobs
3. Driver accepts job
4. Driver clocks in
5. Driver completes delivery
6. Driver clocks out
7. Both parties see completed status

### Scenario 2: Multi-Driver Environment
1. Create multiple driver accounts
2. Create multiple jobs
3. Test job distribution
4. Test driver availability status

### Scenario 3: Mobile Driver Experience
1. Switch to mobile view
2. Test driver accepting jobs on mobile
3. Test clock in/out on mobile
4. Test navigation and usability

## Debug Tips

### Check Console Logs
- Look for authentication flow logs
- Monitor Supabase client operations
- Watch for error messages

### Verify Mock Data
- Check `src/store/mockStore.ts` for sample data
- Verify `USE_MOCK_DATA = true` in services
- Confirm `USE_LOCAL_DB = true` in environment

### Test Data Reset
If you need fresh test data:
1. Open browser dev tools
2. Go to Application > Storage
3. Clear localStorage
4. Refresh page

---

## Success Criteria
- ✅ All user types can register and login
- ✅ Job creation and management works
- ✅ Driver workflows function correctly  
- ✅ Real-time updates work (with refresh)
- ✅ Mobile responsive design works
- ✅ Error handling is graceful
- ✅ Mock data provides realistic experience

## Report Issues
When testing, note:
- Browser console errors
- Unexpected behaviors
- UI/UX issues
- Performance problems
- Missing features

Happy Testing! 🧪🚀