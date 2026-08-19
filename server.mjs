import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { Client } from "pg";
import { config } from "dotenv";
import { GoogleGenAI } from "@google/genai";

config({ path: ".env" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
});
dbClient.connect().catch(console.error);

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const rooms = {};
  const roomUsers = {};
  const activeAiStreams = new Set();

  const io = new Server(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    let currentRoom = null;

    socket.on("join-room", (fileId, userDetails) => {
      if (currentRoom) {
        socket.leave(currentRoom);
        if (roomUsers[currentRoom]) {
          delete roomUsers[currentRoom][socket.id];
          io.to(currentRoom).emit("presence-sync", Object.values(roomUsers[currentRoom]));
        }
      }

      socket.join(fileId);
      currentRoom = fileId;

      if (!roomUsers[fileId]) roomUsers[fileId] = {};
      if (userDetails) {
        roomUsers[fileId][socket.id] = { ...userDetails, socketId: socket.id };
      }

      io.to(fileId).emit("presence-sync", Object.values(roomUsers[fileId]));
    });

    socket.on("disconnect", () => {
      if (currentRoom && roomUsers[currentRoom]) {
        delete roomUsers[currentRoom][socket.id];
        io.to(currentRoom).emit("presence-sync", Object.values(roomUsers[currentRoom]));
      }
    });

    socket.on("send-changes", (deltas, fileId) => {
      socket.to(fileId).emit("receive-changes", deltas, fileId);
    });

    socket.on("save-history", async (fullContents, fileId) => {
      try {
        await dbClient.query(
          "INSERT INTO file_deltas (file_id, delta) VALUES ($1, $2)",
          [fileId, JSON.stringify(fullContents)]
        );
      } catch (error) {
        console.error("Error saving delta", error);
      }
    });

    socket.on("send-cursor-move", (range, fileId, cursorId) => {
      socket.to(fileId).emit("receive-cursor-move", range, fileId, cursorId);
    });

    socket.on("send-dir-update", (dirType, fileId, payload) => {
      socket.to(fileId).emit("receive-dir-update", dirType, fileId, payload);
    });

    // WebRTC Signaling
    socket.on("webrtc-offer", ({ offer, to, from }) => {
      socket.to(to).emit("webrtc-offer", { offer, from });
    });

    socket.on("webrtc-answer", ({ answer, to, from }) => {
      socket.to(to).emit("webrtc-answer", { answer, from });
    });

    socket.on("webrtc-ice-candidate", ({ candidate, to, from }) => {
      socket.to(to).emit("webrtc-ice-candidate", { candidate, from });
    });

    // AI Ghost Collaborator
    socket.on("spawn-ai", async (fileId, prompt, cursorIndex, documentText) => {
      if (activeAiStreams.has(fileId)) {
        console.log(`[AI] Stream already active for room ${fileId}, ignoring request.`);
        return;
      }
      activeAiStreams.add(fileId);

      console.log(`[AI] Spawn requested for room ${fileId} with prompt: ${prompt} at index: ${cursorIndex}`);
      const aiId = "ai-ghost-" + Math.random().toString(36).substring(7);
      if (!roomUsers[fileId]) roomUsers[fileId] = {};
      
      roomUsers[fileId][aiId] = {
        id: aiId,
        email: "AI Co-Pilot@syncspace",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Felix", 
        socketId: aiId,
      };
      
      io.to(fileId).emit("presence-sync", Object.values(roomUsers[fileId]));

      try {
        console.log(`[AI] Starting Gemini streaming for ${aiId}...`);
        
        io.to(fileId).emit("ai-started");
        
        // Initial header formatting
        const headerText = `\n\n[AI Generated Response for: "${prompt}"]\n`;
        let i = 0;
        
        for (let c = 0; c < headerText.length; c++) {
          const char = headerText[c];
          const attributes = char === '\n' ? undefined : { author: "AI Co-Pilot" };
          const delta = { 
            ops: [
              { retain: cursorIndex + i }, 
              { insert: char, ...(attributes && { attributes }) }
            ] 
          };
          io.to(fileId).emit("receive-changes", delta, fileId);
          io.to(fileId).emit("receive-cursor-move", { index: cursorIndex + i + 1, length: 0 }, fileId, aiId);
          i++;
        }

        const systemPrompt = `You are an expert AI co-writer integrated directly into a Notion-like collaborative workspace called "SyncSpace".
Your job is to seamlessly write, brainstorm, or refine text exactly where the user's cursor is.

CURRENT DOCUMENT CONTEXT:
"""
${documentText || "(The document is currently empty)"}
"""

USER'S COMMAND: "${prompt}"

INSTRUCTIONS:
1. Generate ONLY the exact text that should be inserted into the document.
2. DO NOT include conversational filler like "Here is the summary:" or "Sure, I can write that."
3. DO NOT use markdown formatting (like **bold** or ## headers) unless absolutely necessary, because it will be inserted as plain text.
4. Adapt seamlessly to the tone and context of the existing document.`;

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
        });

        for await (const chunk of responseStream) {
            const textChunk = chunk.text;
            for (let c = 0; c < textChunk.length; c++) {
              const char = textChunk[c];
              const attributes = char === '\n' ? undefined : { author: "AI Co-Pilot" };
              const delta = {
                ops: [
                  { retain: cursorIndex + i },
                  { insert: char, ...(attributes && { attributes }) }
                ]
              };
              
              io.to(fileId).emit("receive-changes", delta, fileId);
              io.to(fileId).emit("receive-cursor-move", { index: cursorIndex + i + 1, length: 0 }, fileId, aiId);
              
              i++;
              // small delay to simulate typing
              await new Promise(r => setTimeout(r, 25));
            }
        }
      } catch(e) {
        console.error("[AI] Error streaming from Gemini:", e);
      } finally {
        activeAiStreams.delete(fileId);
        io.to(fileId).emit("ai-finished");
        delete roomUsers[fileId][aiId];
        io.to(fileId).emit("presence-sync", Object.values(roomUsers[fileId]));
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
