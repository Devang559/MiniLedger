-- Drop tables if they exist (for clean re-deploy)
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS summaries;
DROP TABLE IF EXISTS users;

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    username VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Summaries Table (one-to-one with users)
CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    total_lent DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    total_repaid DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    overdue_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    overdue_count INTEGER DEFAULT 0 NOT NULL,
    total_entries INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Loans Table
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    friend_name VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_repaid BOOLEAN DEFAULT FALSE NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for faster summary queries per user
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_summaries_user_id ON summaries(user_id);
