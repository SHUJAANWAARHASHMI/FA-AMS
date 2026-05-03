-- FA-AMS Supabase Schema

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    department TEXT NOT NULL,
    campus TEXT NOT NULL, -- 'Main Campus' | 'Johar Campus' | 'Masjid Campus' | 'Maktab Campus'
    status TEXT NOT NULL, -- 'full_time' | 'part_time'
    shift_start TEXT NOT NULL,
    shift_end TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    account_locked BOOLEAN DEFAULT false,
    leaves_annual_total INTEGER DEFAULT 20,
    leaves_annual_used INTEGER DEFAULT 0,
    leaves_casual_total INTEGER DEFAULT 10,
    leaves_casual_used INTEGER DEFAULT 0,
    leaves_medical_total INTEGER DEFAULT 8,
    leaves_medical_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    time_in TEXT,
    time_out TEXT,
    late_hours NUMERIC DEFAULT 0,
    overtime NUMERIC DEFAULT 0,
    on_time BOOLEAN DEFAULT true,
    status TEXT NOT NULL, -- 'Present' | 'Late' | 'Absent' | 'Holiday' | 'Leave'
    remarks TEXT,
    UNIQUE(employee_id, date)
);

-- 3. Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'Annual' | 'Casual' | 'Medical'
    from_date TEXT NOT NULL,
    to_date TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending', -- 'Pending' | 'Approved' | 'Rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Performance Reviews Table
CREATE TABLE IF NOT EXISTS performance_reviews (
    id BIGSERIAL PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    campus TEXT NOT NULL, -- CampusCode | 'all'
    role TEXT NOT NULL, -- 'admin' | 'mudeer' | 'user'
    account_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Migration for existing tables
DO $$ 
BEGIN 
    -- admin_users updates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='id') THEN
        ALTER TABLE admin_users ADD COLUMN id TEXT;
        UPDATE admin_users 
        SET id = sub.new_id
        FROM (
            SELECT username, 'USR' || lpad((row_number() over (order by username))::text, 3, '0') as new_id
            FROM admin_users
        ) sub
        WHERE admin_users.username = sub.username;
        -- Note: Setting PRIMARY KEY requires dropping the old one if it was username
        -- ALTER TABLE admin_users DROP CONSTRAINT admin_users_pkey;
        -- ALTER TABLE admin_users ADD PRIMARY KEY (id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='email') THEN
        ALTER TABLE admin_users ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='account_locked') THEN
        ALTER TABLE admin_users ADD COLUMN account_locked BOOLEAN DEFAULT false;
    END IF;

    -- employees updates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='account_locked') THEN
        ALTER TABLE employees ADD COLUMN account_locked BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Enable RLS (Optional but recommended)
-- For this demo, we'll keep it simple, but in production you'd add policies.
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Creating public access policies (for development simplicity)
CREATE POLICY "Public full access" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON leave_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON performance_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON admin_users FOR ALL USING (true) WITH CHECK (true);
