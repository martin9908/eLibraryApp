# eLibraryApp

A cross-platform digital library application built as a **pnpm monorepo**. Users can browse, borrow, and read eBooks across mobile (iOS/Android) and web platforms.

## Monorepo Structure

```
App.tsx, src/  — Mobile app (Expo 54 + React Native 0.81), lives at repo root
apps/
  web/        — Next.js 15 App Router web app
packages/
  types/      — Shared TypeScript types (Book, User, ApiResponse)
  theme/      — Shared design tokens and gradients
  ui/         — Shared React Native component library (stub)
functions/    — Firebase Cloud Functions
```

There is no bespoke API server on the critical path — the mobile and web apps talk to Firebase (Auth, Firestore, Cloud Functions) directly.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 11.9.0 — `npm install -g pnpm`
- Expo CLI — `pnpm add -g expo-cli` (for mobile development)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure Firebase

Copy `.env.example` to `.env` and fill in your Firebase project values:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

### 3. Run the apps

| App | Command | Notes |
|-----|---------|-------|
| Mobile | `pnpm start` | Opens Expo dev server |
| iOS | `pnpm ios` | Runs on iOS simulator |
| Android | `pnpm android` | Runs on Android emulator |
| Web | `pnpm web` | Next.js on localhost:3000 |
| Web (build) | `pnpm web:build` | Production build |
| Functions | `pnpm functions:serve` | Firebase emulator |
| Functions (deploy) | `pnpm functions:deploy` | Deploy to Firebase |
| Type check | `pnpm typecheck` | All workspaces |
| Lint | `pnpm lint` | Root ESLint |

## Mobile App (repo root)

Built with Expo 54 + React Navigation 7 + React Native Paper.

**Screens:** Home, Catalog, Explore, Book Detail, Reader, Borrow History, Account, Auth (Login/Register)

- Navigation: `src/navigation/AppNavigator.tsx`
- Screens: `src/screens/`
- Components follow atomic design: `src/components/{atoms,molecules,organisms,templates}`

### Running on device/simulator

```bash
# iOS simulator
pnpm ios

# Android emulator
pnpm android
```

Because `react-native-pdf` is a native module, a development build is required (not Expo Go):

```bash
npx expo prebuild
npx expo run:ios   # or run:android
```

## Web App (`apps/web`)

Built with Next.js 15 (App Router) + Firebase.

**Routes:** `/` (catalog), `/login`, `/register`, `/account`, `/catalog`

```bash
cd apps/web
pnpm dev
```

## Firebase / Firestore

Firestore is used for library data and borrow management:

- `books` collection — eBook metadata and available copy counts
- `borrowRecords` collection — active and historical borrow records

Current behavior:
- Reads books from the `books` collection
- Creates borrow records on checkout
- Decrements `books.availableCopies` during borrow
- Validates active borrow status before opening the reader

## Reactotron (Development)

Reactotron is enabled in development mode and auto-initializes from `App.tsx`.

1. Install and open the [Reactotron desktop app](https://github.com/infinitered/reactotron).
2. Start the mobile app with `pnpm start`.
3. Run on a simulator/device on the same network.
4. The app will appear in Reactotron as `eLibraryApp`.

## Shared Packages

| Package | Description |
|---------|-------------|
| `@elibrary/types` | Shared TypeScript interfaces — `Book`, `User`, `ApiResponse` |
| `@elibrary/theme` | Design tokens, color palette, gradients |
| `@elibrary/ui` | Shared React Native components |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo 54, React Native 0.81, React Navigation 7, React Native Paper |
| Web | Next.js 15, React 19 |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Package manager | pnpm 11.9.0 workspaces |
| Language | TypeScript (strict) |
