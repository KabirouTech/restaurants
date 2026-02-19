-- Add notes and source columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('whatsapp', 'instagram', 'email', 'phone', 'website', 'other'));

-- Update RLS policies if necessary (assuming existing policies cover update/insert on new columns for authenticated users)
-- No changes needed for standard authenticated RLS if it's row-based on organization_id
