# SyncSpace - SDE Interview Preparation Guide

This document is your comprehensive study guide to defend, explain, and showcase your collaborative note-taking application (SyncSpace) during Software Development Engineer (SDE) interviews.

## 1. System Architecture & Design Choices

Interviewers will ask *why* you chose your stack. Never say "because I saw it in a tutorial." Defend your choices with engineering trade-offs.

### Next.js (App Router)
* **Why you chose it:** You needed a React framework that supports both Server-Side Rendering (SSR) for fast initial page loads/SEO and Client-Side Rendering (CSR) for the highly interactive rich-text editor. 
* **Design Choice:** Next.js provides built-in API routes, meaning you didn't have to spin up a completely separate Express.js server just to handle basic database queries or authentication.
* **Trade-off:** Next.js Server Actions and API routes are stateless. For persistent real-time connections (like multiple people typing at once), serverless functions fail because they close after a few seconds. This is why you had to introduce a custom Node.js/Socket.io server.

### Custom Authentication (JWT + Bcrypt)
* **Why you chose it:** Instead of relying on a managed identity provider like Supabase Auth or Clerk, you built a fully custom JWT-based authentication system from scratch using `bcryptjs` and HTTP-only cookies.
* **Design Choice (Auth):** You wanted full control over the user table schema (`public.users`) and the session lifecycle. By issuing your own JWTs via Next.js Server Actions (`actionLoginUser`), you eliminated the dependency on external auth services.
* **The Interview Flex:** Interviewers love candidates who understand how authentication actually works under the hood. You can confidently explain how your `middleware.ts` intercepts requests, extracts the `syncspace-auth` cookie, and verifies the JWT signature before allowing access to the `/dashboard`. You can also explain how `bcrypt` salts and hashes passwords to prevent rainbow-table attacks.
* **Trade-off:** Building custom auth means you are responsible for password resets, email verification, and session invalidation. However, for a portfolio project, this demonstrates a much deeper understanding of web security than just copy-pasting a NextAuth config.

### Supabase (PostgreSQL & Real-time)
* **Why you chose it:** You use Supabase purely as a managed PostgreSQL database (interacted with via Drizzle ORM) rather than a full Backend-as-a-Service. 
* **Trade-off:** Supabase has built-in real-time features, but they can be expensive and rate-limited for high-frequency events like a user typing 100 characters per minute. This justifies your decision to build a dedicated Socket.io WebSocket server for the editor, while using Supabase for the persistent "source of truth".

### Socket.io (Real-time Engine)
* **Why you chose it:** WebSockets provide a persistent, bi-directional connection between the client and server. 
* **Design Choice:** Socket.io natively supports "Rooms" (e.g., `socket.join(fileId)`). This meant you didn't have to manually manage which socket connections belonged to which document; Socket.io handles broadcasting to specific document rooms out-of-the-box.

---

## 2. Deep Dive Topics (What to Read & Master)

To confidently defend this project, you need deep knowledge in the following areas:

### A. Real-Time Collaboration (OT vs. CRDT)
* **What happens when two people type at the same time?** Your editor uses Quill.js, which uses **Deltas** (a form of Operational Transformation or OT). 
* **The Concept:** If User A inserts "X" at index 5, and User B inserts "Y" at index 5, the system must resolve the conflict. Quill Deltas (`retain`, `insert`, `delete`) allow the clients to merge these operations mathematically.
* **What to read:** Search for *"Operational Transformation explained"* and *"CRDTs vs OT"*. Knowing the difference between OT (Google Docs approach) and CRDTs (Figma/Linear approach) proves you are a senior-level thinker.

### B. React Rendering Lifecycle & Hooks
* **The Problem:** Real-time apps suffer from infinite rendering loops if not careful (which you experienced!). 
* **The Concept:** Understand exactly how `useEffect`, `useMemo`, and React Context work. Know the difference between a synchronous state update causing a `Maximum update depth exceeded` error versus an asynchronous memory leak.
* **What to read:** The official React documentation on *"Escape Hatches (useEffect)"* and *"Keeping Components Pure"*.

### C. WebSockets vs. HTTP Polling vs. Server-Sent Events (SSE)
* **The Concept:** Why didn't you just use `fetch()` every 1 second to check for new text? (Answer: HTTP overhead is massive, and polling wastes server resources). Why didn't you use SSE? (Answer: SSE is unidirectional from server to client, but collaborative editors require bi-directional data flow).
* **What to read:** Search for *"WebSockets vs Server-Sent Events vs Long-Polling"*.

---

## 3. Scalability (How to handle 10,000+ users)

If an interviewer asks, "How would you scale SyncSpace if it goes viral?", here is your roadmap:

### 1. Scaling the WebSocket Server (Redis Adapter)
* **Current State:** Your `server.mjs` runs on a single Node.js instance. If you get 100,000 users, one server will crash out of memory.
* **The Fix:** You would deploy 10 instances of your Node.js server behind a Load Balancer. However, if Alice connects to Server A, and Bob connects to Server B, they won't see each other's cursor! 
* **The Solution:** Use the **Socket.io Redis Adapter**. When Alice types, Server A publishes the event to Redis. Server B subscribes to Redis and forwards the event to Bob. **(Mentioning Redis Pub/Sub in an interview is a massive green flag).**

### 2. Database Connection Pooling
* **Current State:** Every time someone saves a document, you hit Supabase.
* **The Fix:** As traffic grows, PostgreSQL will run out of connections. You would introduce a connection pooler like **PgBouncer** (which Supabase supports) to multiplex thousands of client requests over a few database connections.

### 3. Debouncing & Throttling
* **Current State:** You already do this! You have an `850ms` debounce timer on saving.
* **Defend it:** Explain that writing to a database on every single keystroke is disastrous for database IOPS (Input/Output Operations Per Second). Your debounce function batches keystrokes and writes to the DB efficiently.

---

## 4. Technical Challenges to Talk About (Your "War Stories")

Interviewers always ask: *"Tell me about a difficult bug you solved."* Use the exact bugs we fixed:

### Story 1: The AI Concurrency Crash
**The Problem:** When multiple users requested the Google Gemini AI in the same document room, the asynchronous streams overlapped, corrupted the Quill Delta index, and crashed the server.
**The Solution:** I implemented a global `Set` on the Node.js backend to track active AI streams per document (`activeAiStreams.has(fileId)`). This acted as a Mutex lock, blocking concurrent AI requests for the same file while allowing different files to generate AI text simultaneously.

### Story 2: The React Infinite Rendering Loop
**The Problem:** Rapid typing triggered auto-saves, which updated the global Redux/Context state. This global update caused the sidebar (containing hundreds of mapped Radix UI Tooltips) to rapidly re-render, eventually hitting React's `Maximum update depth exceeded` error.
**The Solution:** I profiled the React component tree and realized nested `useEffect` hooks in the sidebar were reacting to their own dispatches. I fixed the dependency arrays, and hoisted the `TooltipProvider` to the root `layout.tsx` to prevent Radix UI's context managers from infinitely looping during rapid reconciliation.

### Story 3: Editor Mutation Observer Conflicts
**The Problem:** When the AI was typing, the multiplayer cursor component injected invisible HTML DOM nodes to show the pink cursor. Quill's internal `MutationObserver` saw these cursor nodes, got confused about the formatting boundaries, and started stripping the background color from the AI's text.
**The Solution:** I deep-dived into Quill's internal formatting engine and overrode the custom `AuthorBlot` class. I utilized CSS Variables (`var(--author-bg)`) to dynamically apply colors to the DOM without triggering Quill's built-in background Attributor, bypassing the conflict entirely.

---

## 5. Best Resources to Read/Watch

Spend a week reviewing these to make your knowledge bulletproof:

1. **System Design:**
   - *Grokking the System Design Interview* (Specifically the chapters on WebSockets and Chat applications).
   - YouTube: *Hussein Nasser* (Watch his videos on "WebSockets Crash Course" and "Redis Pub/Sub").
2. **React Deep Dive:**
   - *react.dev/learn* (Read the advanced sections on Refs and Effects).
   - YouTube: *Jack Herrington* (Look for his videos on React performance and useMemo/useEffect mistakes).
3. **Operational Transformation (OT):**
   - Video: *"Operational Transformation in real-time collaborative editing"* by the creators of Google Docs.
4. **Node.js Event Loop:**
   - You must understand how Node.js handles thousands of concurrent WebSocket connections despite being single-threaded. Read about the Node.js Event Loop and libuv.
