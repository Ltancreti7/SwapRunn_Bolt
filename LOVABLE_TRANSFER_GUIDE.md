# SwapRunn → Lovable Transfer Guide

## Prerequisites

1. ✅ Connect Lovable to GitHub repository: `Ltancreti7/swaprunn-grand-finale`

## Step 1: Dependencies to Install in Lovable

Copy this package.json dependencies section:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "@tanstack/react-query": "^5.83.0",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-tooltip": "^1.2.7",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.462.0",
    "react-hook-form": "^7.61.1",
    "react-router-dom": "^6.30.1",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.25.76"
  }
}
```

## Step 2: Environment Variables

Create `.env` file with:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Step 3: Core Files to Transfer (in order)

### 1. Supabase Integration

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`

### 2. Authentication & Hooks

- `src/hooks/useAuth.tsx`
- `src/components/ProtectedRoute.tsx`

### 3. Main App Structure

- `src/App.tsx` (routing and providers)
- `src/main.tsx`

### 4. Key Components

- `src/components/ui/` (entire folder)
- `src/components/Header.tsx`
- `src/components/MobileApp.tsx`

### 5. Pages (Priority Order)

- `src/pages/Index.tsx` (homepage)
- `src/pages/DriverAuth.tsx`
- `src/pages/DealerAuth.tsx`
- `src/pages/DriverDashboard.tsx`
- `src/pages/DealerDashboard.tsx`
- (Then remaining pages)

### 6. Services & Utils

- `src/lib/utils.ts`
- `src/services/` (entire folder)
- `src/types/` (entire folder)

## Step 4: Configuration Files

- `tailwind.config.ts`
- `components.json`
- `tsconfig.json`

## Quick Test

Once basic structure is in place, test:

1. Homepage loads (`/`)
2. Auth pages work (`/driver/auth`, `/dealer/auth`)
3. Supabase connection works (check browser console)

## Success Criteria

- ✅ App builds without errors
- ✅ Routing works
- ✅ Supabase authentication works
- ✅ Mobile-responsive design preserved
- ✅ All core functionality operational
