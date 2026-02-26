# MyCatchBook Production Checklist

## Phase 1: Critical Security (Do First)

- [x] **Deploy Firestore security rules** — Currently no rules enforced; any user can read/write/delete all data. Create `firestore.rules` with per-collection authorization (owner-only writes, visibility-based reads, admin checks for groups).
- [x] **Revoke exposed GitHub PAT** — Token `ghp_rugl2...` found in `node_modules/.cache/gh-pages/`. Revoke immediately on GitHub and regenerate if needed.
- [x] **Restrict API keys** — Gemini and Google Places keys are baked into the client bundle via `VITE_*` env vars. At minimum, add HTTP referrer restrictions and billing alerts in Google Cloud Console. Ideally, proxy through Firebase Cloud Functions.
- [x] **Fix XSS in MapView** — `src/components/MapView.jsx:138-154` uses `innerHTML` with unsanitized user data (`species`, `weather`, `image`). Switch to `textContent` or programmatic DOM creation.
- [x] **Fix backfill forcing catches public** — `src/hooks/useFirestoreCatches.js:39-63` silently overrides `private`/`friends` visibility to `public`. Remove or fix this migration.
- [x] **Fix Storage rules for avatars** — `ProfileSettings.jsx` uploads to `avatars/${uid}` but storage rules only allow writes to `users/{userId}/catches/...`. Add avatar write rule.

## Phase 2: High Priority Bugs & Security

- [x] **Add route guards** — Auth-only pages (chat, friends, settings, challenges, trips, sonar) are accessible via direct URL. Create a `ProtectedRoute` wrapper component.
- [x] **Fix full collection scans**:
  - `src/utils/friends.js:76-87` — `searchUsers` downloads entire `users` collection for client-side search. Use Firestore query or Cloud Function.
  - `src/utils/leaderboard.js:12-18` — `getRegionUserIds` downloads all users to filter by region. Add Firestore index on `region` field.
- [x] **Add input validation** — All Firestore write functions (`addCatch`, `sendMessage`, `addComment`, `addSpot`) accept arbitrary data with `...data` spread. Define schemas, validate before writes.
- [x] **Fix challenge data leak** — `src/utils/challenges.js:125-147` fetches ALL challenges (including private) then filters client-side. Add server-side query filters.
- [x] **Migrate images to Firebase Storage** — Base64 image data stored directly in Firestore documents (100KB-500KB each). Store in Firebase Storage, save only download URLs in Firestore. This also reduces Firestore read costs significantly.
- [x] **Add password reset flow** — Auth page has no "Forgot Password" option. Add `sendPasswordResetEmail` from Firebase Auth.

## Phase 3: Medium Priority

- [x] **Hide stack traces in production** — `src/main.jsx:17-26` and `src/components/ErrorBoundary.jsx:41` expose full error stacks. Gate behind `import.meta.env.DEV`.
- [x] **Fix race condition in ActivityFeed** — `src/components/ActivityFeed.jsx:28-57` has stale closure on `lastDoc` causing duplicate fetches. Use a ref instead.
- [x] **Fix UserProfile stale closure** — `src/components/UserProfile.jsx:20-31` computes `isFriend`/`isOwn` before profile loads, so friends-only catches never show.
- [x] **Add security headers to firebase.json**:
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [x] **Add client-side rate limiting** — No throttle/debounce on Gemini API calls. Users can rapidly trigger calls and exhaust the shared API key.
- [x] **Audit external links** — Add `rel="noopener noreferrer"` to all external links (e.g., LocalGuide regulation URLs).

## Phase 4: Code Quality & Polish

- [x] **Replace `alert()`/`confirm()`** — `GroupSettings.jsx:45` uses `confirm()`, `UserProfile.jsx:82` uses `alert()`. Use custom modal and toast system instead.
- [x] **Optimize logo.png** — `public/logo.png` is 984KB. Convert to WebP or remove if unused (app uses `logo-192.png`).
- [x] **Move `vite-plugin-pwa` to devDependencies** — Listed in `dependencies` but is build-time only.
- [x] **Fix IndexedDB connection leaks** — `src/utils/offlineStorage.js:15-29` opens new connections per operation without closing. Use singleton pattern.
- [x] **Fix image repair memory leak** — `src/hooks/useFirestoreCatches.js:67-102` runs async operations without cancellation on unmount.

## Phase 5: Production Infrastructure

- [x] **Add error tracking** — Integrated @sentry/react with ErrorBoundary and unhandled rejection capture. DSN configured via `VITE_SENTRY_DSN` env var, disabled in non-prod.
- [x] **Add analytics** — Firebase Analytics initialized with `isSupported()` guard. Automatic pageviews/engagement only.
- [x] **Add social meta tags** — Added `og:image`, `og:url`, Twitter card tags, and `apple-touch-icon` to `index.html`.
- [x] **Review service worker caching** — Changed 6 tile cache rules from CacheFirst to StaleWhileRevalidate, removed opaque response caching (`statuses: [0, 200]`).

## Phase 6: Revenue & Distribution

- [ ] Define monetization strategy (ads, pro tier, subscriptions)
- [ ] Google Play Store listing (TWA or React Native wrapper)
- [ ] Apple App Store (Capacitor or React Native wrapper)
- [ ] Landing page / marketing site
- [ ] Terms of Service & Privacy Policy

## Phase 7: Growth & Scale

- [ ] Server-side search (Algolia/Typesense) to replace full collection scans
- [ ] Firebase Cloud Functions for API proxying and server-side logic
- [ ] CDN optimization for images
- [ ] Database indexing audit
- [ ] Load testing
- [ ] Automated backups for Firestore data
