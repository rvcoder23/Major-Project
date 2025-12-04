-- Enhanced Housekeeping Schema for Taj Hotel Standards (Fixed Version)
-- This version doesn't require foreign key constraints to avoid relationship cache issues

-- Create housekeeping_staff table FIRST
CREATE TABLE IF NOT EXISTS housekeeping_staff (
    id SERIAL PRIMARY KEY,
    staff_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    phone_number VARCHAR(15),
    email VARCHAR(100),
    designation VARCHAR(50) DEFAULT 'Housekeeping Staff',
    shift VARCHAR(20) DEFAULT 'Day',
    status VARCHAR(20) DEFAULT 'Active',
    specialization VARCHAR(100),
    performance_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create housekeeping_checklist_template table
CREATE TABLE IF NOT EXISTS housekeeping_checklist_template (
    id SERIAL PRIMARY KEY,
    task_type VARCHAR(50) NOT NULL,
    checklist_items JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update housekeeping table with comprehensive fields
ALTER TABLE housekeeping 
ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'Regular Cleaning',
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS assigned_staff_id INTEGER,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS actual_duration INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS supervisor_notes TEXT,
ADD COLUMN IF NOT EXISTS inspection_status VARCHAR(20) DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS inspected_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS inspected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS due_time TIME,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) DEFAULT 'admin';

-- Insert default checklist templates (only if they don't exist)
INSERT INTO housekeeping_checklist_template (task_type, checklist_items) 
SELECT 'Regular Cleaning', '[
    {"item": "Make bed with fresh linen", "required": true},
    {"item": "Vacuum/mop floors", "required": true},
    {"item": "Clean bathroom (toilet, sink, shower)", "required": true},
    {"item": "Replace towels", "required": true},
    {"item": "Dust furniture and surfaces", "required": true},
    {"item": "Empty trash bins", "required": true},
    {"item": "Refill amenities (soap, shampoo, tissues)", "required": true},
    {"item": "Check and replace toiletries", "required": true},
    {"item": "Clean mirrors and windows", "required": false},
    {"item": "Check minibar inventory", "required": false}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM housekeeping_checklist_template WHERE task_type = 'Regular Cleaning');

INSERT INTO housekeeping_checklist_template (task_type, checklist_items) 
SELECT 'Deep Cleaning', '[
    {"item": "All regular cleaning tasks", "required": true},
    {"item": "Deep clean bathroom (scrub tiles, grout)", "required": true},
    {"item": "Clean air conditioning vents", "required": true},
    {"item": "Clean behind furniture", "required": true},
    {"item": "Shampoo carpets (if applicable)", "required": true},
    {"item": "Polish furniture and fixtures", "required": true},
    {"item": "Clean curtains/blinds", "required": true},
    {"item": "Inspect and report maintenance issues", "required": true},
    {"item": "Sanitize all surfaces", "required": true},
    {"item": "Check and clean balcony/terrace", "required": false}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM housekeeping_checklist_template WHERE task_type = 'Deep Cleaning');

INSERT INTO housekeeping_checklist_template (task_type, checklist_items) 
SELECT 'VIP Service', '[
    {"item": "All regular cleaning tasks (enhanced)", "required": true},
    {"item": "Fresh flower arrangement", "required": true},
    {"item": "Welcome amenities (fruit basket, chocolates)", "required": true},
    {"item": "Premium linen and bedding", "required": true},
    {"item": "Enhanced bathroom amenities", "required": true},
    {"item": "Turn-down service preparation", "required": true},
    {"item": "Spotless condition verification", "required": true},
    {"item": "Personalized welcome note", "required": false}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM housekeeping_checklist_template WHERE task_type = 'VIP Service');

INSERT INTO housekeeping_checklist_template (task_type, checklist_items) 
SELECT 'Maintenance', '[
    {"item": "Inspect room for maintenance issues", "required": true},
    {"item": "Test all electrical appliances", "required": true},
    {"item": "Check plumbing functionality", "required": true},
    {"item": "Inspect AC/heating system", "required": true},
    {"item": "Check door locks and security", "required": true},
    {"item": "Verify TV and entertainment systems", "required": true},
    {"item": "Report issues to maintenance department", "required": true},
    {"item": "Clean while maintaining room availability", "required": false}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM housekeeping_checklist_template WHERE task_type = 'Maintenance');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_housekeeping_status ON housekeeping(status);
CREATE INDEX IF NOT EXISTS idx_housekeeping_priority ON housekeeping(priority);
CREATE INDEX IF NOT EXISTS idx_housekeeping_task_type ON housekeeping(task_type);
CREATE INDEX IF NOT EXISTS idx_housekeeping_cleaning_date ON housekeeping(cleaning_date);
CREATE INDEX IF NOT EXISTS idx_housekeeping_staff_id ON housekeeping(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_inspection_status ON housekeeping(inspection_status);
CREATE INDEX IF NOT EXISTS idx_housekeeping_staff_status ON housekeeping_staff(status);

-- Insert sample staff data
INSERT INTO housekeeping_staff (staff_name, employee_id, phone_number, designation, shift, specialization) VALUES
('Priya Sharma', 'HK001', '9876543210', 'Housekeeping Supervisor', 'Day', 'Deep Cleaning, VIP Service'),
('Ramesh Kumar', 'HK002', '9876543211', 'Housekeeping Staff', 'Day', 'Regular Cleaning'),
('Sunita Devi', 'HK003', '9876543212', 'Housekeeping Staff', 'Day', 'Regular Cleaning, VIP Service'),
('Amit Singh', 'HK004', '9876543213', 'Housekeeping Staff', 'Night', 'Regular Cleaning, Maintenance'),
('Anita Mehta', 'HK005', '9876543214', 'Housekeeping Staff', 'Day', 'Regular Cleaning'),
('Vikram Reddy', 'HK006', '9876543215', 'Housekeeping Staff', 'Flexible', 'Deep Cleaning, Maintenance')
ON CONFLICT (employee_id) DO NOTHING;



