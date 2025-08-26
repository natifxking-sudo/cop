-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('HQ', 'ANALYST_SOCMINT', 'ANALYST_SIGINT', 'ANALYST_HUMINT', 'OBSERVER');
CREATE TYPE clearance_level AS ENUM ('UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET');
CREATE TYPE intelligence_type AS ENUM ('SOCMINT', 'SIGINT', 'HUMINT');
CREATE TYPE report_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE event_type AS ENUM ('PERSON', 'VEHICLE', 'LOCATION', 'COMMUNICATION', 'ACTIVITY', 'THREAT');
CREATE TYPE decision_type AS ENUM ('REPORT_APPROVAL', 'EVENT_APPROVAL', 'OPERATIONAL', 'STRATEGIC');
CREATE TYPE decision_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DEFERRED');
CREATE TYPE notification_type AS ENUM ('NEW_REPORT', 'REPORT_APPROVED', 'REPORT_REJECTED', 'NEW_EVENT', 'DECISION_REQUIRED', 'SYSTEM_ALERT');
CREATE TYPE notification_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role user_role NOT NULL,
    clearance_level clearance_level NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intelligence Reports table
CREATE TABLE intelligence_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    intelligence_type intelligence_type NOT NULL,
    classification clearance_level NOT NULL,
    status report_status DEFAULT 'DRAFT',
    location GEOMETRY(POINT, 4326),
    location_description TEXT,
    source_reliability INTEGER CHECK (source_reliability >= 1 AND source_reliability <= 5),
    information_credibility INTEGER CHECK (information_credibility >= 1 AND information_credibility <= 5),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    tags TEXT[],
    metadata JSONB,
    submitted_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Attachments table
CREATE TABLE report_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES intelligence_reports(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    classification clearance_level NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fused Events table
CREATE TABLE fused_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_type event_type NOT NULL,
    classification clearance_level NOT NULL,
    location GEOMETRY(POINT, 4326),
    location_description TEXT,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    tags TEXT[],
    metadata JSONB,
    fusion_algorithm VARCHAR(100),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fusion Sources table (linking reports to fused events)
CREATE TABLE fusion_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fused_event_id UUID REFERENCES fused_events(id) ON DELETE CASCADE,
    report_id UUID REFERENCES intelligence_reports(id) ON DELETE CASCADE,
    weight DECIMAL(3,2) CHECK (weight >= 0 AND weight <= 1),
    contribution_score DECIMAL(3,2) CHECK (contribution_score >= 0 AND contribution_score <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fused_event_id, report_id)
);

-- Decisions table
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    decision_type decision_type NOT NULL,
    status decision_status DEFAULT 'PENDING',
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    classification clearance_level NOT NULL,
    related_report_id UUID REFERENCES intelligence_reports(id),
    related_event_id UUID REFERENCES fused_events(id),
    requested_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    decided_by UUID REFERENCES users(id),
    decision_outcome TEXT,
    reasoning TEXT,
    deadline TIMESTAMP,
    decided_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Decision Comments table
CREATE TABLE decision_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Decision Attachments table
CREATE TABLE decision_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type NOT NULL,
    priority notification_priority DEFAULT 'MEDIUM',
    is_read BOOLEAN DEFAULT false,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    metadata JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_intelligence_reports_location ON intelligence_reports USING GIST(location);
CREATE INDEX idx_intelligence_reports_submitted_by ON intelligence_reports(submitted_by);
CREATE INDEX idx_intelligence_reports_status ON intelligence_reports(status);
CREATE INDEX idx_intelligence_reports_intelligence_type ON intelligence_reports(intelligence_type);
CREATE INDEX idx_intelligence_reports_classification ON intelligence_reports(classification);
CREATE INDEX idx_intelligence_reports_created_at ON intelligence_reports(created_at);

CREATE INDEX idx_fused_events_location ON fused_events USING GIST(location);
CREATE INDEX idx_fused_events_event_type ON fused_events(event_type);
CREATE INDEX idx_fused_events_classification ON fused_events(classification);
CREATE INDEX idx_fused_events_created_at ON fused_events(created_at);

CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_decisions_decision_type ON decisions(decision_type);
CREATE INDEX idx_decisions_assigned_to ON decisions(assigned_to);
CREATE INDEX idx_decisions_created_at ON decisions(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
