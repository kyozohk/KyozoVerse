"use client";

import { useState } from "react";
import { Pencil, Mic, Video } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { CreateTextPostForm } from "./create-text-post-form";
import { CreateAudioPostForm } from "./create-audio-post-form";
import { CreateVideoPostForm } from "./create-video-post-form";

interface CreateContentFABProps {
  communityId: string;
  communityHandle: string;
}

export function CreateContentFAB({ communityId, communityHandle }: CreateContentFABProps) {
  const [activeDialog, setActiveDialog] = useState<"text" | "audio" | "video" | null>(null);
  
  const handleOpenDialog = (type: "text" | "audio" | "video") => {
    setActiveDialog(type);
  };
  
  const handleCloseDialog = () => {
    setActiveDialog(null);
  };
  
  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col gap-4">
        {/* Text Post Button */}
        <button 
          onClick={() => handleOpenDialog("text")}
          className="w-14 h-14 rounded-full bg-[#C170CF] text-white shadow-lg flex items-center justify-center hover:bg-opacity-90 transition-all"
          aria-label="Create text post"
        >
          <Pencil size={24} />
        </button>
        
        {/* Audio Post Button */}
        <button 
          onClick={() => handleOpenDialog("audio")}
          className="w-14 h-14 rounded-full bg-[#699FE5] text-white shadow-lg flex items-center justify-center hover:bg-opacity-90 transition-all"
          aria-label="Create audio post"
        >
          <Mic size={24} />
        </button>
        
        {/* Video Post Button */}
        <button 
          onClick={() => handleOpenDialog("video")}
          className="w-14 h-14 rounded-full bg-[#CF7770] text-white shadow-lg flex items-center justify-center hover:bg-opacity-90 transition-all"
          aria-label="Create video post"
        >
          <Video size={24} />
        </button>
      </div>
      
      {/* Text Post Dialog */}
      <Dialog 
        open={activeDialog === "text"} 
        onClose={handleCloseDialog}
        title="Create Text Post"
        description="Share your thoughts with the community"
        backgroundImage="/bg/light_app_bg.png"
      >
        <CreateTextPostForm 
          communityId={communityId} 
          communityHandle={communityHandle} 
          onSuccess={handleCloseDialog} 
          onCancel={handleCloseDialog}
        />
      </Dialog>
      
      {/* Audio Post Dialog */}
      <Dialog 
        open={activeDialog === "audio"} 
        onClose={handleCloseDialog}
        title="Create Audio Post"
        description="Share audio with the community"
        backgroundImage="/bg/light_app_bg.png"
      >
        <CreateAudioPostForm 
          communityId={communityId} 
          communityHandle={communityHandle} 
          onSuccess={handleCloseDialog} 
          onCancel={handleCloseDialog}
        />
      </Dialog>
      
      {/* Video Post Dialog */}
      <Dialog 
        open={activeDialog === "video"} 
        onClose={handleCloseDialog}
        title="Create Video Post"
        description="Share video with the community"
        backgroundImage="/bg/light_app_bg.png"
      >
        <CreateVideoPostForm 
          communityId={communityId} 
          communityHandle={communityHandle} 
          onSuccess={handleCloseDialog} 
          onCancel={handleCloseDialog}
        />
      </Dialog>
    </>
  );
}
