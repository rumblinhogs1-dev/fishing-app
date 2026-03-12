# Pre-Launch Security & Compliance Checklist

## 1. Authentication & User Data
- [x] Lock down Firebase security rules (replace any open test mode rules)
- [x] Enforce strong password requirements
- [ ] ~~Consider adding multi-factor auth~~ — DEFERRED to post-launch (use TOTP not SMS to avoid costs)
- [x] Ensure user location/catch data is only accessible by the owner

## 2. API & Backend
- [x] Verify Firebase config keys and Gemini API keys are NOT in client-side code (use `functions/.env`)
- [x] Rate-limit API calls to prevent abuse and billing spikes
- [x] Validate all user inputs server-side, not just client-side

## 3. Privacy (critical for heat map & location features)
- [x] Confirm tiered opt-in for crowdsourced heat map is working correctly
- [x] Update privacy policy to clearly cover GPS/location data collection
- [x] Audit data collection — only collect what's actually needed (data minimization)

## 4. App Store Submission Checks
- [ ] Prepare Apple data privacy labels and location usage justification — DO IN APP STORE CONNECT
- [ ] Fill out Google Play Data Safety section accurately — DO IN PLAY CONSOLE
- [x] Verify all requested permissions are clearly justified in-app
- [x] Plan for user-generated content moderation (if applicable)

## 5. Third-Party & Dependency Audit
- [x] Run `npm audit` and fix known vulnerabilities
- [x] Update Firebase SDK and other packages to latest stable versions

## 6. Penetration Testing
- [x] Run OWASP ZAP (or similar) automated vulnerability scan
- [x] Do a manual review of location data handling
- [x] Basic pen test before launch

## 7. Final Review (in order)
- [x] Lock down Firebase rules
- [x] Audit permissions and data collection
- [x] Run automated vulnerability scans
- [x] Manual review: privacy policy vs actual app behavior
- [ ] Submit to app stores and address feedback
