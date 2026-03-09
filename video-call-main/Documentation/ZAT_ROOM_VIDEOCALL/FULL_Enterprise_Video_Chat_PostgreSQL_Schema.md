

     

==============================
COMPANIES
==============================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

==============================
USERS
==============================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    username VARCHAR(100),
    email VARCHAR(255),
    password_hash TEXT,
    role VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

==============================
USER PRESENCE
==============================
CREATE TABLE user_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    is_online BOOLEAN,
    last_seen TIMESTAMP
);

==============================
MEETINGS
==============================
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    host_id UUID REFERENCES users(id),
    title VARCHAR(255),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    timezone VARCHAR(50),
    status VARCHAR(20),
    is_recorded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

==============================
MEETING PARTICIPANTS
==============================
CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id),
    user_id UUID REFERENCES users(id),
    joined_at TIMESTAMP,
    left_at TIMESTAMP
);

==============================
SMART JOIN CHECKS
==============================
CREATE TABLE smart_join_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id),
    user_id UUID REFERENCES users(id),
    mic_available BOOLEAN,
    camera_available BOOLEAN,
    speaker_available BOOLEAN,
    network_quality VARCHAR(20),
    checked_at TIMESTAMP DEFAULT NOW()
);

==============================
NETWORK HEALTH LOGS
==============================
CREATE TABLE network_health_logs(
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
meeting_id UUID NOT NULL
        REFERENCES meetings(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    -- Core network metrics
    latency_ms INT,                 -- e.g. 50, 120, 300
    packet_loss_percent INT,        -- e.g. 0–100
    jitter_ms INT,                  -- variation in latency

    -- Network context
    bandwidth_kbps INT,             -- available bandwidth
    connection_type VARCHAR(20),    -- WIFI, MOBILE, ETHERNET

    -- Health indicator (UI-facing)
    health_status VARCHAR(10)
        CHECK (health_status IN ('GREEN','YELLOW','RED')),

    -- System-calculated score (optional analytics)
    quality_score INT               -- 0–100 (derived value)

    ,logged_at TIMESTAMP DEFAULT NOW()
);

==============================
CHATS
==============================
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    meeting_id UUID REFERENCES meetings(id),
    chat_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

==============================
CHAT PARTICIPANTS
==============================
CREATE TABLE chat_participants (
    chat_id UUID REFERENCES chats(id),
    user_id UUID REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (chat_id, user_id)
);

==============================
MESSAGES
==============================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id),
    sender_id UUID REFERENCES users(id),
    message_type VARCHAR(20),
    content TEXT,
    file_url TEXT,
    reply_to UUID REFERENCES messages(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

==============================
MESSAGE STATUS
==============================
CREATE TABLE message_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id),
    user_id UUID REFERENCES users(id),
    status VARCHAR(20),
    updated_at TIMESTAMP DEFAULT NOW()
);

==============================
WHITEBOARD
==============================
CREATE TABLE whiteboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id),
    data JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);

==============================
MEETING NOTES
==============================
CREATE TABLE meeting_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id),
    content TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

==============================
ENGAGEMENT SCORES
==============================
CREATE TABLE engagement_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id),
    user_id UUID REFERENCES users(id),
    speaking_time INT,
    chat_count INT,
    camera_on_time INT,
    score INT,
    calculated_at TIMESTAMP DEFAULT NOW()
);

==============================
RECORDINGS
==============================
CREATE TABLE meeting_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id),
    recording_url TEXT,
    duration_seconds INT,
    created_at TIMESTAMP DEFAULT NOW()
);

==============================
AUDIT LOGS
==============================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    action TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

