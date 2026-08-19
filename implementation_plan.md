# Replace Supabase with Custom Backend and JWT Authentication

This document outlines the strategy to completely remove Supabase from the `SyncSpace` project, migrating to a fully custom backend using standard PostgreSQL, custom JWT authentication, custom file storage, and WebSockets.

## Background & Scope
Currently, the application heavily relies on Supabase for four major pillars:
1. **Authentication**: (`@supabase/ssr`, `supabase-js`) handles user sessions, OAuth, email confirmation, and password hashing.
2. **Database**: Hosted PostgreSQL with Row Level Security (RLS).
3. **Storage**: Supabase Storage buckets for avatars, workspace logos, and banner images.
4. **Realtime**: Supabase Realtime channels used by Quill editor for live multi-player collaboration.

Removing Supabase requires rewriting all four pillars with custom open-source alternatives.

## Proposed Stack Alternatives

| Feature | Current Supabase Stack | Proposed Custom Stack |
| :--- | :--- | :--- |
| **Database** | Supabase Postgres (with RLS) | Any standard PostgreSQL database. Drizzle ORM remains the query engine. Authorization checks will be manually enforced in Server Actions instead of RLS. |
| **Authentication** | Supabase GoTrue | **Custom JWT implementation** using the `jose` library and HTTP-only cookies, paired with `bcrypt` for password hashing. |
| **Storage** | Supabase Storage Buckets | **Local File System** (e.g. `public/uploads`) for development, or **UploadThing / AWS S3** for production. |
| **Realtime** | Supabase Realtime Channels | **Socket.io** custom server for live cursors and document synchronization. |

> [!WARNING]
> Completely removing Supabase is a massive architectural shift. It will require rewriting the Quill multi-player provider, all `src/lib/server-action/auth-actions.ts`, global auth contexts, and `middleware.ts`. 

## Open Questions
1. **File Storage**: Do you prefer saving uploaded images locally in the project (`public/uploads`) or using an external provider like AWS S3 / UploadThing? 
2. **Realtime Server**: To support live collaboration on documents without Supabase, we will need to set up a custom `Socket.io` server. Are you comfortable running a secondary Node.js WebSocket server alongside Next.js?
3. **Social Logins**: Do you need OAuth (Google/GitHub login) supported in the custom JWT authentication, or just Email/Password?

## Phase 1: Authentication & Database Migration

### 1. Database Adjustments
- Remove all Supabase-specific triggers (`handle_new_user`, etc.).
- Update Drizzle schema (`src/lib/supabase/schema.ts`) to manage passwords. We will add a `password_hash` column to the `users` table since `auth.users` (Supabase) will no longer exist.
- Write standard SQL migrations to initialize the local DB.

### 2. Custom JWT Authentication
#### [NEW] `src/lib/auth/jwt.ts`
- Implement functions using `jose`:
  - `signToken(payload)`
  - `verifyToken(token)`
- Create login/signup logic hashing passwords with `bcryptjs`.

#### [MODIFY] `src/lib/server-action/auth-actions.ts`
- Rewrite `actionLoginUser` and `actionSignupUser` to query Drizzle directly, verify/hash passwords, generate a JWT, and set an HTTP-only cookie (`auth_token`).

#### [MODIFY] `src/middleware.ts`
- Replace `@supabase/ssr` with `jose` token verification.
- Read the `auth_token` cookie, verify the JWT, and protect `/dashboard` routes.

#### [MODIFY] `src/lib/providers/supabase-user-provider.tsx`
- Rename to `auth-provider.tsx`.
- Fetch user data from a new API route `/api/auth/me` that validates the JWT cookie, instead of relying on Supabase session state.

## Phase 2: Refactoring Data Fetching (No RLS)

#### [MODIFY] `src/lib/supabase/queries.ts`
- Currently, queries rely on Supabase's Row Level Security to limit data to the authenticated user.
- **Action**: Every query in `queries.ts` must be updated to explicitly filter by the authenticated `userId` extracted from the server-side JWT cookie.

## Phase 3: Replacing Supabase Storage

#### [NEW] `src/app/api/upload/route.ts`
- Create an API route to handle `multipart/form-data` uploads.
- Save files to a local directory or cloud bucket and return the public URL.

#### [MODIFY] `src/components/banner-upload/banner-upload-form.tsx`
- Refactor to POST files to our custom `/api/upload` route instead of `supabase.storage.from('file-banners').upload()`.

## Phase 4: Fixing Realtime Collaboration (Custom Next.js Server)

Currently, the app relies on Next.js API Routes (`/api/socket/io`) for Socket.io. However, Next.js 15 does not support WebSockets on API routes via `res.socket.server` (connections drop or fail to establish). To have true real-time syncing of text, cursors, and presence, we must run a Custom Next.js Server.

### User Review Required
We will need to change the `npm run dev` script to run our custom server instead of standard `next dev`. Please review and approve.

### Proposed Changes

#### [NEW] [server.mjs](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/server.mjs)
- Create a custom Next.js server entry point using Node's `http.createServer`.
- Attach `socket.io` to this HTTP server.
- Migrate all the Socket event listeners (`join-room`, `send-changes`, `send-cursor-move`, `presence-sync`) directly into this server file.

#### [DELETE] [io.ts](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/pages/api/socket/io.ts)
- This file is dead code in Next.js 15 and will be removed.

#### [MODIFY] [package.json](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/package.json)
- Update the `dev` script to run `node server.mjs`.
- Update the `start` script to run `NODE_ENV=production node server.mjs`.

---

## Phase 5: Real-time Metadata Sync (Banners, Icons, Titles)

Currently, changes to file metadata (like banners, icons, and titles) rely on Supabase Realtime (`postgres_changes`) which we broke when removing Supabase Authentication. We need to broadcast these changes via our new custom Socket.io server instead.

### User Review Required
Please review this approach. We will add a new global socket event for directory updates so all clients update instantly when a banner is uploaded.

### Proposed Changes

#### [MODIFY] [server.mjs](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/server.mjs)
- Add `socket.on("send-dir-update")` to broadcast metadata changes to all users in a workspace/room.

#### [MODIFY] [banner-upload-form.tsx](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/components/banner-upload/banner-upload-form.tsx)
- Import `useSocket`.
- Emit `send-dir-update` when a banner is successfully uploaded so other users receive the new `bannerUrl`.

#### [MODIFY] [quill-editor.tsx](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/components/quill-editor/quill-editor.tsx)
- Listen for `receive-dir-update` and call `dispatch()` to apply the changes instantly.
- Emit `send-dir-update` when the user changes the Title or Icon.

#### [DELETE] [use-supabase-realtime.tsx](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/lib/hooks/use-supabase-realtime.tsx)
- Remove the obsolete Supabase Realtime hook.

---

## Phase 6: UI Enhancements & Light Theme ("Little White")

Currently, the app relies heavily on dark mode and some hardcoded dark styling. To make the UI "better and a little white", we will implement a polished, premium Light Mode alongside a Theme Toggle, so you can switch seamlessly. We will also refine spacing, borders, and shadows to give the app a modern aesthetic.

### User Review Required
Please review the proposed design changes below.

### Open Questions
- Do you want to **completely force** Light Mode by default for all users, or should we respect their system preference while providing a toggle switch? 

### Proposed Changes

#### [MODIFY] [globals.css](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/app/globals.css)
- Update the `:root` (light mode) color palette to use a premium off-white background (e.g., `#fafafa`) with subtle grays for cards and borders.
- Improve typography contrast.

#### [NEW] [mode-toggle.tsx](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/components/global/mode-toggle.tsx)
- Create a new Theme Toggle switch component using `next-themes` and `lucide-react` icons (Sun/Moon).

#### [MODIFY] [sidebar.tsx](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/components/sidebar/sidebar.tsx)
- Integrate the `<ModeToggle />` into the sidebar's footer or user profile section.
- Clean up any hardcoded `dark:bg-*` classes to ensure the sidebar looks beautiful and frosty in Light Mode.

#### [MODIFY] [quill-editor.tsx](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/components/quill-editor/quill-editor.tsx)
- Enhance the Quill Toolbar to use a sleek glassmorphic effect in Light Mode.
- Improve the spacing and shadows of the editor container for a cleaner reading experience.

#### [MODIFY] [layout.tsx](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/app/layout.tsx)
- Adjust `<ThemeProvider>` to `defaultTheme="light"` so that new users see the white UI first.

---

## Phase 7: Editor UI Separation & Polish

Currently, the editor contents (title, emoji, and text area) sit on the plain page background, and the Quill toolbar stretches infinitely across the screen. To make it "better and separated" like premium modern editors (e.g., Notion or Google Docs), we will encapsulate the editor into a distinct, elevated "paper" layout.

### User Review Required
Please review the layout changes proposed below.

### Proposed Changes

#### [MODIFY] [quill-editor.tsx](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/components/quill-editor/quill-editor.tsx)
- Wrap the main editor content (Banner, Title block, and `#container` Quill area) in a centralized `div` that acts as a "Document Card".
- Apply classes: `max-w-[900px] w-full mx-auto bg-card shadow-md border rounded-xl overflow-hidden my-6`.
- Add internal padding to the card so the text breathes nicely.
- Keep the `Avatars` and `Save Badge` fixed to the very top right of the overall screen, outside the document card.

#### [MODIFY] [globals.css](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/app/globals.css)
- Change `.ql-toolbar` to remove `left-0 right-0` so it naturally fits the width of the new Document Card rather than spanning the entire screen.
- Adjust the `.ql-container` font sizes and padding to match the new paper layout.

---

## Phase 8: The "10/10" Killer Features

To elevate the project to a massive standout, we will implement the three major advanced features. Because of their scale, we will tackle them in three distinct parts to ensure stability.

### Part A: Integrated WebRTC Voice Chat
We will add voice communication directly into the document so collaborators can talk while editing.
- **`server.mjs`:** Add Socket.io signaling events (`webrtc-offer`, `webrtc-answer`, `ice-candidate`).
- **`voice-chat.tsx` (New):** A component that manages `RTCPeerConnection` for a mesh network of users in the room.
- **`quill-editor.tsx`:** Add a "Join Voice" button to the top bar.

### Part B: AI Ghost Collaborator
The AI will act as a live user in the room, getting its own cursor and typing out responses in real-time.
- **Open Question:** Do you have an OpenAI or Gemini API key we can use? If not, I can build the scaffolding and use a mock "delay" so it still visually functions like an AI typing.
- **`ai-assistant.tsx` (New):** A floating button/menu to trigger the AI.
- **Socket logic:** The server (or client) will generate a fake `cursorId` for the AI, join the room as "AI", and stream Quill Deltas (`send-changes`) chunk-by-chunk to simulate typing.

### Part C: Version History Playback (Time Travel)
We will capture the history of edits so users can scrub backward in time.
- **Database:** We will need to create a new Supabase table (e.g., `file_deltas`) to store every incremental OT change.
- **`time-travel-slider.tsx` (New):** A slider component that fetches the deltas and replays them sequentially into a read-only Quill instance.

## Verification Plan

### Automated Checks
- Run TypeScript compiler `npx tsc --noEmit` and `npm run lint` to ensure no `@supabase` imports remain in the entire codebase.

### Automated Tests
- Running simple tests locally.

### Manual Verification
- Testing sign-up to see if empty objects are prevented.
- Inspecting server logs to verify JWT cookies are issued.
- Opening dashboard to ensure database operations bypass RLS correctly.

---

# Phase 3: Move Collaboration Presence to Socket.io

Currently, the app uses a custom Socket.io server (`/api/socket/io`) for syncing document changes and cursors, but it still relies on `supabase.channel()` (Supabase Realtime) for user presence (showing avatars of who is in the room). Since we removed the Supabase authentication client, presence fails or behaves anonymously.

We will migrate presence fully to Socket.io to remove all dependencies on Supabase Realtime for collaboration.

## User Review Required
No major breaking changes; this just routes presence state through our existing Socket.io connection instead of Supabase websockets.

## Proposed Changes

### Next.js Backend (Socket.io)
We will add an in-memory tracker to the Socket.io handler to keep track of users connected to each room.

#### [MODIFY] [io.ts](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/pages/api/socket/io.ts)
- Maintain a dictionary mapping `roomId` to an object of `socket.id -> userDetails`.
- Replace the simple `create-room` listener with a `join-room` listener that accepts `fileId` and `userDetails`.
- When a user joins or disconnects, broadcast a `presence-sync` event containing the list of active users to everyone in that room.

### Next.js Frontend (Quill Editor)
We will modify the Quill editor to listen for `presence-sync` from Socket.io instead of `supabase.channel()`.

#### [MODIFY] [quill-editor.tsx](file:///c:/Users/raj07/Downloads/projects/NEWp/SyncSpace-master/SyncSpace-master/src/components/quill-editor/quill-editor.tsx)
- Remove `supabase.channel(fileId)` logic.
- Remove the standalone `create-room` socket emission.
- Instead, emit `join-room` with the `fileId` and the user's details (ID, email, avatar).
- Listen to `presence-sync` from Socket.io and update the `collaborators` state and local cursors.

## Verification Plan

### Manual Verification
- Open the document editor in two separate browser tabs (logged in as different users if possible).
- Verify that both users' avatars appear in the top-right corner.
- Verify that cursors show the correct names.
- **Workspace**: User can fetch only their workspaces.
- **Uploads**: Banner images successfully upload and render.
- **Realtime**: Two separate incognito windows can collaboratively edit the same document in real-time.
