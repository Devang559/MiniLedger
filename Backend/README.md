# MiniLedger Backend

A minimal Node.js + TypeScript + PostgreSQL backend for tracking money lent to friends.

## Tech Stack

- **Node.js** 22+
- **TypeScript** 5.x
- **Express** 4.x
- **PostgreSQL** (NeonDB)

## Project Structure

```
Backend/
├── package.json
├── tsconfig.json
├── .env
├── src/
│   ├── index.ts                  # Express server entry point
│   ├── config/
│   │   └── database.ts           # PostgreSQL connection pool (NeonDB)
│   ├── models/
│   │   ├── User.ts               # User interface
│   │   └── Loan.ts               # Loan + Summary + CreateLoanInput
│   ├── services/
│   │   ├── authService.ts        # Login + OTP verification logic
│   │   ├── loanService.ts        # Add / list / repaid loan logic
│   │   └── summaryService.ts     # Summary calculation logic
│   ├── routes/
│   │   ├── authRoutes.ts         # Auth API endpoints
│   │   ├── loanRoutes.ts         # Loan API endpoints
│   │   └── summaryRoutes.ts      # Summary API endpoint
│   ├── utils/
│   │   └── otpStore.ts           # In-memory OTP generation & verification
│   └── db/
│       └── schema.sql            # Database schema
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database schema

Apply the SQL in `src/db/schema.sql` to your NeonDB database:

```bash
psql $DATABASE_URL -f src/db/schema.sql
```

Or run it via any PostgreSQL client.

### 3. Configure environment

Copy `.env` (already populated with NeonDB credentials):

```
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_lEF3LXsRcM4B@ep-divine-butterfly-b3siek3o-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channelBinding=require
OTP_EXPIRY_MINUTES=5
```

### 4. Run the server (development)

```bash
npm run dev
```

### 5. Run the server (production)

```bash
npm run build
npm start
```

## API Endpoints

### Auth

| Method | Endpoint      | Body                                              | Description                          |
|--------|---------------|---------------------------------------------------|--------------------------------------|
| POST   | `/api/auth/login` | `{ phone_number, username? }`                  | Generates OTP (printed in server log) |
| POST   | `/api/auth/verify` | `{ phone_number, otp }`                         | Verifies OTP and returns user info   |

**OTP flow:** On login, a 6-digit OTP is generated and printed to the server log (mocked SMS). The OTP is stored in-memory and expires after 5 minutes. On verify, the OTP is checked, the user is created if not existing, a `summaries` table row is auto-created for the user, and a success response with user info is returned. The frontend persists the session for 5 minutes in AsyncStorage.

**Summary table:** A `summaries` table (one-to-one with `users`) is auto-updated whenever a loan is added or marked as repaid, keeping `total_lent`, `total_repaid`, `overdue_amount`, `overdue_count`, and `total_entries` in sync.

### Loans

| Method | Endpoint                  | Body                                        | Description                  |
|--------|---------------------------|---------------------------------------------|------------------------------|
| POST   | `/api/loans`              | `{ user_id, friend_name, amount, due_date }` | Add a new loan entry         |
| GET    | `/api/loans/:user_id`     | -                                            | List all loans for a user    |
| PUT    | `/api/loans/:loan_id/repaid` | -                                         | Mark a loan as repaid        |

### Summary

| Method | Endpoint                | Description                                  |
|--------|-------------------------|----------------------------------------------|
| GET    | `/api/summary/:user_id` | Returns total_lent, total_repaid, overdue_amount, overdue_count, total_entries |

## Example Usage

```bash
# 1. Login (generates OTP - check server log)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+1234567890","username":"Harsh"}'

# 2. Verify OTP
curl -X POST http://localhost:5000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+1234567890","otp":"123456"}'

# 3. Add a loan entry
curl -X POST http://localhost:5000/api/loans \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<USER_ID>","friend_name":"Alice","amount":1500,"due_date":"2026-11-01T10:00:00Z"}'

# 4. Mark loan as repaid
curl -X PUT http://localhost:5000/api/loans/<LOAN_ID>/repaid

# 5. Get summary
curl http://localhost:5000/api/summary/<USER_ID>
```
