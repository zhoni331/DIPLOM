# Setup & Troubleshooting Guide

## Initial Setup Problems & Solutions

This document outlines the issues that were encountered during setup and how they were fixed.

### Issue 1: Build Errors - Incorrect Import Paths

**Problem:**
```
[vite:load-fallback] Could not load C:\...\src/integrations/supabase/client
ENOENT: no such file or directory
```

**Root Cause:**
The source code was importing from `@/integrations/supabase/client` but the actual folder is named `integrations_supabase` (with an underscore, not a slash).

**Solution:**
Updated the following files to use the correct import path:
- `src/pages/HomeownerDashboard.tsx`
- `src/pages/ContractorDashboard.tsx`
- `src/pages/TeamProfile.tsx`
- `src/lib/auth.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/pages/BrowseTeams.tsx`

**Changed from:**
```typescript
import { supabase } from "@/integrations/supabase/client";
```

**Changed to:**
```typescript
import { supabase } from "@/integrations_supabase/client";
```

---

### Issue 2: Missing Environment Variables

**Problem:**
Application rendered but environment variables were not loaded, causing Supabase client initialization to fail.

**Root Cause:**
The environment file was named `env` instead of `.env`. Vite requires the `.env` filename (with a dot) to automatically load environment variables during development.

**Solution:**
Created a `.env` file in the project root with the following content:
```
VITE_SUPABASE_PROJECT_ID="bgzmpbdupfnsnjlvvsgn"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://bgzmpbdupfnsnjlvvsgn.supabase.co"
```

**Note:** The old `env` file can be removed after creating `.env`.

---

### Issue 3: Missing CSS Styling (Tailwind CSS Not Compiling)

**Problem:**
Application rendered with HTML elements but without any CSS styling. All design was missing.

**Root Cause:**
Missing `postcss.config.js` file. Tailwind CSS requires PostCSS to process `@tailwind` directives from `index.css` into compiled CSS.

**Solution:**
Created `postcss.config.js` in the project root:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**How it works:**
1. `index.css` contains `@tailwind` directives
2. PostCSS processes these directives using the Tailwind CSS plugin
3. Autoprefixer adds vendor prefixes for browser compatibility
4. The compiled CSS is served to the browser

---

## Verification

After applying all fixes, the application should:

1. ✅ Build without errors: `npm run build`
2. ✅ Start dev server: `npm run dev`
3. ✅ Display with full Tailwind CSS styling
4. ✅ Connect to Supabase backend
5. ✅ Load components with proper design

---

## File Structure Reference

```
project-root/
├── .env                          ← Environment variables (REQUIRED)
├── postcss.config.js             ← PostCSS config (REQUIRED)
├── tailwind.config.ts            ← Tailwind configuration
├── vite.config.ts                ← Vite configuration
├── src/
│   ├── index.css                 ← Contains @tailwind directives
│   ├── App.tsx                   ← Main React component
│   ├── main.tsx                  ← Entry point
│   └── integrations_supabase/    ← Supabase client location
│       ├── client.ts
│       └── types.ts
└── node_modules/                 ← Dependencies
```

---

## Common Tips

- Always use `@/integrations_supabase/client` when importing the Supabase client
- Keep `.env` in `.gitignore` to avoid committing sensitive keys
- Run `npm install` if dependencies are missing
- Clear `.vite` cache and restart dev server if CSS changes don't appear
- Check browser console for any Supabase initialization errors
