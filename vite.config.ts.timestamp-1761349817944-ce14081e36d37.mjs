// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select", "@radix-ui/react-tabs"],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "utils-vendor": ["clsx", "tailwind-merge", "date-fns", "lucide-react"],
          // App chunks by feature - split dealer pages for better loading
          "dealer-auth": ["./src/pages/DealerAuth.tsx"],
          "dealer-dashboard": ["./src/pages/DealerDashboard.tsx", "./src/pages/DealerAdminDashboard.tsx"],
          "dealer-operations": ["./src/pages/CreateJob.tsx", "./src/pages/DealerSettings.tsx"],
          "driver-pages": [
            "./src/pages/DriverAuth.tsx",
            "./src/pages/DriverDashboard.tsx",
            "./src/pages/DriverPersonalProfile.tsx",
            "./src/pages/DriverRequests.tsx"
          ],
          "coordinator-pages": [
            "./src/pages/SwapCoordinatorAuth.tsx",
            "./src/pages/SwapCoordinatorDashboard.tsx"
          ],
          "services": [
            "./src/services/supabaseService.ts",
            "./src/services/distanceService.ts",
            "./src/services/notificationService.ts",
            "./src/services/smsService.ts"
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1e3
    // Increase limit to 1000kb to reduce warnings for remaining chunks
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA4MDgwLFxuICB9LFxuICBwbHVnaW5zOiBbcmVhY3QoKSwgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpXS5maWx0ZXIoXG4gICAgQm9vbGVhbixcbiAgKSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAvLyBWZW5kb3IgbGlicmFyaWVzXG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAndWktdmVuZG9yJzogWydAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJywgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51JywgJ0ByYWRpeC11aS9yZWFjdC1zZWxlY3QnLCAnQHJhZGl4LXVpL3JlYWN0LXRhYnMnXSxcbiAgICAgICAgICAnZm9ybS12ZW5kb3InOiBbJ3JlYWN0LWhvb2stZm9ybScsICdAaG9va2Zvcm0vcmVzb2x2ZXJzJywgJ3pvZCddLFxuICAgICAgICAgICdzdXBhYmFzZS12ZW5kb3InOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxuICAgICAgICAgICd1dGlscy12ZW5kb3InOiBbJ2Nsc3gnLCAndGFpbHdpbmQtbWVyZ2UnLCAnZGF0ZS1mbnMnLCAnbHVjaWRlLXJlYWN0J10sXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQXBwIGNodW5rcyBieSBmZWF0dXJlIC0gc3BsaXQgZGVhbGVyIHBhZ2VzIGZvciBiZXR0ZXIgbG9hZGluZ1xuICAgICAgICAgICdkZWFsZXItYXV0aCc6IFsnLi9zcmMvcGFnZXMvRGVhbGVyQXV0aC50c3gnXSxcbiAgICAgICAgICAnZGVhbGVyLWRhc2hib2FyZCc6IFsnLi9zcmMvcGFnZXMvRGVhbGVyRGFzaGJvYXJkLnRzeCcsICcuL3NyYy9wYWdlcy9EZWFsZXJBZG1pbkRhc2hib2FyZC50c3gnXSxcbiAgICAgICAgICAnZGVhbGVyLW9wZXJhdGlvbnMnOiBbJy4vc3JjL3BhZ2VzL0NyZWF0ZUpvYi50c3gnLCAnLi9zcmMvcGFnZXMvRGVhbGVyU2V0dGluZ3MudHN4J10sXG4gICAgICAgICAgJ2RyaXZlci1wYWdlcyc6IFtcbiAgICAgICAgICAgICcuL3NyYy9wYWdlcy9Ecml2ZXJBdXRoLnRzeCcsXG4gICAgICAgICAgICAnLi9zcmMvcGFnZXMvRHJpdmVyRGFzaGJvYXJkLnRzeCcsXG4gICAgICAgICAgICAnLi9zcmMvcGFnZXMvRHJpdmVyUGVyc29uYWxQcm9maWxlLnRzeCcsXG4gICAgICAgICAgICAnLi9zcmMvcGFnZXMvRHJpdmVyUmVxdWVzdHMudHN4J1xuICAgICAgICAgIF0sXG4gICAgICAgICAgJ2Nvb3JkaW5hdG9yLXBhZ2VzJzogW1xuICAgICAgICAgICAgJy4vc3JjL3BhZ2VzL1N3YXBDb29yZGluYXRvckF1dGgudHN4JyxcbiAgICAgICAgICAgICcuL3NyYy9wYWdlcy9Td2FwQ29vcmRpbmF0b3JEYXNoYm9hcmQudHN4J1xuICAgICAgICAgIF0sXG4gICAgICAgICAgJ3NlcnZpY2VzJzogW1xuICAgICAgICAgICAgJy4vc3JjL3NlcnZpY2VzL3N1cGFiYXNlU2VydmljZS50cycsXG4gICAgICAgICAgICAnLi9zcmMvc2VydmljZXMvZGlzdGFuY2VTZXJ2aWNlLnRzJyxcbiAgICAgICAgICAgICcuL3NyYy9zZXJ2aWNlcy9ub3RpZmljYXRpb25TZXJ2aWNlLnRzJyxcbiAgICAgICAgICAgICcuL3NyYy9zZXJ2aWNlcy9zbXNTZXJ2aWNlLnRzJ1xuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwIC8vIEluY3JlYXNlIGxpbWl0IHRvIDEwMDBrYiB0byByZWR1Y2Ugd2FybmluZ3MgZm9yIHJlbWFpbmluZyBjaHVua3NcbiAgfVxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxpQkFBaUIsZ0JBQWdCLENBQUMsRUFBRTtBQUFBLElBQzlEO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBO0FBQUEsVUFFWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDekQsYUFBYSxDQUFDLDBCQUEwQixpQ0FBaUMsMEJBQTBCLHNCQUFzQjtBQUFBLFVBQ3pILGVBQWUsQ0FBQyxtQkFBbUIsdUJBQXVCLEtBQUs7QUFBQSxVQUMvRCxtQkFBbUIsQ0FBQyx1QkFBdUI7QUFBQSxVQUMzQyxnQkFBZ0IsQ0FBQyxRQUFRLGtCQUFrQixZQUFZLGNBQWM7QUFBQTtBQUFBLFVBR3JFLGVBQWUsQ0FBQyw0QkFBNEI7QUFBQSxVQUM1QyxvQkFBb0IsQ0FBQyxtQ0FBbUMsc0NBQXNDO0FBQUEsVUFDOUYscUJBQXFCLENBQUMsNkJBQTZCLGdDQUFnQztBQUFBLFVBQ25GLGdCQUFnQjtBQUFBLFlBQ2Q7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxxQkFBcUI7QUFBQSxZQUNuQjtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxZQUFZO0FBQUEsWUFDVjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLHVCQUF1QjtBQUFBO0FBQUEsRUFDekI7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
