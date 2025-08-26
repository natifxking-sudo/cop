-- Initial schema
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('HQ', 'ANALYST_SOCMINT', 'ANALYST_SIGINT', 'ANALYST_HUMINT', 'OBSERVER')),
    clearance_level VARCHAR(20) DEFAULT 'UNCLASSIFIED',
    password_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('PERSON', 'ORGANIZATION', 'LOCATION', 'VEHICLE', 'FACILITY', 'EQUIPMENT')),
    name VARCHAR(255) NOT NULL,
    attributes JSONB DEFAULT '{}',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    location GEOMETRY(POINT, 4326),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    classification VARCHAR(20) DEFAULT 'UNCLASSIFIED',
    is_validated BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    location GEOMETRY(POINT, 4326),
    area_of_interest GEOMETRY(POLYGON, 4326),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    sensitivity VARCHAR(20) DEFAULT 'UNCLASSIFIED',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW')),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('SOCMINT', 'SIGINT', 'HUMINT')),
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    location GEOMETRY(POINT, 4326),
    collection_time TIMESTAMPTZ,
    submitted_by UUID REFERENCES users(id) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    classification VARCHAR(20) DEFAULT 'UNCLASSIFIED',
    reliability VARCHAR(10) CHECK (reliability IN ('A', 'B', 'C', 'D', 'E', 'F')),
    credibility VARCHAR(10) CHECK (credibility IN ('1', '2', '3', '4', '5', '6')),
    status VARCHAR(20) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'PROCESSING', 'FUSED', 'ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS event_entities (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    PRIMARY KEY (event_id, entity_id)
);

CREATE TABLE IF NOT EXISTS fusion_provenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    source_report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    fusion_algorithm VARCHAR(100),
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    classification VARCHAR(20) DEFAULT 'UNCLASSIFIED'
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id),
    questioner_id UUID REFERENCES users(id) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    answerer_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ANSWERED', 'CLOSED')),
    priority VARCHAR(10) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    answered_at TIMESTAMPTZ
);