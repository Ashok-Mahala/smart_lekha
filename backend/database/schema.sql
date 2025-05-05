-- Create enum types
CREATE TYPE student_status AS ENUM ('active', 'pending', 'suspended', 'inactive', 'graduated', 'on_leave');
CREATE TYPE student_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE student_gender AS ENUM ('male', 'female', 'other');

-- Create students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    registered_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status student_status NOT NULL DEFAULT 'pending',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    photo_url VARCHAR(255),
    id_proof_url VARCHAR(255),
    bookings_count INTEGER DEFAULT 0,
    violations_count INTEGER DEFAULT 0,
    phone VARCHAR(15) NOT NULL,
    address VARCHAR(200) NOT NULL,
    priority student_priority NOT NULL DEFAULT 'medium',
    notes TEXT,
    seat_number VARCHAR(10),
    due_date TIMESTAMP WITH TIME ZONE,
    father_name VARCHAR(100),
    student_id VARCHAR(20) UNIQUE,
    shift VARCHAR(20),
    admission_date DATE,
    date_of_birth DATE,
    gender student_gender,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(6),
    whatsapp VARCHAR(15),
    course VARCHAR(100),
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(50),
    id_proof_front_url VARCHAR(255),
    id_proof_back_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_phone ON students(phone);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_seat_number ON students(seat_number);

-- Create bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create violations table
CREATE TABLE violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_violations_updated_at
    BEFORE UPDATE ON violations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views
CREATE VIEW student_stats AS
SELECT 
    COUNT(*) as total_students,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_students,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_students,
    SUM(bookings_count) as total_bookings,
    SUM(violations_count) as total_violations,
    COALESCE(SUM(p.amount), 0) as total_dues
FROM students s
LEFT JOIN payments p ON s.id = p.student_id AND p.status = 'pending'; 