					ZAT Room

 1️⃣ Product Vision (What ZAT Room Is)
ZAT Room is a modular, embeddable meeting system that other applications (web / mobile / SaaS products) can integrate as:
In-app video meetings
Real-time whiteboard collaboration
Session chat
Recording + playback 
Session history & artifacts
👉 Think: “Meeting as a Service” (like Stripe for payments)

2️⃣ Core Design Principles
Principle
Explanation
Plug & Play
Easy SDK / API integration
Stateless Clients
All logic server-driven
Session-centric
Everything tied to a meeting session
Real-time First
Low latency collaboration
Artifact Driven
Meeting = video + chat + whiteboard
Scalable
Multi-tenant by default


3️⃣ High-Level Architecture Overview
Client Apps (Web / Mobile / Embedded SDK)
        |
        |  HTTPS + WebSocket + WebRT
        | API Gateway / Auth Layer
------------------------------------------------
|            Core ZAT Room Platform            |
------------------------------------------------
| Meeting Service    | Whiteboard Service |
| Chat Service         | Recording Service     |
| Participant Service  | Notification Service |
------------------------------------------------
        |
------------------------------------------------
| Media Layer (Real-time)                      |
| - WebRTC SFU                                 |
| - Media Recorder                            |
------------------------------------------------
        |
------------------------------------------------
| Storage Layer                               |
| - Object Storage (video, boards)            |
| - Database (metadata)                       |
------------------------------------------------

4️⃣ Major System Components (HLD Level)
🔐 1. Authentication & Tenant Layer
Purpose: Make ZAT Room usable inside other apps
OAuth / JWT
Tenant ID (per client app)
Role mapping (Host, Participant, Viewer)

Flow:
Client App → ZAT Auth → Token issued → SDK initialized

📅 2. Meeting Management Service
Responsibilities:
Schedule meeting
Generate meeting ID
Join / leave handling
Host privileges
Key Concepts:
Session ID (primary entity)
Role-based permissions

🎥 3. Video & Audio Service (WebRTC)
Technology: WebRTC + SFU (Selective Forwarding Unit)
Why SFU (not MCU):
Better scalability
Lower latency
Client-side decoding
Handles:
Audio/video streams
Screen sharing
Bandwidth adaptation

🧑‍🤝‍🧑 4. Participant & Presence Service
Tracks:
Who joined
Roles
Mic/camera state
Network quality
Publishes real-time presence events via WebSocket.

🧠 5. Whiteboard Collaboration Service (KEY FEATURE)
Architecture:
Canvas-based frontend
Event-based backend
How it works:
User Draws →
Whiteboard Event →
Broadcast via WebSocket →
Rendered on all clients
Whiteboard Events:
Draw
Erase
Move
Text
Pointer move
Cursor Labels:
Each cursor tagged with userId + displayName
Updated at high frequency (throttled)
Host Controls:
Read-only mode
Grant edit permission
Lock whiteboard



💬 6. Session Chat Service
Scope: Chat tied to a meeting session
Features:
Real-time messaging
Message persistence
Chat replay after meeting
Data binding:
Meeting ID → Chat Thread

🎬 7. Recording Service
Capabilities:
Record audio/video
Record screen share
Snapshot whiteboard events
Recording Types:
Full meeting recording
Whiteboard replay (vector-based)
Storage Output:
Video file (MP4)
Whiteboard JSON timeline
Chat log

🗂 8. Artifact Management Service
Purpose: Store & retrieve meeting outputs
Artifacts:
Recording link
Whiteboard file
Chat transcript
All artifacts linked to Session ID

5️⃣ Data Model (Conceptual – HLD)
Core Entities
Tenant
 └── Application
      └── Meetings
           ├── Participants
           ├── Chat Messages
           ├── Whiteboard Events
           └── Recordings

6️⃣ Meeting Flow (End-to-End)
🔁 Full Session Lifecycle
App schedules meeting
 ↓
ZAT creates session
 ↓
Users join (WebRTC)
 ↓
Chat + Video + Audio active
 ↓
Host enables whiteboard
 ↓
Whiteboard events synced
 ↓
Recording starts (optional)
 ↓
Meeting ends
 ↓
Artifacts stored
 ↓
Replay available

7️⃣ Whiteboard + Recording Association (Important)
Industry Best Practice:
Whiteboard is NOT stored as video
It is stored as event timeline
Benefits:
✔ Smaller size
✔ Replayable
✔ Editable
✔ Searchable
Replay Logic:
Load board →
Replay events by timestamp →
Sync with video timeline

8️⃣ Plug-and-Play Integration Model (Key USP)
Integration Options
1️⃣ JavaScript SDK
ZAT.init({
  tenantId,
  token,
  meetingId
})
2️⃣ REST APIs
Create meeting
Fetch recordings
Fetch whiteboards
Fetch chat history
3️⃣ Webhooks
Meeting started
Meeting ended
Recording ready

9️⃣ Security & Compliance (HLD Level)
End-to-end encryption (media)
Signed URLs for recordings
Tenant isolation
Role-based access
Audit logs

🔄 Failure & Recovery Design
Scenario
Handling
User disconnect
Auto rejoin
Host leaves
Host reassignment
Whiteboard crash
Event replay
Recording failure
Partial save


10️⃣ Scalability Strategy
Horizontal scaling (stateless services)
SFU auto-scaling
Region-based media servers
CDN for playback

11️⃣ Why This Design Works for Your Goal
✔ Embeddable in any app
✔ Teams-level collaboration
✔ Whiteboard + cursor identity
✔ Clean artifact separation
✔ Enterprise-ready architecture



📌 Final One-Line Summary
ZAT Room is a session-centric, real-time collaboration platform that provides video, chat, whiteboard, and recording as modular services embeddable into any application.

 

#Integration of ZAT Room to Any Application


1️⃣ Platform Modes (Very Important Design Decision)
🔹 Mode A: Standalone Product (Like Teams)
Web App: meet.primezat.com
Mobile Apps (later)
Users:
Create account
Schedule meetings
Join meetings
View recordings
Manage whiteboards & chats
👉 This mode uses internal APIs

🔹 Mode B: Embedded / SDK Mode (Your Core USP)
Used inside:
LMS platforms
SaaS dashboards
Internal company apps
Telehealth apps
EdTech platforms
👉 These apps don’t manage video logic themselves
👉 They just embed PrimeZAT

2️⃣ What You Must Build at Platform Level
🧱 Mandatory Platform Capabilities
Layer
Required
Auth
OAuth / JWT / API keys
Tenant Mgmt
Multi-tenant isolation
Meeting Engine
Session-based
Media Layer
WebRTC SFU
Whiteboard
Real-time canvas
Recording
Media + event-based
Artifact Storage
Video, board, chat
SDKs
JS, React, iFrame
APIs
REST + WebSocket
Webhooks
Event callbacks



3️⃣ SDK Integration – HOW Other Apps Use PrimeZAT
🔑 Step 1: Client App Registration
Other app registers on PrimeZAT Admin Portal.
They get:
tenant_id
client_id
client_secret
Allowed domains
Webhook URL

🔑 Step 2: Authentication Flow (Secure)
Backend-to-Backend (Recommended)
Client App Backend → PrimeZAT Auth API → JWT Token
Token contains:
tenantId
userId
role
expiry

🔌 Step 3: SDK Initialization (Frontend)
PrimeZAT.init({
  token,
  meetingId,
  user: {
    id: "u123",
    name: "Rahul",
    role: "host"
  },
  config: {
    whiteboard: true,
    recording: true
  }
});

📌 SDK internally:
Connects WebRTC
Opens WebSocket
Syncs whiteboard
Handles chat



4️⃣ SDK Types You Should Provide (Industry Standard)
1️⃣ JavaScript SDK (Primary)
Used in:
React
Angular
Vue
Plain JS
2️⃣ React SDK
<PrimeZATMeeting /> component
Controlled props
Event listeners
3️⃣ iFrame Embed (Quick Integration)
<iframe src="https://meet.primezat.com/join/xyz" />
📌 Limited control, fast adoption

5️⃣ API Layer – What APIs Are Needed
🧩 Core REST APIs
API
Purpose
Create Meeting
Schedule / instant
Join Meeting
Token-based
End Meeting
Host control
Get Recordings
Playback
Get Whiteboards
Replay
Get Chat History
Session logs


⚡ WebSocket APIs
Chat messages
Whiteboard events
Cursor updates
Participant presence

6️⃣ Webhooks (VERY IMPORTANT for SDK Clients)
Clients need events like:
{
  "event": "meeting.ended",
  "meetingId": "abc123",
  "recordingAvailable": true
}
Events:
meeting.started
meeting.ended
recording.ready
participant.joined


7️⃣ Whiteboard in SDK Mode (Special Handling)
Whiteboard rendered inside SDK container
Cursor names passed from client app
Permissions controlled by host
Events stored server-side
📌 Replay independent of video

8️⃣ Recording + Artifact Access (SDK Clients)
Client app can:
Embed recording player
Fetch whiteboard replay
Download chat transcript
GET /api/meetings/{id}/artifacts

9️⃣ Standalone App – How PrimeZAT Works Like Teams
Features:
User login
Personal meeting room
Team meetings
Scheduled sessions
History & recordings
Whiteboard & chat
Difference:
❌ No SDK needed
✔ Uses same backend services
👉 Same system, two faces

10️⃣ Architecture Trick (How Companies Do This)
Standalone App
     ↓
  PrimeZAT APIs
     ↑
SDK / Client Apps
✔ Same backend
✔ Same services
✔ Different consumption layer

11️⃣ Permission & Role Model (Critical)
Role
Capabilities
Host
Start, record, whiteboard control
Co-host
Assist
Participant
Join, chat
Viewer
Read-only


12️⃣ Billing & Usage (Future-Ready)
Track:
Minutes used
Participants count
Storage used
Whiteboard events
Expose via API to clients.

13️⃣ Why This Design Scales
✔ Easy integration
✔ Low adoption friction
✔ No vendor lock-in for clients
✔ Teams-like + SDK power
✔ Clear separation of concerns

14️⃣ One-Line Summary
PrimeZAT is a dual-mode collaboration platform: a full meeting app for users and a plug-and-play SDK for developers.





