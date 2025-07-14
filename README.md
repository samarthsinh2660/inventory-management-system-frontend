# 📦 React Native Inventory Management

A production-ready, cross-platform inventory system with real-time stock, advanced crash prevention, and role-based access control.

---

## 🚀 Features

### 📊 Core Functionality

* **Product Management**: CRUD with multi-variant support (size/color/specs), barcode scanning, batch & expiry tracking, multi-level BOM, component substitution & cost analysis.
* **Inventory Tracking**: Real-time stock by location (Warehouse > Zone > Shelf), live updates, transfer history, low-stock alerts & reorder notifications, bulk import/export.
* **Formula Management**: Complex formulations with component tracking, batch sizing, scaling & alternative ingredients.
* **Location Management**: Hierarchical multi-location support, stock & transfer controls, location-based permissions.
* **Subcategory Organization**: Unlimited nested categories, bulk assignment & category-specific fields.
* **User Management & RBAC**: Roles (Master/Employee/User) with granular, department-based permissions & session monitoring.
* **Audit Logging**: Full change history, timestamped actions & compliance exports.
* **Alerts & Notifications**: Custom thresholds, in-app delivery, escalation workflows.
* **Analytics & Reporting**: Dashboards (turnover, movement, cost/profit, trends & forecasts) & custom report scheduling.

---

## 🛡️ Advanced Crash Prevention

Multi-layer error handling with automatic recovery:

1. ErrorBoundary → user-friendly fallback → "Go to Dashboard"
2. Session & auth checks → safe state restoration
3. Automatic error logging & reporting

![image](https://github.com/user-attachments/assets/3dd1c425-eafa-4f8d-ab1c-1e565c7f63e2)


**Coverage:**

* **Network**: retries with backoff, offline queuing, timeouts
* **Null Safety**: try-catch, optional chaining, default values
* **Async**: global rejection handler, background recovery
* **JSON**: schema validation, sanitization & graceful degradation
* **Storage**: quota management, corruption detection, cross-platform fallbacks

**Validations:**

* Redux State: TS interfaces, immutability, time-travel debugging
* Forms: real-time, cross-field, async server checks
* API: runtime type checks, version compatibility
* Performance: memory profiling, render benchmarks, bundle size optimization

---

## 🧪 Testing Suite

* 23+ error scenarios (network, storage, auth, JSON, performance)
* Dev-only crash tests via web (mobile support planned)
* Interactive dashboard & automated scheduling
* Benchmarking (<1ms allocation, request timings)

---

## 👥 Role-Based Access Control

| Feature           | Master | Employee     
| ----------------- | ------ | -------------
| User Management   | ✅ Full | ❌           
| Product Creation  | ✅ Full | ✅ Full     
| Inventory Updates | ✅ Full | ✅ Full      
| Statistics View   | ✅ Full | ✅ Department 
| Audit Logs        | ✅ Full | ✅ Own Actions
| System Settings   | ✅ Full | ❌             

**Roles:**

* **Master**: Full system & config access + analytics
* **Employee**: Operational inventory & department reports
* **User**: Read-only in assigned areas

---

## 🔐 Security

* **Authentication & Authorization**: JWT (RS256), auto-refresh, encrypted storage, session timeout (2FA coming soon)
* **Data Protection**: AES-256 at rest, HTTPS + certificate pinning, XSS/CSRF prevention
* **Monitoring**: failed-login lockout, session validation, anomaly detection

---

## 🏗️ Technical Architecture

* **Frontend**: React Native v0.72+, Expo v49+, TypeScript v5+, Redux Toolkit, RTK Query, Paper UI, React Navigation
* **State Management**: Redux slices for auth, products, inventory, users, formulas, subcategories, locations, auditLogs, alerts, api.ts
* **Components**: modals (Create/Edit), lists (FormulasList, LocationsList), core (ErrorBoundary, AuthGuard, IfMaster, SearchBar)
* **Utils**: errorTesting.ts (23+), authHelper.ts, helperFunctions.ts, axiosInterceptor.ts, constants.ts

---

## 🛠️ Setup & Installation

### 1. Prerequisites

* Node.js v18+
* npm v8+
* Git v2.30+
* Expo CLI: `npm install -g expo-cli`
* Android Studio + SDK 33+
* Xcode 14+ (for iOS)

### 2. Clone & Install

```bash
git clone https://github.com/your-org/inventory-frontend.git
cd inventory-frontend
npm install
```

### 3. Run the App

```bash
npm run app         # Start the Expo dev server
npm run dev         # Start development in terminal
```

### 4. Clearing Cache

```bash
expo start --clear
rm -rf node_modules package-lock.json
npm install
```

### 5. Recommended VS Code Setup

* **Extensions**: ESLint, Prettier, React Native Tools, TS Importer, Bracket Pair Colorizer
* **.vscode/settings.json**:

```json
{
  "editor.formatOnSave": true,
  "eslint.validate": ["javascript", "typescript", "typescriptreact"],
  "files.exclude": {"**/node_modules": true}
}
```

---

## 🚀 Deployment

```bash
expo build --platform all --release-channel production
```

Configure `app.json` for Android/iOS (bundle IDs, icons, permissions, etc).

---

## 🤝 Contributing

* **Git Flow**: feature branches, Conventional Commits
* **PR Guidelines**: lint/typecheck/tests, security review, documentation
* **Code Review**: boundaries, strict TS, error recovery, performance

---

## 📞 Support

* GitHub Issues/Discussions
* In-app DevTools
* Inline JSdoc references
* Analytics & crash dashboards

---

## ⚖️ Roadmap & Known Issues

**Current Work:**

* Mobile crash validation
* Offline-first improvements
* WebSocket live stock updates
* Advanced analytics dashboards

**Upcoming Releases:**

* Dark Mode
* Predictive insights & reorder automation
* Barcode scanner + automation
* i18n (internationalization)
* Collaborative roles (Q4+)

---
