# Performance Optimization Plan - AgendIlha

Audit and optimization of system performance across database, network, and frontend layers.

## Technical Details

### 1. Database & Network (Supabase)
- **View Materialization**: Evaluate if `public_submissions` (security_invoker) can benefit from a materialized view for the main feed, given the high read volume vs low update frequency.
- **Select Narrowing**: Refactor `useAgendaData.ts` to fetch only required columns (currently uses `*`) to reduce payload size.
- **RPC Batching**: Combine `increment_views` and other telemetry into a single debounced call to reduce network overhead during user sessions.

### 2. Frontend (React & Vite)
- **Image Optimization**:
    - Force `loading="eager"` and `fetchpriority="high"` for the first 2-3 images in the hero/today sections.
    - Implement `srcset` support for `DiscoveryEventCard` to serve smaller images on mobile.
- **Bundle Splitting**:
    - Move `PersonalizationDialog` and `ShareDialog` to a separate vendor chunk.
    - Audit `lucide-react` imports in `Landing.tsx` to ensure tree-shaking is effective (verify if icon sub-imports are used).
- **Code Refactoring**:
    - Memoize expensive calculations in `Landing.tsx` (like `trendingEvents` and `todayEvents` derived from the main list).
    - Implement a virtualized list for the main agenda feed if it exceeds 50+ items.

### 3. Assets & Rendering
- **Font Optimization**: Add `font-display: swap` to all Google Font imports and consider preloading the `Outfit` font for the H1 header.
- **Lazy Loading**: Ensure all non-visible sections (Ecossistema, Diferenciais, Contato) use `loading="lazy"` or `IntersectionObserver` to defer rendering.

## Proposed Changes

### Database
- **Submissions View**: Ensure indexes on `status` and `date` are optimized for the `public_submissions` view.

### Code
- **src/hooks/useAgendaData.ts**: Narrow query selection.
- **src/components/DiscoveryEventCard.tsx**: Improve image loading priority and memoization.
- **src/pages/Landing.tsx**: Optimize event filtering logic to prevent unnecessary re-renders.

---
*Note: This optimization focuses on Core Web Vitals (LCP/CLS) and reducing mobile data consumption.*
