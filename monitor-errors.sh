#!/bin/bash

# SwapRunn Live Error Monitor
# This script helps monitor for errors in real-time during development

echo "🔍 SwapRunn Live Error Monitor Started"
echo "======================================"
echo ""
echo "🚀 Development Server: http://localhost:8082"
echo "📱 Mobile View: Open browser dev tools (F12) > Toggle device toolbar"
echo ""

# Function to check for common error patterns
check_for_errors() {
    echo "⏰ $(date '+%H:%M:%S') - Checking for errors..."
    
    # Check if server is responding
    if curl -s -f http://localhost:8082 > /dev/null 2>&1; then
        echo "✅ Server is responding"
    else
        echo "❌ Server is not responding!"
        return 1
    fi
    
    # Check for TypeScript/build errors
    echo "🔧 Checking for TypeScript errors..."
    npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "(error|Error)" || echo "✅ No TypeScript errors found"
    
    echo "---"
}

# Function to test critical routes
test_routes() {
    echo "🛣️  Testing critical routes..."
    
    routes=(
        "/"
        "/dealer/dashboard"
        "/driver/dashboard"
        "/how-it-works"
        "/login"
    )
    
    for route in "${routes[@]}"; do
        status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8082$route")
        if [ "$status" = "200" ]; then
            echo "✅ $route - Status: $status"
        else
            echo "⚠️  $route - Status: $status"
        fi
    done
    echo "---"
}

# Function to monitor for console errors
monitor_console_errors() {
    echo "🖥️  Console Error Monitoring Tips:"
    echo "1. Open browser dev tools (F12)"
    echo "2. Go to Console tab"
    echo "3. Look for red error messages"
    echo "4. Common errors to watch for:"
    echo "   - Authentication errors"
    echo "   - Supabase connection issues"
    echo "   - Component rendering errors"
    echo "   - Mock data loading issues"
    echo "   - Route navigation errors"
    echo ""
}

# Function to show common debugging steps
show_debug_steps() {
    echo "🐛 Common Error Investigation Steps:"
    echo "1. Browser Console (F12 > Console):"
    echo "   - Check for JavaScript errors"
    echo "   - Look for authentication flow logs"
    echo "   - Monitor network requests"
    echo ""
    echo "2. Network Tab (F12 > Network):"
    echo "   - Check for failed API calls"
    echo "   - Monitor Supabase requests"
    echo "   - Look for 404s or 500s"
    echo ""
    echo "3. Application Tab (F12 > Application):"
    echo "   - Check localStorage for mock data"
    echo "   - Verify session storage"
    echo "   - Clear storage if needed"
    echo ""
    echo "4. React Developer Tools (if installed):"
    echo "   - Check component state"
    echo "   - Monitor prop changes"
    echo "   - Debug context providers"
    echo ""
}

# Function to test authentication flow
test_auth_flow() {
    echo "🔐 Authentication Flow Test:"
    echo "1. Navigate to: http://localhost:8082/login"
    echo "2. Try login with: dealer@test.com / password123"
    echo "3. Watch browser console for auth logs"
    echo "4. Check localStorage for session data"
    echo "5. Verify redirect to appropriate dashboard"
    echo ""
    
    echo "🔧 Mock Auth Debug:"
    echo "- App should show: 'Using LOCAL DATABASE for development'"
    echo "- Auth operations should show: '🔧 Local mode:' messages"
    echo "- Session should persist in localStorage as 'mock-session'"
    echo ""
}

# Function to test mock data
test_mock_data() {
    echo "📊 Mock Data Test:"
    echo "1. Check that USE_MOCK_DATA = true in services"
    echo "2. Verify sample jobs appear in dashboard"
    echo "3. Test job creation and management"
    echo "4. Monitor console for mock operation logs"
    echo ""
}

# Main monitoring loop
main() {
    echo "🚀 Starting comprehensive error monitoring..."
    echo ""
    
    # Initial checks
    check_for_errors
    test_routes
    monitor_console_errors
    show_debug_steps
    test_auth_flow
    test_mock_data
    
    echo "🔄 Live Monitoring Active - Use Ctrl+C to stop"
    echo "🌐 App URL: http://localhost:8082"
    echo ""
    
    # Continuous monitoring
    while true; do
        sleep 30
        check_for_errors
    done
}

# Handle interruption gracefully
trap 'echo ""; echo "👋 Error monitoring stopped"; exit 0' INT

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the SwapRunn_Bolt directory"
    exit 1
fi

# Check if dev server is running
if ! curl -s -f http://localhost:8082 > /dev/null 2>&1; then
    echo "⚠️  Development server not detected on port 8082"
    echo "🚀 Starting development server..."
    npm run dev &
    sleep 5
fi

# Start monitoring
main