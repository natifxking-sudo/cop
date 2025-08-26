-- Create indexes for performance optimization
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_location ON entities USING GIST(location);
CREATE INDEX idx_entities_confidence ON entities(confidence_score);
CREATE INDEX idx_entities_created_by ON entities(created_by);

CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_location ON events USING GIST(location);
CREATE INDEX idx_events_aoi ON events USING GIST(area_of_interest);
CREATE INDEX idx_events_time_range ON events(start_time, end_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_created_by ON events(created_by);

CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_submitted_by ON reports(submitted_by);
CREATE INDEX idx_reports_location ON reports USING GIST(location);
CREATE INDEX idx_reports_collection_time ON reports(collection_time);
CREATE INDEX idx_reports_status ON reports(status);

CREATE INDEX idx_decisions_type ON decisions(decision_type);
CREATE INDEX idx_decisions_maker ON decisions(decision_maker);
CREATE INDEX idx_decisions_event ON decisions(related_event_id);
CREATE INDEX idx_decisions_created_at ON decisions(created_at);

CREATE INDEX idx_fusion_event ON fusion_provenance(event_id);
CREATE INDEX idx_fusion_report ON fusion_provenance(source_report_id);

CREATE INDEX idx_attachments_report ON attachments(report_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

CREATE INDEX idx_qa_event ON qa_threads(event_id);
CREATE INDEX idx_qa_questioner ON qa_threads(questioner_id);
CREATE INDEX idx_qa_status ON qa_threads(status);
