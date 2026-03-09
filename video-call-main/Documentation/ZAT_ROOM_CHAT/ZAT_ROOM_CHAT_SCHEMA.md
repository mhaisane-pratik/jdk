Enterprise WhatsApp-Like Chat Application
PostgreSQL Database Schema

This document describes the complete PostgreSQL database schema for an Enterprise WhatsApp-like Chat-Only Application.
The system supports secure text and media-based messaging for organizations with full tenant isolation,
admin control, audit logging, and WhatsApp-style chat behavior.
Voice calls, video calls, and voice messages are intentionally excluded.


1. Companies (Tenant)

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);


2. Users

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    password_hash TEXT,
    role VARCHAR(20) CHECK (role IN ('ADMIN','USER')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);


3. User Presence

CREATE TABLE user_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP
);


4. Chats

CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    chat_type VARCHAR(20) CHECK (chat_type IN ('PRIVATE','GROUP')),
    chat_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);


5. Chat Participants

CREATE TABLE chat_participants (
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    PRIMARY KEY (chat_id, user_id)
);


6. Chat Controls

CREATE TABLE chat_controls (
    chat_id UUID PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
    is_chat_enabled BOOLEAN DEFAULT TRUE,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);


7. Messages

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) CHECK (message_type IN ('TEXT','IMAGE','FILE','VIDEO')),
    content TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size_kb INT,
    reply_to_message_id UUID REFERENCES messages(id),
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);


8. Message Status

CREATE TABLE message_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('SENT','DELIVERED','READ')),
    updated_at TIMESTAMP DEFAULT NOW()
);


9. Typing Status

CREATE TABLE typing_status (
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (chat_id, user_id)
);


10. Audit Logs

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    action TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


