import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Bind to IPv4 for Codespaces/containers so the port is reachable externally
    host: "0.0.0.0",
    port: 8080,
    historyApiFallback: {
      rewrites: [
        { from: /\/dealership\/register/, to: '/signup' },
      ],
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'date-fns', 'lucide-react'],
          
          // App chunks by feature - split dealer pages for better loading
          'dealer-auth': ['./src/pages/DealerAuth.tsx'],
          'dealer-dashboard': ['./src/pages/DealerDashboard.tsx', './src/pages/DealerAdminDashboard.tsx'],
          'dealer-operations': ['./src/pages/CreateJob.tsx', './src/pages/DealerSettings.tsx'],
          'driver-pages': [
            './src/pages/DriverAuth.tsx',
            './s'./src/pages/DriverDashboard.tsx
            './src/pages/DriverPersonalProfile.tsx',
            './src/pages/DriverRequests.tsx'
          ],
          'coordinator-pages': [
            './src/pages/SwapCoordinatorAuth.tsx',
            './src/pages/SwapCoordinatorDashboard.tsx'
          ],
          'services': [
            './src/services/supabaseService.ts',
            './src/services/distanceService.ts',
            './src/services/notificationService.ts',
            './src/services/smsService.ts'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase limit to 1000kb to reduce warnings for remaining chunks
  }
}));
