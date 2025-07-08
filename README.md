📦 React Native Inventory Management
A production‑ready, cross‑platform inventory system with real-time stock, advanced crash prevention, and role‑based access control.
________________________________________
🚀 Features
📊 Core Functionality
•	Product Management: CRUD with multi‑variant support (size/color/specs), barcode scanning, batch & expiry tracking, multi‑level BOM, component substitution & cost analysis.
•	Inventory Tracking: Real‑time stock by location (Warehouse > Zone > Shelf), live updates, transfer history, low‑stock alerts & reorder notifications, bulk import/export.
•	Formula Management: Complex formulations with component tracking, batch sizing, scaling & alternative ingredients.
•	Location Management: Hierarchical multi‑location support, stock & transfer controls, location‑based permissions.
•	Subcategory Organization: Unlimited nested categories, bulk assignment & category‑specific fields.
•	User Management & RBAC: Roles (Master/Employee/User) with granular, department‑based permissions & session monitoring.
•	Audit Logging: Full change history, timestamped actions & compliance exports.
•	Alerts & Notifications: Custom thresholds, email & in‑app delivery, escalation workflows.
•	Analytics & Reporting: Dashboards (turnover, movement, cost/profit, trends & forecasts) & custom report scheduling.
________________________________________
🛡️ Advanced Crash Prevention
Multi‑layer error handling with automatic recovery:
1.	ErrorBoundary → user‑friendly fallback → “Go to Dashboard”.
2.	Session & auth checks → safe state restoration.
3.	Automatic error logging & reporting.
![image](https://github.com/user-attachments/assets/2415377b-785f-45e9-8600-c636f9ddb2cd)
	 

Coverage:
•	Network: retries w/ backoff, offline queuing, timeouts.
•	Null Safety: try‑catch, optional chaining, defaults.
•	Async: global rejection handler, background recovery.
•	JSON: schema validation, sanitization & graceful degradation.
•	Storage: quota management, corruption detection & cross‑platform fallbacks.
Validations:
•	Redux State: TS interfaces, immutability & time‑travel debugging.
•	Forms: real‑time, cross‑field & async server checks.
•	API: runtime type checks & version compatibility.
•	Performance: memory, render times & bundle size.
________________________________________
🧪 Testing Suite
•	23+ error scenarios (network, storage, auth, JSON, performance).
•	Dev‑only crash tests via web (mobile support planned).
•	Interactive dashboard & automated scheduling.
•	Benchmarking (<1 ms allocation, request timings).
________________________________________
👥 Role‑Based Access Control
Feature	Master	Employee	User
User Management	✅ Full	❌	❌
Product Creation	✅ Full	✅ Full	❌
Inventory Updates	✅ Full	✅ Full	✅ Limited
Statistics View	✅ Full	✅ Department	❌
Audit Logs	✅ Full	✅ Own Actions	❌
System Settings	✅ Full	❌	❌
Roles:
•	Master: Full system & config access + analytics.
•	Employee: Operational inventory & department reports.
•	User: Read‑only in assigned areas.
________________________________________
🔐 Security
•	Auth & Authz: JWT (RS256), auto‑refresh, encrypted storage, session timeout & 2FA planned.
•	Data Protection: AES‑256 at rest, HTTPS + certificate pinning, XSS/CSRF prevention.
•	Monitoring: failed‑login lockout, session checks & anomaly detection.
________________________________________
🏗️ Technical Architecture
Frontend: React Native v0.72+, Expo v49+, TypeScript v5+, Redux Toolkit, RTK Query, Paper & Navigation.
Store (/store/slices/): auth, products, inventory, users, formulas, subcategories, locations, auditLogs, alerts + api.ts.
Components: modals (Create/Edit), lists (FormulasList, LocationsList), core (ErrorBoundary, CrashTestComponent, AuthGuard, IfMaster, LoadingSpinner, SearchBar, CategoryBadge).
Utils: errorTesting.ts (23+), authHelper.ts, helperFunctions.ts, axiosInterceptor.ts, constant.ts, backHandlerPolyfill.ts.
________________________________________
🛠️ Detailed Setup & Installation
1. Prerequisites
•	Node.js v16+ (18+ recommended)
•	npm v8+ or yarn v1.22+
•	Expo CLI v6+ npm install -g expo-cli
•	Git v2.30+
•	iOS: Xcode 14+ | Android: Studio + SDK 33+
2. Clone & Install
git clone https://github.com/your-org/inventory-frontend.git
cd inventory-frontend
# Install
# Yarn (recommended)
yarn install --frozen-lockfile
# Or npm
npm ci
3. Environment Configuration
cp .env.example .env
Edit .env:
API_BASE_URL=https://api.yourdomain.com
API_VERSION=v1
JWT_SECRET=your-jwt-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
ENCRYPTION_KEY=your-encryption-key
EXPO_DEBUG=true
CRASH_TESTING_ENABLED=true
IOS_BUNDLE_ID=com.yourcompany.inventory
ANDROID_PACKAGE=com.yourcompany.inventory
Use .env.local or CI secrets for overrides.
4. Running the App
yarn start         # or npm run start
# iOS simulator
yarn ios
# Android emulator
yarn android
# Web (crash testing)
yarn web
5. Clearing Cache & Rebuilds
expo start --clear
rm -rf node_modules yarn.lock package-lock.json
yarn install      # or npm install
6. VS Code Recommendations
•	Extensions: ESLint, Prettier, React Native Tools, TS Importer, Bracket Pair Colorizer
•	Settings (.vscode/settings.json):
 	{
  "editor.formatOnSave": true,
  "eslint.validate": ["javascript","typescript","typescriptreact"],
  "files.exclude": {"**/node_modules": true}
}
7. Troubleshooting Common Issues
•	Bundler hanging: expo start --clear
•	Dependency errors: match Node to .nvmrc (use nvm)
•	iOS build fails: update signing in Xcode’s ios/
•	Android emulator: verify ANDROID_HOME & SDK paths
________________________________________
🚀 Deployment
expo build --platform all --dev|--staging|--release-channel production
Configure app.json for iOS & Android (bundle IDs, permissions).
________________________________________
🤝 Contributing
•	Git flow: feature branches, Conventional Commits
•	PR: lint/typechecks & tests ✅, security review & docs
•	Review: error boundaries, strict TS, performance, security & WCAG 2.1 AA
________________________________________
📞 Support
•	GitHub Issues/Discussions
•	Docs: inline JSDoc
•	Crash logs: in-app DevTools
•	Performance: custom dashboards & analytics integrations
________________________________________
🚧 Roadmap & Known Issues
•	Current: mobile crash testing & offline mode improvements, WebSocket integration, advanced analytics
•	Upcoming: mobile crash validation (Q1 ’24), dark mode (Q2), predictive insights (Q3), barcode automation (Q4), i18n & collaboration (2024+)
