Implement several improvements to AgendIlha focusing on personalization, onboarding, security, and social sharing.

### 1. Database & Security
- Add notification settings columns to `profiles` (push_enabled, email_enabled, notification_frequency).
- Create a `follows` table to track users following specific neighborhoods, musical styles, or artists.
- Update RLS policies for `submissions` to ensure only users with 'admin' or 'promoter' roles can create/edit events.
- Implement a `user_type` enum or use the existing `role` column to distinguish between Public, Musician, and Admin.

### 2. Onboarding & Personalization
- Create a modern, optional Onboarding flow for new public users to select their neighborhood, city, and musical preferences.
- Add a "Personalize Experience" button to the main pages (Landing and Agenda) that opens a drawer/dialog to update these settings.
- Ensure the event lists (Index/Landing and AgendaCultural) update dynamically when preferences change without a full page reload.

### 3. Notifications & Social Features
- Implement an Opt-in notification system in the user profile/settings.
- Build a robust social sharing utility that generates pre-formatted messages for WhatsApp, Instagram, etc., including event details and links.

### 4. UI/UX Refinements
- Remove the requested "Curadoria e tecnologia local" text from the footer and event cards.
- Improve the contrast and legibility of "Coé a Boa? apresenta" and other hero text using overlays and better typography.
- Ensure mobile-first responsiveness across all new components.

### 5. Frontend Logic
- Update `usePermissions` hook to strictly enforce role-based access to submission forms and admin routes.
- Update the recommendation engine in `Landing.tsx` and `AgendaCultural.tsx` to prioritize followed neighborhoods and styles.

**Technical Details:**
- Use `framer-motion` for onboarding animations.
- Use `shadcn/ui` (Dialog, Drawer, Select, Switch) for settings and onboarding.
- Update `AuthContext` and `useProfile` to handle the new fields.
- Use `supabase.rpc` for permission checks if needed.
