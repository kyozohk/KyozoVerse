"use client";

import { useState } from "react";
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
import { Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";

interface CreateTextPostFormProps {
  communityId: string;
  communityHandle: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateTextPostForm({
  communityId,
  communityHandle,
  onSuccess,
  onCancel
}: CreateTextPostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
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
    
    setIsSubmitting(true);
    
    try {
      let mediaUrl = "";
      
      if (image) {
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${image.name}`);
        const uploadResult = await uploadBytes(storageRef, image);
        mediaUrl = await getDownloadURL(uploadResult.ref);
      }
      
      const postData = {
        title,
        content: {
          text: content,
          mediaUrls: mediaUrl ? [mediaUrl] : []
        },
        authorId: user.uid,
        communityId,
        communityHandle,
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        visibility: isPublic ? "public" : "members-only",
        type: image ? "image" : "text",
        readTime: Math.max(1, Math.ceil(content.split(" ").length / 200)), // Estimate read time in minutes
      };
      
      await addDoc(collection(db, "blogs"), postData);
      
      toast({
        title: "Success",
        description: "Your post has been published",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
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
          placeholder="Enter a title for your post"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post content here..."
          className="min-h-[150px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
          <ImageIcon size={16} />
          <span>Add Image (Optional)</span>
        </Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        
        {imagePreview && (
          <div className="relative mt-2">
            <Image
              src={imagePreview}
              alt="Preview"
              width={400}
              height={300}
              className="rounded-md max-h-[200px] object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {!imagePreview && (
          <div 
            onClick={() => document.getElementById("image")?.click()}
            className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-[#C170CF] transition-colors bg-[#C170CF]/10"
          >
            <ImageIcon className="mx-auto h-8 w-8 text-[#C170CF]" />
            <p className="mt-2 text-sm text-gray-500">Click to upload an image</p>
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Publishing..." : "Publish Post"}
        </Button>
      </div>
    </form>
  );
}
