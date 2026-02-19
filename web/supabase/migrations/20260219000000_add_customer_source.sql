-- Add source column to customers table if not already present
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('whatsapp', 'instagram', 'email', 'phone', 'website', 'other', 'import'));
