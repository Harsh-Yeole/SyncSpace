"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getColorForAuthor } from "@/lib/utils";

interface TimeTravelPanelProps {
  roomId: string;
  quill: any;
  onClose: () => void;
}

export const TimeTravelPanel: React.FC<TimeTravelPanelProps> = ({ roomId, quill, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deltas, setDeltas] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [originalContents, setOriginalContents] = useState<any>(null);

  useEffect(() => {
    const openTimeTravel = async () => {
      if (!quill) return;
      
      // Save current state to restore later
      setOriginalContents(quill.getContents());
      quill.disable(); // Make read-only

      // Fetch history
      const res = await fetch(`/api/deltas/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setDeltas(data.deltas);
        setCurrentIndex(data.deltas.length);
      }
    };

    openTimeTravel();
  }, [quill, roomId]);

  const closeTimeTravel = () => {
    if (!quill) return;
    if (originalContents) {
      quill.setContents(originalContents);
    }
    quill.enable();
    onClose();
  };

  const onSliderChange = async (value: number[]) => {
    if (!quill) return;
    const targetIndex = value[0];
    setCurrentIndex(targetIndex);

    if (targetIndex === 0) {
      quill.setText("");
      return;
    }

    const deltaStr = deltas[targetIndex - 1].delta;
    try {
      const deltaObj = JSON.parse(deltaStr);
      quill.setContents(deltaObj);
    } catch (e) {
      // ignore malformed deltas
    }
  };

  const currentDelta = deltas[currentIndex - 1]?.delta;
  const uniqueAuthors = new Set<string>();
  if (currentDelta) {
    try {
      const deltaObj = JSON.parse(currentDelta);
      deltaObj.ops?.forEach((op: any) => {
        if (op.attributes?.author) {
          uniqueAuthors.add(op.attributes.author);
        }
      });
    } catch (e) {}
  }

  return (
    <div className="w-[300px] flex-shrink-0 border-l bg-muted/20 flex flex-col p-4 shadow-inner overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <History size={16} className="text-indigo-500" /> Version History
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeTimeTravel}>
          <X size={14} />
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mb-6">
        Scrub backwards in time to see exactly how this document was built.
      </p>

      <div className="flex flex-col gap-4 mt-2">
        <Slider 
          value={[currentIndex]} 
          max={deltas.length} 
          step={1} 
          onValueChange={onSliderChange} 
          className="w-full"
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
          <span>0</span>
          <span>{currentIndex} / {deltas.length}</span>
        </div>
      </div>

      {uniqueAuthors.size > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Authors in this snapshot</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(uniqueAuthors).map(author => (
              <span 
                key={author} 
                className="text-xs px-2 py-1 rounded-md text-foreground"
                style={{ backgroundColor: getColorForAuthor(author) }}
              >
                {author}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Recent Edits</h4>
        {deltas.slice(-5).reverse().map((d, i) => (
          <div key={d.id} className="text-xs p-2 bg-background border rounded-md">
            <div className="font-mono text-muted-foreground mb-1">
              {new Date(d.createdAt).toLocaleTimeString()}
            </div>
            Snapshot saved.
          </div>
        ))}
      </div>
    </div>
  );
};
