-- Create PostgreSQL database with PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('HQ', 'ANALYST_SOCMINT', 'ANALYST_SIGINT', 'ANALYST_HUMINT', 'OBSERVER')),
    clearance_level VARCHAR(20) DEFAULT 'UNCLASSIFIED',
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Entities table for intelligence objects (people, places, organizations)
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('PERSON', 'ORGANIZATION', 'LOCATION', 'VEHICLE', 'FACILITY', 'EQUIPMENT')),
    name VARCHAR(255) NOT NULL,
    attributes JSONB DEFAULT '{}',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    location GEOMETRY(POINT, 4326),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    classification VARCHAR(20) DEFAULT 'UNCLASSIFIED',
    is_validated BOOLEAN DEFAULT false
);

-- Events table for intelligence incidents
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    location GEOMETRY(POINT, 4326),
    area_of_interest GEOMETRY(POLYGON, 4326),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    sensitivity VARCHAR(20) DEFAULT 'UNCLASSIFIED',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW')),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table for analyst submissions
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('SOCMINT', 'SIGINT', 'HUMINT')),
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    location GEOMETRY(POINT, 4326),
    collection_time TIMESTAMP WITH TIME ZONE,
    submitted_by UUID REFERENCES users(id) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    classification VARCHAR(20) DEFAULT 'UNCLASSIFIED',
    reliability VARCHAR(10) CHECK (reliability IN ('A', 'B', 'C', 'D', 'E', 'F')),
    credibility VARCHAR(10) CHECK (credibility IN ('1', '2', '3', '4', '5', '6')),
    status VARCHAR(20) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'PROCESSING', 'FUSED', 'ARCHIVED'))
);

-- Decisions table for HQ approvals and actions
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_type VARCHAR(50) NOT NULL CHECK (decision_type IN ('APPROVE_EVENT', 'REJECT_EVENT', 'REQUEST_INFO', 'OPERATIONAL_DECISION')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    decision_maker UUID REFERENCES users(id) NOT NULL,
    related_event_id UUID REFERENCES events(id),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUPERSEDED', 'CANCELLED')),
    classification VARCHAR(20) DEFAULT 'UNCLASSIFIED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE
);

-- Junction table for event-entity relationships
CREATE TABLE event_entities (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    PRIMARY KEY (event_id, entity_id)
);

-- Fusion provenance table to track report merging
CREATE TABLE fusion_provenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    source_report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    fusion_algorithm VARCHAR(100),
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media attachments table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    classification VARCHAR(20) DEFAULT 'UNCLASSIFIED'
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Q&A communication table
CREATE TABLE qa_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id),
    questioner_id UUID REFERENCES users(id) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    answerer_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ANSWERED', 'CLOSED')),
    priority VARCHAR(10) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE
);
