import React from 'react';
import { CustomButton } from '@/components/ui/CustomButton';
import { PlusCircle, Users, Sparkles } from 'lucide-react';
import '@/styles/banner-animation.css';

interface CommunityBannerProps {
  totalCommunities: number;
  onCreateClick: () => void;
}

export function CommunityBanner({ totalCommunities, onCreateClick }: CommunityBannerProps) {
  return (
    <div className="relative w-full mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-[#843484] to-[#a64ca6] text-white shadow-lg banner-glow">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('/bg/pattern.svg')] bg-repeat opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
      </div>
      
      {/* Geometric shapes */}
      <div className="absolute top-0 right-0 w-1/3 h-full">
        <div className="absolute inset-0 bg-white/10 transform rotate-45 translate-x-1/2 -translate-y-1/4 blur-sm"></div>
        <div className="absolute inset-0 bg-white/10 transform -rotate-45 translate-x-1/3 translate-y-1/4 blur-sm"></div>
      </div>
      
      <div className="relative z-10 flex items-center justify-between p-6 md:p-8">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Sparkles className="h-6 w-6 mr-2 text-yellow-300 pulse-animation" />
            <h2 className="text-2xl md:text-3xl font-bold">Your Communities</h2>
          </div>
          
          <div className="flex items-center text-white/90 mb-4 bg-white/10 px-3 py-1 rounded-full w-fit">
            <Users className="h-5 w-5 mr-2" />
            <span>{totalCommunities} {totalCommunities === 1 ? 'Community' : 'Communities'}</span>
          </div>
          
          <p className="text-white/90 max-w-md backdrop-blur-sm bg-black/5 p-3 rounded-lg">
            Create and manage your communities. Connect with members, share content, and grow your audience.
          </p>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full transform -translate-x-1/2 translate-y-1/2 blur-md float-animation"></div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-1/3 -translate-y-1/3 blur-md float-animation" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/10 rounded-full transform translate-x-1/4 translate-y-1/4 blur-sm float-animation" style={{ animationDelay: '2s' }}></div>
    </div>
  );
}
