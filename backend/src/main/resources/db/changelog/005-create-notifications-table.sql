-- Notifications and chat
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    metadata JSONB DEFAULT '{}',
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel VARCHAR(100) NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_config (key, value, description) VALUES
('fusion_confidence_threshold', '0.7', 'Minimum confidence score for automatic event fusion')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_time ON performance_metrics(metric_name, recorded_at);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);