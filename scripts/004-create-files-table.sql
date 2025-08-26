-- Create files table for media storage
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    classification VARCHAR(20) NOT NULL DEFAULT 'UNCLASSIFIED',
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_id UUID REFERENCES reports(id),
    event_id UUID REFERENCES events(id),
    tags JSONB DEFAULT '[]',
    checksum VARCHAR(64) NOT NULL,
    s3_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_report_id ON files(report_id);
CREATE INDEX IF NOT EXISTS idx_files_event_id ON files(event_id);
CREATE INDEX IF NOT EXISTS idx_files_classification ON files(classification);
CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files(mime_type);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_files_updated_at();
