"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/firebase/firestore";
import { storage } from "@/firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Mic, Square, Play, Pause, Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CreateAudioPostFormProps {
  communityId: string;
  communityHandle: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateAudioPostForm({
  communityId,
  communityHandle,
  onSuccess,
  onCancel
}: CreateAudioPostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  
  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/mp4' || file.type === 'audio/wav')) {
      setUploadedAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioBlob(file);
      
      // Reset recording time
      setRecordingTime(0);
      
      // Get audio duration
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setRecordingTime(Math.round(audio.duration));
      };
    } else if (file) {
      toast({
        title: "Invalid File",
        description: "Please upload an MP3, MP4 audio, or WAV file.",
        variant: "destructive",
      });
    }
  };
  
  const removeAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setUploadedAudioFile(null);
    setRecordingTime(0);
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post",
        variant: "destructive",
      });
      return;
    }
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!audioBlob) {
      toast({
        title: "Error",
        description: "Audio is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload audio file
      const audioFileName = `audio_${Date.now()}.mp3`;
      const storageRef = ref(storage, `posts/${user.uid}/${audioFileName}`);
      
      await uploadBytes(storageRef, audioBlob);
      const audioUrl = await getDownloadURL(storageRef);
      
      const postData = {
        title,
        content: {
          text: description,
          mediaUrls: [audioUrl]
        },
        authorId: user.uid,
        communityId,
        communityHandle,
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        visibility: isPublic ? "public" : "members-only",
        type: "audio",
        duration: recordingTime, // Audio duration in seconds
      };
      
      await addDoc(collection(db, "blogs"), postData);
      
      toast({
        title: "Success",
        description: "Your audio post has been published",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error creating audio post:", error);
      toast({
        title: "Error",
        description: "Failed to create audio post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for your audio post"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description for your audio..."
          className="min-h-[100px]"
        />
      </div>
      
      <div className="space-y-4 p-4 rounded-md bg-[#699FE5]/30 border border-[#699FE5]/20">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-[#699FE5]">Audio</h3>
          <div className="text-sm">{formatTime(recordingTime)}</div>
        </div>
        
        {!audioUrl ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={startRecording}
                disabled={isRecording}
                className="flex-1 bg-[#699FE5] hover:bg-[#699FE5]/90"
              >
                <Mic className="mr-2 h-4 w-4" />
                Record Audio
              </Button>
              
              <Label htmlFor="audio-upload" className="flex-1">
                <div className="flex items-center justify-center w-full h-10 px-4 py-2 bg-[#699FE5]/20 text-[#699FE5] rounded-md cursor-pointer hover:bg-[#699FE5]/30 transition-colors">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Audio
                </div>
                <Input
                  id="audio-upload"
                  type="file"
                  accept="audio/mpeg,audio/mp4,audio/wav"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </Label>
            </div>
            
            {isRecording && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress value={100} className="h-2 animate-pulse" />
                </div>
                <Button
                  type="button"
                  onClick={stopRecording}
                  variant="destructive"
                  size="icon"
                >
                  <Square className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                onClick={togglePlayback}
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-[#699FE5] text-[#699FE5]"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="bg-[#699FE5] h-full" style={{ width: isPlaying ? '100%' : '0%', transition: 'width 0.1s linear' }} />
              </div>
              
              <Button
                type="button"
                onClick={removeAudio}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} className="hidden" />
            
            <div className="text-sm text-gray-500">
              {uploadedAudioFile ? `File: ${uploadedAudioFile.name}` : 'Recorded audio'}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => setIsPublic(!!checked)}
        />
        <Label htmlFor="isPublic">Make this post public</Label>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !audioBlob}
          className="bg-[#699FE5] hover:bg-[#699FE5]/90"
        >
          {isSubmitting ? "Publishing..." : "Publish Audio"}
        </Button>
      </div>
    </form>
  );
}
