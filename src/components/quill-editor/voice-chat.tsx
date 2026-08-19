"use client";

import React, { useEffect, useState, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/lib/providers/socket-provider";

interface VoiceChatProps {
  roomId: string;
  collaborators: any[]; // The list of active users from presence-sync
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ roomId, collaborators }) => {
  const { socket } = useSocket();
  const [isJoined, setIsJoined] = useState(false);
  const localStream = useRef<MediaStream | null>(null);
  const peers = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const audioElements = useRef<{ [socketId: string]: HTMLAudioElement }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("webrtc-offer", async ({ offer, from }) => {
      console.log("Received WebRTC offer from", from);
      if (!isJoined) return;
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("Sending WebRTC answer to", from);
      socket.emit("webrtc-answer", { answer, to: from, from: socket.id });
    });

    socket.on("webrtc-answer", async ({ answer, from }) => {
      console.log("Received WebRTC answer from", from);
      const pc = peers.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("WebRTC connection established with", from);
      }
    });

    socket.on("webrtc-ice-candidate", async ({ candidate, from }) => {
      const pc = peers.current[from];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Failed to add ICE candidate", e);
        }
      }
    });

    return () => {
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
    };
  }, [socket, isJoined]);

  useEffect(() => {
    // When collaborators change, check if someone left and close their connection
    const currentSocketIds = collaborators.map((c) => c.socketId);
    Object.keys(peers.current).forEach((socketId) => {
      if (!currentSocketIds.includes(socketId)) {
        peers.current[socketId].close();
        delete peers.current[socketId];
        if (audioElements.current[socketId]) {
          audioElements.current[socketId].remove();
          delete audioElements.current[socketId];
        }
      }
    });
  }, [collaborators]);

  const createPeerConnection = (peerSocketId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peers.current[peerSocketId] = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", {
          candidate: event.candidate,
          to: peerSocketId,
          from: socket.id,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote audio track from", peerSocketId);
      if (!audioElements.current[peerSocketId]) {
        const audio = document.createElement("audio");
        audio.autoplay = true;
        // In some browsers, elements must be attached to document to play
        containerRef.current?.appendChild(audio);
        audioElements.current[peerSocketId] = audio;
      }
      audioElements.current[peerSocketId].srcObject = event.streams[0];
      
      // Force play to overcome autoplay policies if possible
      audioElements.current[peerSocketId].play().catch(e => console.error("Audio play failed:", e));
    };

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.current!);
      });
    }

    return pc;
  };

  const toggleVoice = async () => {
    if (isJoined) {
      // Leave voice
      localStream.current?.getTracks().forEach((track) => track.stop());
      localStream.current = null;
      Object.values(peers.current).forEach((pc) => pc.close());
      peers.current = {};
      Object.values(audioElements.current).forEach((audio) => audio.remove());
      audioElements.current = {};
      setIsJoined(false);
    } else {
      // Join voice
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStream.current = stream;
        setIsJoined(true);

        // Initiate connection to all currently known collaborators
        collaborators.forEach(async (collaborator) => {
          if (collaborator.socketId && collaborator.socketId !== socket.id) {
            const pc = createPeerConnection(collaborator.socketId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("webrtc-offer", {
              offer,
              to: collaborator.socketId,
              from: socket.id,
            });
          }
        });
      } catch (error) {
        console.error("Error accessing microphone", error);
      }
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div ref={containerRef} className="hidden" />
      <Button
        variant={isJoined ? "default" : "outline"}
        size="sm"
        className={`gap-2 h-9 rounded-full px-4 ${isJoined ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
        onClick={toggleVoice}
      >
        {isJoined ? <Mic size={16} /> : <MicOff size={16} />}
        {isJoined ? "Voice Active" : "Join Voice"}
      </Button>
    </div>
  );
};
