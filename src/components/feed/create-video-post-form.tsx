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
import { Video as VideoIcon, Square, Play, Pause, Upload, X, Camera } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CreateVideoPostFormProps {
  communityId: string;
  communityHandle: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateVideoPostForm({
  communityId,
  communityHandle,
  onSuccess,
  onCancel
}: CreateVideoPostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Video recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      
      streamRef.current = stream;
      
      // Preview the video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Mute to prevent feedback
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(videoBlob);
        setVideoBlob(videoBlob);
        setVideoUrl(videoUrl);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        // Update video source
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = videoUrl;
          videoRef.current.muted = false;
        }
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Error",
        description: "Could not access camera. Please check your permissions.",
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
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleVideoEnded = () => {
    setIsPlaying(false);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoBlob(file);
      
      // Reset recording time
      setRecordingTime(0);
      
      // Get video duration
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setRecordingTime(Math.round(video.duration));
      };
      video.src = url;
    } else if (file) {
      toast({
        title: "Invalid File",
        description: "Please upload a video file.",
        variant: "destructive",
      });
    }
  };
  
  const removeVideo = () => {
    setVideoBlob(null);
    setVideoUrl(null);
    setUploadedVideoFile(null);
    setRecordingTime(0);
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    
    // Stop any ongoing recording
    if (isRecording) {
      stopRecording();
    }
    
    // Stop any active stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
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
    
    if (!videoBlob) {
      toast({
        title: "Error",
        description: "Video is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload video file
      const videoFileName = `video_${Date.now()}.mp4`;
      const storageRef = ref(storage, `posts/${user.uid}/${videoFileName}`);
      
      // Create upload task
      const uploadTask = uploadBytes(storageRef, videoBlob);
      
      // Upload the video
      await uploadTask;
      const videoUrl = await getDownloadURL(storageRef);
      
      const postData = {
        title,
        content: {
          text: description,
          mediaUrls: [videoUrl]
        },
        authorId: user.uid,
        communityId,
        communityHandle,
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        visibility: isPublic ? "public" : "members-only",
        type: "video",
        duration: recordingTime, // Video duration in seconds
      };
      
      await addDoc(collection(db, "blogs"), postData);
      
      toast({
        title: "Success",
        description: "Your video post has been published",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error creating video post:", error);
      toast({
        title: "Error",
        description: "Failed to create video post. Please try again.",
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
          placeholder="Enter a title for your video post"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description for your video..."
          className="min-h-[100px]"
        />
      </div>
      
      <div className="space-y-4 p-4 rounded-md bg-[#CF7770]/30 border border-[#CF7770]/20">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-[#CF7770]">Video</h3>
          <div className="text-sm">{formatTime(recordingTime)}</div>
        </div>
        
        <div className="flex flex-col gap-4">
          {!videoUrl && !isRecording ? (
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={startRecording}
                className="flex-1 bg-[#CF7770] hover:bg-[#CF7770]/90"
              >
                <Camera className="mr-2 h-4 w-4" />
                Record Video
              </Button>
              
              <Label htmlFor="video-upload" className="flex-1">
                <div className="flex items-center justify-center w-full h-10 px-4 py-2 bg-[#CF7770]/20 text-[#CF7770] rounded-md cursor-pointer hover:bg-[#CF7770]/30 transition-colors">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </div>
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </Label>
            </div>
          ) : (
            <div className="relative aspect-video bg-black rounded-md overflow-hidden">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                playsInline
                autoPlay={isRecording}
                muted={isRecording}
                onEnded={handleVideoEnded}
              />
              
              {isRecording && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs flex items-center">
                  <span className="animate-pulse mr-1">●</span> Recording
                </div>
              )}
              
              {!isRecording && videoUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Button
                    type="button"
                    onClick={togglePlayback}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full border-white text-white bg-black/50 hover:bg-black/70"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {isRecording && (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={100} className="h-2 animate-pulse bg-[#CF7770]/30" />
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
          
          {videoUrl && !isRecording && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {uploadedVideoFile ? `File: ${uploadedVideoFile.name}` : 'Recorded video'}
              </div>
              
              <Button
                type="button"
                onClick={removeVideo}
                variant="ghost"
                size="sm"
                className="text-gray-500"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          )}
        </div>
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
          disabled={isSubmitting || !videoBlob || isRecording}
          className="bg-[#CF7770] hover:bg-[#CF7770]/90"
        >
          {isSubmitting ? "Publishing..." : "Publish Video"}
        </Button>
      </div>
    </form>
  );
}
