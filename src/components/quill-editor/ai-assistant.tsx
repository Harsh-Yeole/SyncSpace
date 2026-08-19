"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/lib/providers/socket-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface AiAssistantProps {
  roomId: string;
  quill: any;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ roomId, quill }) => {
  const { socket } = useSocket();
  const [prompt, setPrompt] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const triggerAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !quill || !prompt.trim()) return;

    // If quill loses focus (selection is null), append to the end of the text (before the trailing newline)
    const selection = quill.getSelection();
    const cursorIndex = selection ? selection.index : Math.max(0, quill.getLength() - 1);

    const documentText = quill.getText();

    // Tell the server to spawn the AI ghost collaborator
    socket.emit("spawn-ai", roomId, prompt, cursorIndex, documentText);
    
    setPrompt("");
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9 rounded-full px-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
          <Sparkles size={16} />
          Ask AI
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <form onSubmit={triggerAI} className="flex flex-col gap-3">
          <div className="space-y-2">
            <h4 className="font-medium leading-none flex items-center gap-2 text-indigo-600">
              <Sparkles size={16} /> AI Co-Pilot
            </h4>
            <p className="text-sm text-muted-foreground">
              Ask the AI to generate content. It will join the room and type its response live!
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              id="prompt"
              placeholder="e.g. Write a welcome message..."
              className="h-8"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              autoFocus
            />
            <Button type="submit" size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700">
              Send
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};
