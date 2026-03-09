Requirement Gathering Document
Video Calling Application
1. Project Overview
The Video Calling Application is an enterprise-grade, secure, and highly scalable real-time communication platform designed for professional, training, and enterprise collaboration. It supports audio/video calls, screen sharing, real-time chat, recordings, collaborative tools, and advanced engagement features. The platform is self-hosted using WebRTC-based media servers such as Jitsi Video Bridge or Mediasoup to ensure full control over infrastructure, data privacy, compliance, and performance.
2. Objectives
• High-quality, low-latency audio and video communication
• Support 300–400 concurrent users per deployment
• Advanced collaboration tools (whiteboard, notes, engagement)
• Strong data privacy with self-hosted architecture
• Scalable and enterprise-ready communication platform
3. Stakeholders
Client Sponsor – Budget approval and strategic direction
IT / Infrastructure Team – Deployment, monitoring, and scaling
End Users – Employees, trainers, consultants, clients
Development Team – Design, development, testing, and support
4. User Roles
Super Admin – Infrastructure, analytics, and security governance
Admin / Host – Meeting control, moderation, and engagement tracking
Participant / User – Join meetings and collaborate
5. Functional Requirements – Participant
• Secure meeting join links
• Audio/video mute and unmute
• Screen sharing with presenter indicator
• Permission-based real-time chat
• Network health indicator (Green/Yellow/Red)
• Adaptive video quality
• Silent feedback reactions
• Collaborative notes
• Permission-based whiteboard access
6. Functional Requirements – Admin / Host
• Create, schedule, start, and end meetings
• Mute, remove, or restrict participants
• Enable/disable chat, notes, and whiteboard
• Grant view/edit whiteboard permissions
• Clear or reset whiteboard
• Secure meetings with passwords or waiting rooms
• View engagement analytics
• Manage recordings and exports
7. Functional Requirements – Super Admin
• Multi-tenant deployment
• Media server and TURN/STUN management
• System performance and usage analytics
• Recording storage and retention policies
• Global security and access control
8. Unique & Advanced Features
• Smart Join Assistant
• Live Focus Mode
• Adaptive video quality per participant
• Auto bandwidth saver
• Privacy blur zones
• Timeline-based chat
• Recording search
• Engagement score analytics
9. Whiteboard Feature (Permission-Based)
• Real-time collaborative whiteboard
• Drawing, text, shapes, and highlighting tools
• Host-controlled access
• View-only or edit permissions
• Real-time sync
• Secure storage and export
10. Non-Functional Requirements
• Latency below 300 ms
• Horizontal scalability
• DTLS-SRTP media encryption
• High availability and failover
• Responsive UI across devices
11. Technical Requirements
Frontend: React.js (WebRTC)
Backend: Node.js / Java Spring Boot
Media: Jitsi Video Bridge / Mediasoup
Database: PostgreSQL, Redis
Infrastructure: Docker, Kubernetes
TURN/STUN: Coturn
12. Assumptions
• Stable internet connectivity
• Modern WebRTC-supported browsers
• Properly sized infrastructure
13. Risks
• Performance impact during peak usage
• Network instability
• Security vulnerabilities
• Scaling challenges
14. Conclusion
This document provides a client-ready, presentation-focused requirement definition for the Video Calling Application. All changes must be reviewed and approved by stakeholders.



