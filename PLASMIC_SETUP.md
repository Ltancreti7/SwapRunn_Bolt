# Plasmic Setup for SwapRunn (React + Vite)

## ✅ Setup Complete

Your app is now configured to use Plasmic for visual editing! Here's what was set up:

### Files Created/Modified

1. **`src/plasmic-init.ts`** - Plasmic loader configuration
   - Project ID: `jMBUBJxKv692NrSbkE8x4A`
   - Preview mode enabled for live editing
   
2. **`src/pages/PlasmicCatchAll.tsx`** - Dynamic route component
   - Renders any Plasmic page based on URL path
   
3. **`src/App.tsx`** - Updated with:
   - `PlasmicRootProvider` wrapper
   - Route: `/plasmic/*` for Plasmic pages
   - Route: `/plasmic-home` for the codegen Homepage

### How to Use

#### 1. **View Your Existing Plasmic Page**
Navigate to:
- **http://localhost:8080/plasmic-home** - The code-synced Homepage component

#### 2. **Create New Pages in Plasmic Studio**
1. Go to [Plasmic Studio](https://studio.plasmic.app/projects/jMBUBJxKv692NrSbkE8x4A)
2. Create a new page component
3. Set the page path (e.g., `/about-us`)
4. Publish your changes
5. View at: **http://localhost:8080/plasmic/about-us**

#### 3. **Live Visual Editing (Hot Reload)**
When `npm run dev` is running:
1. Make changes in Plasmic Studio
2. Click "Publish" 
3. Refresh your browser - changes appear instantly!
4. No need to run `npx plasmic sync`

### Two Approaches in This Project

**Approach 1: Codegen (Current `/plasmic-home`)**
- Uses `npx plasmic sync` to generate TypeScript components
- Components in: `src/plasmic/blank_website/`
- Full TypeScript support
- Use when you need tight integration with React logic

**Approach 2: Loader (New `/plasmic/*` routes)**
- Fetches components dynamically from Plasmic
- No code generation needed
- Live preview in dev mode
- Use for marketing pages, landing pages, content pages

### Directory Structure
```
src/
├── plasmic-init.ts              # Loader config
├── plasmic-tokens.theo.json     # Design tokens
├── pages/
│   ├── PlasmicCatchAll.tsx     # Dynamic Plasmic page renderer
│   └── Homepage.tsx             # Code-synced Plasmic component
└── plasmic/
    └── blank_website/           # Generated Plasmic components
        ├── PlasmicHomepage.tsx
        ├── PlasmicStyleTokensProvider.tsx
        └── ...
```

### Important Notes

**⚠️ SECURITY**: Regenerate your Plasmic API token!
The token in `plasmic-init.ts` was exposed in chat. Go to Plasmic settings and regenerate it, then update the file.

**Mixing Approaches**:
- Keep existing SwapRunn app logic in your React pages
- Use Plasmic for marketing/content pages under `/plasmic/*`
- Your Supabase auth, routing, and existing components remain untouched

**Routes**:
- All SwapRunn routes (dealer, driver, auth, etc.) work as before
- Plasmic pages live under `/plasmic/*`
- The `/plasmic-home` route shows the codegen example

### Commands

```bash
# Start dev server with live Plasmic preview
npm run dev

# Sync codegen components (if using that approach)
npx plasmic sync

# Build for production
npm run build
```

### Next Steps

1. **Regenerate your Plasmic API token** in the dashboard
2. Update `src/plasmic-init.ts` with the new token
3. Create a new page in Plasmic Studio
4. Test it at `http://localhost:8080/plasmic/your-page-path`
5. Keep your existing SwapRunn pages for authenticated flows
6. Use Plasmic for public marketing/content pages

### Need Help?

- [Plasmic React Loader Docs](https://docs.plasmic.app/learn/loader-react/)
- [Plasmic Codegen Docs](https://docs.plasmic.app/learn/codegen-guide/)
- Your existing pages and logic are preserved - Plasmic is additive!
