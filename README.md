# MiniLedger

A full-stack app to track money lent to friends. Built with Node.js + TypeScript + PostgreSQL (backend) and React Native (frontend).

## Project Structure

```
MiniLedger/
├── Backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── README.md
│   └── src/
│       ├── index.ts              # Express server
│       ├── config/database.ts    # PostgreSQL connection (NeonDB)
│       ├── models/               # Entity interfaces
│       ├── services/             # Business logic (auth, loan, summary)
│       ├── routes/               # API endpoints
│       ├── utils/otpStore.ts     # Mock OTP (in-memory)
│       └── db/schema.sql         # Database schema
│
└── Frontend/
    ├── package.json
    ├── App.tsx                   # App entry (Splash → Login → Home → AddLoan)
    ├── src/
    │   ├── navigation/AppNavigator.tsx
    │   ├── screens/              # Splash, Login, Home, AddLoan
    │   ├── components/           # SummaryCard, ThemeToggle
    │   ├── store/                # Zustand (auth/session, loan, theme)
    │   ├── services/api.ts       # API client
    │   ├── utils/formatDate.ts   # Human-friendly due date helper
    │   └── types/index.ts
    └── README.md
```

## Quick Start

### Backend

#### 1. Set up environment variables

Copy the `.env.example` file and fill in your credentials:

```bash
cd Backend
cp .env.example .env
```

Edit `.env` with your PostgreSQL (NeonDB) credentials:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `5000` | No (defaults to 5000) |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require` | Yes |
| `OTP_EXPIRY_MINUTES` | OTP expiration time | `5` | No (defaults to 5) |

The project already ships with a pre-configured `.env` containing NeonDB credentials. You only need to edit it if you want to use your own database.

#### 2. Install and run

```bash
cd Backend
npm install
npm run dev        # starts on http://localhost:5000
```

### Frontend

There are two methods to run the frontend:

#### Method 1: USB-connected Device (Recommended for development)

1. Enable Developer Options on your Android device:
   - Go to **Settings → About phone → Build number** (tap 7 times)
2. Enable USB Debugging:
   - Go to **Settings → Developer Options → USB Debugging**
3. Enable USB Installation:
   - Go to **Settings → Developer Options → USB Installation**
4. Connect your device via USB
5. Reverse the Android port to access the local backend:
   ```bash
   adb reverse tcp:5000 tcp:5000
   ```
   This creates a tunnel so the mobile app can access `http://localhost:5000/api`.
6. Ensure the API URL is set to localhost in `Frontend/src/services/api.ts`:
   ```
   const API_BASE_URL = 'http://localhost:5000/api';
   ```
7. Run the app:
   ```bash
   cd Frontend
   npm install
   npx react-native run-android   # builds and installs the app
   npx react-native start          # starts Metro bundler
   ```

#### Method 2: APK (using network IP)

Use this method when not connected via USB. The mobile app connects to the backend over your local WiFi network.

1. Run the backend:
   ```bash
   cd Backend
   npm run dev
   ```
2. Find your computer's local IP address (both devices must be on the same WiFi network):
   ```bash
   # Windows:
   ipconfig
   # macOS/Linux:
   ifconfig | grep "inet "
   ```
3. Update the API URL in `Frontend/src/services/api.ts` to use your IP:
   ```
   const API_BASE_URL = 'http://192.168.1.100:5000/api';
   ```
   **Important:** Make sure to use your actual local IP address, not `192.168.1.1`.
4. Build and install the APK:
   ```bash
   cd Frontend
   npm install
   npx react-native run-android   # builds and installs the APK
   npx react-native start          # starts Metro bundler
   ```
   Or install a pre-built APK directly:
   ```bash
   adb install app-release.apk
   ```

**Note:** `localhost` only works when the device is connected via USB (with `adb reverse`). When using an APK over WiFi, you must use your computer's local IP address instead.

## Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Generate OTP (printed in server log) |
| POST | `/api/auth/verify` | Verify OTP, return user info |
| POST | `/api/loans` | Add a loan entry |
| GET | `/api/loans/:user_id` | List all loans for a user |
| PUT | `/api/loans/:loan_id/repaid` | Mark loan as repaid |
| PUT | `/api/loans/:loan_id/unrepaid` | Unmark loan as repaid |
| DELETE | `/api/loans/:loan_id` | Delete a loan entry |
| PUT | `/api/loans/:loan_id` | Update a loan entry |
| GET | `/api/summary/:user_id` | Get summary (total_lent, total_repaid, overdue_amount, overdue_count, total_entries) |

## Frontend Screens

| Screen | Description |
|--------|-------------|
| Splash | 💰 emoji logo, 1.5s delay, routes to Login or Home |
| Login | Country code picker (with flags), 10-digit phone validation, username (max 16 chars), OTP entry, verifies with backend |
| Home | Summary card with currency formatting, loan list with overdue/pending/repaid status badges, mark repaid / unmark repaid / delete actions, edit modal, dark/light theme toggle |
| AddLoan | Form with auto-comma amount input, locale-aware currency display, calendar date picker, friend name (max 16 chars), amount validation (min 10) |

## Features

**Authentication**
- Phone number login with country code picker (8 country options with flag emojis)
- Mock OTP (printed in server log), 5-min session persisted to AsyncStorage
- Phone number must be exactly 10 digits
- Username validation (max 16 characters, frontend + backend)

**Loans**
- Add loan entries (friend name, amount, due date)
- Full validation: name max 16 chars, amount minimum 10, due date required
- Auto-comma formatting on amount input (locale-aware grouping)
- Calendar date picker for easy date selection
- Currency localization based on selected country code (₹ for India, $ for US, £ for UK, € for EU, etc.)
- Mark loans as repaid directly from the loan list
- Unmark loans as repaid (undo repaid status)
- Delete loan entries with confirmation
- Edit existing loan entries

**Summary & Display**
- Summary table in DB (one-to-one with users), auto-updated on loan changes
- Summary: total lent, total repaid, overdue amount, overdue count (with locale currency)
- Overdue loans highlighted in red with ⚠︎ icon
- Status badges: ✓ Repaid, ⚠︎ Overdue, ⏳ Pending
- Human-friendly due dates ("Due today", "Overdue by 3 days", etc.)

**UI/UX**
- Dark/Light mode toggle (sun/moon logo icons, persisted across app restarts)
- Emoji icons throughout: 💰 (logo/summary), 📱 (phone), 👤 (name), 💵 (amount), 📅 (date), 🗑 (delete), ↩︎ (undo), ✓ (repaid/done)
- Empty/loading states with emoji indicators
- Error banner with dismiss button

**Tech**
- TypeScript strict mode, ESLint clean, Zustand for state management
