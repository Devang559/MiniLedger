# MiniLedger Frontend

React Native (TypeScript) frontend for the MiniLedger app. Tracks money lent to friends.

## Tech Stack

- **React Native** 0.88.0
- **TypeScript** 6.x
- **Zustand** 5.x (state management)
- **React Navigation** 7.x (native stack)

## Project Structure

```
Frontend/
├── package.json
├── tsconfig.json
├── app.json
├── App.tsx
├── index.js
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx        # Stack navigator (Splash → Login → Home → AddLoan)
    ├── screens/
    │   ├── SplashScreen.tsx         # App launch screen (1.5s delay)
    │   ├── LoginScreen.tsx          # Phone + OTP login flow
    │   ├── HomeScreen.tsx           # Summary card + loan list with overdue highlight
    │   └── AddLoanScreen.tsx        # Form to add a loan entry
    ├── components/
    │   ├── SummaryCard.tsx          # Total lent, repaid, overdue summary
    │   └── ThemeToggle.tsx          # Dark/Light mode toggle
    ├── store/
    │   ├── authStore.ts             # Zustand: auth state + OTP flow
    │   ├── loanStore.ts             # Zustand: loans + summary data
    │   └── themeStore.ts            # Zustand: dark/light theme
    ├── services/
    │   └── api.ts                   # API client (fetch wrapper)
    └── types/
        └── index.ts                 # Shared TypeScript interfaces
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start Metro bundler

```bash
npm start
```

### 3. Run on device/emulator

```bash
# Android
npm run android

# iOS
npm run ios
```

## Configuration

Update the API base URL in `src/services/api.ts` to point to your backend:

```ts
const API_BASE_URL = 'http://192.168.1.1:5000/api';  // Update IP for your network
```

For local development on the same machine, use `http://localhost:5000/api`.

## App Flow

1. **Splash Screen** — Shows app logo for 1.5 seconds, then redirects to Login or Home based on auth state
2. **Login Screen** — Enter phone number and username (digits only, max 10), send OTP (check server log for OTP), enter 6-digit OTP to verify
3. **Home Screen** — Summary card at top, list of loans with overdue entries highlighted in red, "+ Add Loan" button, dark/light theme toggle
4. **Add Loan Screen** — Form for friend's name, amount, and due date (ISO format)

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Metro bundler |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
