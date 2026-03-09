PART 1️⃣ — STANDALONE SYSTEM FLOW (Like Teams / Meet)
1. Standalone User Journey (High-Level)
User Login
 ↓
Dashboard
 ↓
Create / Schedule Meeting
 ↓
Join Meeting
 ↓
Meeting Room (Video + Chat + Whiteboard)
 ↓
End Meeting
 ↓
Recording & Whiteboard Access


2. Standalone Frontend Sections & Menus
🔹 A. Public Pages
Landing page


Pricing


Features


Login / Signup




🔹 B. Auth Screens
Forms needed
Login (email + password)


Signup


Forgot password


OTP / email verification



🔹 C. Main App Layout (After Login)
Sidebar / Top Nav
Dashboard


Meetings


Recordings


Whiteboards


Calendar


Settings


Logout

🔹 D. Dashboard Screen
Shows:
Upcoming meetings


Recent meetings


Quick “Start Meeting”


Stats (minutes used, meetings count)



🔹 E. Create / Schedule Meeting (FORM)
Inputs
Meeting title


Date & time


Duration


Host


Enable recording (yes/no)


Enable whiteboard (yes/no)


Invite participants (email / link)


Output
Meeting ID


Join link



🔹 F. Join Meeting Screen
Ways to join:
Join via link


Join via meeting ID + name


Camera & mic preview



🔹 G. Meeting Room UI (Core UI)
Sections
Video grid


Controls bar:


Mic / Camera


Screen share


Chat


Whiteboard


Record


Participants


Leave


Whiteboard UI
Canvas


Tools (pen, text, erase)


Cursor with user name


Host permission toggle



🔹 H. Post-Meeting Screens
Recording list


Whiteboard replay


Chat transcript



PART 2️⃣ — SDK MODE (FOR OTHER APPLICATIONS)
This is your main business value.

1. SDK Usage Philosophy (Very Important)
Client apps DO NOT build meeting UI
 👉 ZAT Room provides the meeting UI
Client apps:
Schedule meeting via API


Embed meeting UI via SDK / iframe


Fetch artifacts via API



2. SDK Integration Flow (Client App)
Client App Backend
   ↓
Create Meeting via ZAT Room API
   ↓
Receive meetingId + join token
   ↓
Frontend initializes ZAT Room SDK
   ↓
ZAT Room renders full meeting UI



3. SDK Types You Provide
✅ Option 1: JS SDK (Recommended)
ZAT Room.init({
  token,
  meetingId,
  user: {
    id: "u1",
    name: "Ashish",
    role: "host"
  }
});

✔ Full UI provided
 ✔ Fast adoption

✅ Option 2: React SDK
<ZAT RoomMeeting
  token={token}
  meetingId={id}
/>


✅ Option 3: iFrame (Quickest)
<iframe src="https://meet.primezat.com/join/xyz" />

❌ Less control
 ✔ Fastest



4. SDK: Who Controls UI?
Feature
Who Controls
Video UI
ZAT Room
Whiteboard UI
ZAT Room
Chat UI
ZAT Room
Layout
ZAT Room
Branding
Limited client config

📌 Clients do not rebuild video UI.

PART 3️⃣ — TENANT (CLIENT COMPANY) UI FLOW
1. Tenant Admin Portal (For SDK Users)
🔹 Tenant Dashboard
Total meetings


Minutes used


Active users


Storage usage



🔹 API & SDK Settings
Client ID


Client Secret


Token expiry


Allowed domains


SDK keys



🔹 Meeting Management
Create meeting


View meetings


Join as host


Cancel meetings



🔹 Recordings & Artifacts
Recording list


Whiteboard replays


Chat logs


Download / embed links



🔹 Webhooks Configuration
Add webhook URL


Select events:


meeting.started


meeting.ended


recording.ready



🔹 Team Management
Add users


Assign roles


Usage limits



PART 4️⃣ — HOW CLIENT APPS USE DATA
1. Create Meeting (Backend)
POST /api/meetings

Returns:
meetingId


joinUrl


token



2. Join Meeting (Frontend)
SDK loads full UI.

3. Get Participants (API)
GET /api/meetings/{id}/participants

Used for:
Attendance


Analytics


LMS tracking



4. After Meeting – Access Artifacts
GET /api/meetings/{id}/artifacts

Returns:
Recording URL


Whiteboard replay


Chat transcript



PART 5️⃣ — SUPER ADMIN (ZAT Room INTERNAL)
Admin Portal Sections
🔐 Tenant Management
Register tenant


Suspend / activate


Set usage limits



📦 SDK & API Control
API usage


Rate limits


Token stats


Error logs



🎥 Meeting Analytics
Active meetings


Concurrent users


SFU health



💰 Billing (Later)
Usage per tenant


Minutes billed


Storage billed





🔍 Monitoring
Logs


Alerts


Webhook failures



WHO BUILDS FRONTEND UI?
Case
UI Provided
Standalone app
ZAT Room
SDK clients
ZAT Room
Client custom UI
❌ Not required

👉 This reduces SDK complexity massively

FINAL SYSTEM TRUTH (Very Important)
ZAT Room owns the meeting experience.
 Client apps only integrate, schedule, embed, and consume data.

