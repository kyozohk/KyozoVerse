import { X } from 'lucide-react';

export function Dialog({ 
  open, 
  onClose, 
  children, 
  title, 
  description, 
  backgroundImage,
  showVideo = true
}: { 
  open: boolean, 
  onClose: () => void, 
  children: React.ReactNode, 
  title: string, 
  description: string,
  backgroundImage?: string,
  showVideo?: boolean
}) {
  if (!open) return null;

  // Debug logging
  console.log('Dialog props:', { title, backgroundImage, showVideo });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-16">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full h-full flex relative overflow-hidden border-1 border-primary">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
          <X size={24} />
        </button>
        
        {/* Left side - Content */}
        <div className="w-1/2 p-10 flex flex-col">
          <h2 className="text-5xl font-bold mb-2 text-gray-800 dark:text-white">{title}</h2>
          <p className="text-gray-500 mb-8 text-base">{description}</p>
          <div className="flex-grow flex flex-col justify-between">
            {children}
          </div>
        </div>
        
        {/* Right side - Background texture image */}
        <div className="w-1/2 bg-gray-100 rounded-r-lg overflow-hidden relative">
          <div 
            className="w-full h-full rounded-r-lg"
            style={{ 
              backgroundImage: `url(${backgroundImage || '/bg/light_app_bg.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: '0.8' // Slightly reduce the texture opacity to help video clarity
            }}
          />
          
          {/* Video overlay on top of texture */}
          {showVideo && (
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <video 
                src="/videos/form-right.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover rounded-r-lg opacity-90"
                style={{ filter: 'none' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
