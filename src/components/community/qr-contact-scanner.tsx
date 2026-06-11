'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, ScanLine } from 'lucide-react';
import jsQR from 'jsqr';

export interface ScannedContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * Parse a contact out of QR text. Supports vCard (what the Android Contacts
 * app and most "share my contact" tools emit) and the compact MECARD format.
 */
export function parseContactQr(text: string): ScannedContact | null {
  const trimmed = text.trim();

  if (/^BEGIN:VCARD/im.test(trimmed)) {
    const match = (re: RegExp) => trimmed.match(re)?.[1]?.trim() ?? '';
    // N:Last;First;Middle;...
    const n = trimmed.match(/^N(?:;[^:]*)?:([^;\r\n]*);([^;\r\n]*)/im);
    const fn = match(/^FN(?:;[^:]*)?:(.+)$/im);
    let firstName = n?.[2]?.trim() ?? '';
    let lastName = n?.[1]?.trim() ?? '';
    if (!firstName && fn) {
      const parts = fn.split(/\s+/);
      firstName = parts[0] ?? '';
      lastName = parts.slice(1).join(' ');
    }
    const phone = match(/^TEL(?:;[^:]*)?:(.+)$/im);
    const email = match(/^EMAIL(?:;[^:]*)?:(.+)$/im);
    if (!firstName && !email && !phone) return null;
    return { firstName, lastName, email, phone };
  }

  if (/^MECARD:/i.test(trimmed)) {
    const field = (key: string) =>
      trimmed.match(new RegExp(`${key}:([^;]*)`, 'i'))?.[1]?.trim() ?? '';
    // MECARD N is "Last,First"
    const n = field('N');
    const [last = '', first = ''] = n.split(',').map(s => s.trim());
    const contact = {
      firstName: first || last, // single-token names land in firstName
      lastName: first ? last : '',
      email: field('EMAIL'),
      phone: field('TEL'),
    };
    if (!contact.firstName && !contact.email && !contact.phone) return null;
    return contact;
  }

  return null;
}

interface QrContactScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (contact: ScannedContact) => void;
}

/**
 * Full-screen camera overlay that scans a contact QR code (vCard / MECARD)
 * and hands the parsed contact back. Uses the native BarcodeDetector where
 * available (Android Chrome) and falls back to jsQR (works in iOS Safari).
 */
export function QrContactScanner({ open, onClose, onScan }: QrContactScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unrecognized, setUnrecognized] = useState(false);

  useEffect(() => {
    if (!open) return;

    let stream: MediaStream | null = null;
    let rafId = 0;
    let stopped = false;

    const detector =
      typeof window !== 'undefined' && 'BarcodeDetector' in window
        ? new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        : null;

    const handleText = (text: string) => {
      const contact = parseContactQr(text);
      if (contact) {
        stopped = true;
        onScan(contact);
      } else {
        // Keep scanning, but tell the user this QR isn't a contact card.
        setUnrecognized(true);
      }
    };

    const tick = async () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          if (detector) {
            const codes = await detector.detect(video);
            if (codes.length > 0 && codes[0].rawValue) handleText(codes[0].rawValue);
          } else {
            const canvas = canvasRef.current;
            if (canvas) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(img.data, img.width, img.height, {
                  inversionAttempts: 'dontInvert',
                });
                if (code?.data) handleText(code.data);
              }
            }
          }
        } catch {
          // Transient decode errors — keep scanning.
        }
      }
      if (!stopped) rafId = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          rafId = requestAnimationFrame(tick);
        }
      } catch {
        setError("Couldn't access the camera. Check camera permissions and try again.");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [open, onScan]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setUnrecognized(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <span className="text-base font-semibold text-white">Scan contact QR</span>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
          aria-label="Close scanner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {/* Viewfinder */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-56 w-56 rounded-2xl border-2 border-white/80" />
        </div>
        {error && (
          <div className="absolute inset-x-4 top-4 rounded-lg bg-white/95 p-3 text-sm text-[#B3261E]">
            {error}
          </div>
        )}
        {unrecognized && !error && (
          <div className="absolute inset-x-4 bottom-20 rounded-lg bg-white/95 p-3 text-center text-sm text-[#5B4A3A]">
            That QR code isn&apos;t a contact card. Ask them to share their contact as a QR
            (Contacts app → share → QR code).
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 p-5 text-sm text-white/80">
        <ScanLine className="h-4 w-4" />
        Point the camera at their contact QR code
      </div>
    </div>
  );
}
