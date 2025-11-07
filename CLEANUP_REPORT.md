# 🧹 Codebase Cleanup Report

**Generated:** November 7, 2025  
**Repository:** SwapRunn_Bolt

---

## ❌ Issues Found

### 🗂️ **1. Unnecessary ZIP Files (DELETE THESE)**

These backup/archive files should be removed from the repo:

```
/src.zip                          # 
/swaprunn_frontend.zip            # Old frontend backup
/supabase.zip                     # Supabase backup
/swaprunn-live-deploy-main.zip    # Old deployment archive
/public.zip                       # Public folder backup
```

**Action:** Delete all `.zip` files and add `*.zip` to `.gitignore`

---

### 📂 **2. Unnecessary Directories**

#### `.next/` - Next.js Build Cache
- **Issue:** This is a Next.js build directory, but you're using **Vite**, not Next.js
- **Why it exists:** Possibly from old Plasmic setup or previous Next.js attempt
- **Action:** Delete it - not needed for Vite projects

#### `api/` - Vercel API Routes
- **Contents:** `addDriver.ts`, `addJob.ts`, `addStaff.ts`
- **Issue:** These are Vercel API routes (Next.js pattern), but you use **Supabase Edge Functions**
- **Location Mismatch:** Should be in `supabase/functions/` if still needed
- **Action:** Review if needed; if so, migrate to Supabase functions

#### `dist/` - Build Output
- **Issue:** Build artifacts should not be committed
- **Action:** Add to `.gitignore` if not already

#### `1.` - Mystery Empty File
- **Issue:** Empty file with no extension
- **Action:** Delete

---

### 📝 **3. JavaScript Files in TypeScript Project**

Your project is TypeScript, but these are `.js`:

```
src/hooks/useJobNotifications.js   # ❌ Should be .ts or .tsx
src/utils/jobs.js                  # ❌ Should be .ts
```

**Issues:**
- No type safety
- Not using TypeScript benefits
- `useJobNotifications.js` is **NOT IMPORTED ANYWHERE** (dead code!)
- `jobs.js` is **NOT IMPORTED ANYWHERE** (dead code!)

**Action:** 
- Convert to TypeScript OR delete if unused
- Current analysis: **Both are unused - DELETE**

---

### 🗄️ **4. Log Files**

```
.dev-logs/vite-8080.log
```

**Action:** Keep `.dev-logs/` folder but add `*.log` to `.gitignore`

---

### ⚙️ **5. Configuration Redundancy**

#### Multiple Capacitor Configs
```
capacitor.config.ts        # ✓ Main config (KEEP)
capacitor.config.local.ts  # Local overrides (KEEP)
capacitor.config.prod.ts   # Production config (KEEP)
```
**Status:** ✅ These are intentional - keep all

#### Vite Build Artifact
```
vite.config.ts.timestamp-1761349817944-ce14081e36d37.mjs
```
**Action:** Delete - this is a build artifact

---

### 📚 **6. Documentation Files (Review)**

Too many docs in root - consider organizing:

```
APP_STORE_SUBMISSION_GUIDE.md
ARCHITECTURE_FLOWCHART.md        # ✓ Just created - KEEP
LOVABLE_MIGRATION_PLAN.md
LOVABLE_TRANSFER_GUIDE.md
PLASMIC_SETUP.md                 # ✓ Just created - KEEP  
PROJECT_SETUP_GUIDE.md
QUICK_REFERENCE.txt
README-MOBILE.md
README.md
TONIGHT_TODO.md                  # ❌ Should be in .gitignore or deleted
```

**Recommendation:** Create a `docs/` folder and move all except README.md

---

### 🗃️ **7. Supabase Migrations Backup**

```
supabase/migrations_backup/
```

**Status:** If you have active `supabase/migrations/`, this backup can be deleted

---

## ✅ Recommended Actions

### **Priority 1: Delete Immediately**

```bash
# Remove zip files
rm src.zip swaprunn_frontend.zip supabase.zip swaprunn-live-deploy-main.zip public.zip

# Remove Next.js directory (not using Next.js)
rm -rf .next/

# Remove unused JavaScript files
rm src/hooks/useJobNotifications.js
rm src/utils/jobs.js

# Remove build artifacts
rm vite.config.ts.timestamp-1761349817944-ce14081e36d37.mjs

# Remove mystery file
rm "1."

# Review and possibly delete api/ folder
rm -rf api/  # Only if confirmed unused
```

### **Priority 2: Update .gitignore**

Add these lines to `.gitignore`:

```gitignore
# Build outputs
dist/
.next/

# Logs
*.log
.dev-logs/*.log

# Archives
*.zip

# Temporary files
*.timestamp-*.mjs

# macOS
.DS_Store

# TODO files (personal)
TONIGHT_TODO.md
```

### **Priority 3: Organize Documentation**

```bash
mkdir -p docs
mv APP_STORE_SUBMISSION_GUIDE.md docs/
mv LOVABLE_MIGRATION_PLAN.md docs/
mv LOVABLE_TRANSFER_GUIDE.md docs/
mv PROJECT_SETUP_GUIDE.md docs/
mv QUICK_REFERENCE.txt docs/
mv README-MOBILE.md docs/
mv TONIGHT_TODO.md docs/ # Or delete it

# Keep in root:
# README.md
# ARCHITECTURE_FLOWCHART.md
# PLASMIC_SETUP.md
```

### **Priority 4: Convert or Delete `api/` folder**

**Option A:** If you need those functions, migrate to Supabase:
```bash
mv api/addDriver.ts supabase/functions/add-driver/index.ts
mv api/addJob.ts supabase/functions/add-job/index.ts
mv api/addStaff.ts supabase/functions/add-staff/index.ts
rm -rf api/
```

**Option B:** If unused, just delete:
```bash
rm -rf api/
```

---

## 📊 Summary

| Category | Issues Found | Action Required |
|----------|--------------|-----------------|
| Zip Files | 5 | Delete all |
| Unused Directories | 2 | Delete .next/, review api/ |
| Dead Code | 2 JS files | Delete both |
| Build Artifacts | 2 | Delete & add to .gitignore |
| Documentation | 9 files | Organize into docs/ |
| **TOTAL** | **20 items** | **Cleanup needed** |

---

## 🎯 Impact

After cleanup:
- ✅ **~50MB** disk space saved (from zip files)
- ✅ Cleaner git history
- ✅ Faster builds (no .next cache confusion)
- ✅ Better organized documentation
- ✅ TypeScript consistency enforced
- ✅ No dead code

---

## ⚠️ Before You Delete

**Backup check:** Make sure you have:
1. ✅ Latest push to GitHub (already done: commit `1d8580c`)
2. ✅ Working dev server
3. ✅ No critical code in `api/` folder

---

**Ready to clean up?** Let me know and I'll run the cleanup commands!
