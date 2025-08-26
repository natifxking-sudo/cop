CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_submitted_by ON reports(submitted_by);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_reports_collection_time ON reports(collection_time);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);