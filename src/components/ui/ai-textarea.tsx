'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Textarea } from './textarea';
import { useToast } from '@/hooks/use-toast';

interface AITextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  aiPrompt?: string;
  rows?: number;
  className?: string;
}

export function AITextarea({
  label,
  value,
  onChange,
  placeholder,
  aiPrompt,
  rows = 6,
  className
}: AITextareaProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleAIGenerate = async () => {
    if (!aiPrompt) {
      toast({
        title: 'No prompt provided',
        description: 'Please provide context for AI generation',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          currentValue: value,
          type: 'long',
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.text) {
        onChange(data.text);
        toast({
          title: 'Generated successfully',
          description: 'AI has generated content for you',
        });
      } else {
        throw new Error(data.error || 'Failed to generate');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`relative ${className || ''}`}>
      <div className="relative">
        <Textarea
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{ borderColor: '#C170CF' }}
        />
        <button
          type="button"
          onClick={handleAIGenerate}
          disabled={isGenerating}
          className="absolute right-3 top-3 p-1.5 rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50"
          title="Generate with AI"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
          ) : (
            <Sparkles className="h-4 w-4 text-purple-500" />
          )}
        </button>
      </div>
    </div>
  );
}
