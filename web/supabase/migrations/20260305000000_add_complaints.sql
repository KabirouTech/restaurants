-- Complaints / support tickets system
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    submitted_by UUID REFERENCES profiles(id) NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    audio_url TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_org ON complaints(organization_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created ON complaints(created_at DESC);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Users can read complaints from their own org
CREATE POLICY "users_read_own_org" ON complaints FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Users can insert complaints for their own org
CREATE POLICY "users_insert_own_org" ON complaints FOR INSERT
  WITH CHECK (auth.uid() = submitted_by
    AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
