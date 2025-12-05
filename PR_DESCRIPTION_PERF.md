# Performance Optimization & Dashboard Improvements

## 🚀 Improvements
- **Database Optimization**: Refactored `getCurrentUserProfile` to fetch user profile and team data in a single query using JOINs, reducing database roundtrips.
- **Progressive Rendering**: Implemented React `Suspense` boundaries in the Dashboard to allow the UI to load immediately while fetching heavier data (stats, progression) in the background.
- **Better UX**: Added `loading.tsx` states and Skeleton components to provide visual feedback during data loading.

## 🛠 Technical Changes
- Modified `lib/supabase/profile.ts` to include `equipe` relation in the main query.
- Updated `lib/types/profile.ts` to reflect the new data structure.
- Refactored `app/(pwa)/dashboard/page.tsx` to use async components and Suspense.
- Added `app/(pwa)/dashboard/loading.tsx`.

## 🧪 Verification
- Verified that the dashboard loads faster and displays skeleton states correctly.
- Confirmed that user profile and team data are correctly displayed.
