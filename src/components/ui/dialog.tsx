
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import Image from 'next/image';

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
  className={cn(
    "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    className
  )}    
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full h-auto max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-6 top-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary z-50">
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName


interface CustomFormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  backgroundImage?: string;
  showVideo?: boolean;
  videoSrc?: string;
  color?: string;
}

export function CustomFormDialog({
  open,
  onClose,
  title,
  description,
  children,
  backgroundImage = "/bg/light_app_bg.png",
  showVideo = true,
  videoSrc = "/videos/form-right.mp4",
  color = "var(--primary-purple)",
}: CustomFormDialogProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setIsAnimating(true);
    }
  }, [open]);

  const handleClose = () => {
    setIsAnimating(false);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogOverlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-[90vw] h-[90vh] translate-x-[-50%] translate-y-[-50%] border-0 rounded-lg overflow-hidden shadow-2xl focus:outline-none"
          style={{
            '--input-border-color': color,
          } as React.CSSProperties}
        >
          {/* Accessible title for screen readers */}
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>
          
          {/* Curtain Animation Container */}
          <div className={`relative w-full h-full grid grid-cols-1 ${showVideo ? 'md:grid-cols-2' : ''} ${isAnimating ? 'animate-curtain-open' : 'animate-curtain-close'}`}>
            {/* Left Panel - Form */}
            <div 
              className="relative flex flex-col h-full overflow-hidden"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Close Button - Top Right of Left Panel */}
              <DialogPrimitive.Close className="absolute right-6 top-6 rounded-full p-2 bg-black/10 hover:bg-black/20 transition-colors z-50">
                <X className="h-5 w-5 text-black" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>

              <div className="p-8 md:p-12 lg:p-16 flex flex-col h-full overflow-y-auto">
                {/* Header - Fixed at top */}
                <div className="flex-shrink-0 mb-8">
                  <h2 
                    className="text-4xl md:text-5xl font-normal text-left mb-3 text-black" 
                    style={{ fontFamily: 'Canicule Display, serif' }}
                    aria-hidden="true"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p className="text-left text-base text-gray-600">{description}</p>
                  )}
                </div>
                
                {/* Form Content - Scrollable */}
                <div className="flex-grow overflow-y-auto">
                  {children}
                </div>
              </div>
            </div>

            {/* Right Panel - Video */}
            {showVideo && (
              <div className="relative hidden md:block overflow-hidden">
                <video
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  src={videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}


export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
