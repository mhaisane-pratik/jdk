# Enterprise WhatsApp-Like Chat Application - Full Documentation

## Part 1: Requirements & Features

### 1. Purpose
The purpose of this application is to provide a secure, enterprise-grade WhatsApp-like chat platform for organizations.
The system supports real-time text and media messaging without voice calls, video calls, or voice messages.

### 2. Scope
**Included:**
- One-to-one chat
- Group chat
- Media and file sharing
- Message and group search
- Read / unread message tracking
- Admin controls
- Audit logs

**Excluded:**
- Voice calls
- Video calls
- Voice messages

### 3. User Roles
**Admin:**
- Manage users
- Control chat permissions
- View audit logs

**Group Admin:**
- Add/remove group members
- Assign group admins
- Change group name and icon
- Restrict media sharing
- View group activity

**User:**
- Send and receive messages
- Participate in group chats
- Manage own profile


### 4. Authentication & Access Control
- Company Code / Tenant ID
- Username and Password
- Role-based access
- OTP / MFA
- Optional SSO (future)

### 5. Chat Features
- Real-time messaging
- Message delivery status (Sent, Delivered, Read)
- Typing indicator
- Online / Offline / Last seen
- Unread message count per chat and group

### 6. Message Management
- Reply to messages
- Edit messages
- Delete messages (soft delete)
- Forward messages
- Search messages by keyword, sender, and date

### 7. Media & File Sharing
- Images
- Documents (PDF, DOC, XLS)
- Video file uploads (not live)

### 8. Admin Controls
- Enable / disable chat
- Block users
- Restrict file sharing
- Camera access for profile photos and image sharing

### 9. User Profile Management
- Profile photo
- Display name
- Status message
- Last seen visibility control
- Secure profile data storage

### 10. Audit & Compliance
- User activity logs
- Admin action logs
- Company data isolation

### 11. Non-Functional Requirements
- High performance
- Secure data handling
- Scalable architecture
- High availability

### 12. Technology Stack
- Frontend: Web (HTML, CSS, JavaScript)
- Backend: Express.js + WebSocket
- Database: PostgreSQL
- Authentication: JWT + OTP

---

## Part 2: PostgreSQL Database Schema

This section describes the complete PostgreSQL database schema for the Enterprise WhatsApp-like Chat-Only Application. The system supports secure text and media-based messaging for organizations with full tenant isolation, admin control, audit logging, and WhatsApp-style chat behavior. Voice calls, video calls, and voice messages are intentionally excluded.

### 1. Companies (Tenant)
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Users
```sql
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
```

### 3. User Presence
```sql
CREATE TABLE user_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP
);
```

### 4. Chats
```sql
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    chat_type VARCHAR(20) CHECK (chat_type IN ('PRIVATE','GROUP')),
    chat_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Chat Participants
```sql
CREATE TABLE chat_participants (
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    PRIMARY KEY (chat_id, user_id)
);
```

### 6. Chat Controls
```sql
CREATE TABLE chat_controls (
    chat_id UUID PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
    is_chat_enabled BOOLEAN DEFAULT TRUE,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7. Messages
```sql
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
```

### 8. Message Status
```sql
CREATE TABLE message_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('SENT','DELIVERED','READ')),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 9. Typing Status
```sql
CREATE TABLE typing_status (
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (chat_id, user_id)
);
```

### 10. Audit Logs
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    action TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```
