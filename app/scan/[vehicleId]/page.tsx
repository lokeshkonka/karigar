'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { 
  X, Camera, RotateCw, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';
import { Loader } from '@/components/ui/Loader';
import toast from 'react-hot-toast';

const REQUIRED_PHOTOS = 36;

export default function ScannerPage() {
  const router = useRouter();
  const { vehicleId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [photosTaken, setPhotosTaken] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastCaptureUrl, setLastCaptureUrl] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported on this device or browser.');
      setPermissionGranted(false);
      return false;
    }

    setIsStartingCamera(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setPermissionGranted(true);
      return true;
    } catch {
      setPermissionGranted(false);
      setCameraError('Camera access denied. Please allow permission and try again.');
      toast.error('Camera access denied. Please allow camera permissions.');
      stopCamera();
      return false;
    } finally {
      setIsStartingCamera(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleCapture = useCallback(() => {
    if (photosTaken < REQUIRED_PHOTOS) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setLastCaptureUrl(canvas.toDataURL('image/jpeg', 0.85));
        }
      }

      setPhotosTaken(prev => prev + 1);
    }
  }, [photosTaken]);

  const handleFinish = useCallback(() => {
    setIsProcessing(true);
    stopCamera();
    // Simulate GLB generation pipeline
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
    }, 4000);
  }, [stopCamera]);

  const handleReset = useCallback(() => {
    setPhotosTaken(0);
    setIsComplete(false);
    setPermissionGranted(null);
    setCameraError(null);
    setLastCaptureUrl(null);
    stopCamera();
  }, [stopCamera]);

  const progressPercentage = (photosTaken / REQUIRED_PHOTOS) * 100;

  if (permissionGranted === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-full max-w-md bg-[#111] border-4 border-electricYellow shadow-[8px_8px_0_#1a1a1a] p-6 space-y-6">
          <div className="w-20 h-20 mx-auto bg-electricYellow text-foreground border-4 border-foreground flex items-center justify-center rotate-3">
            <Camera size={40} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-widest uppercase mb-3">Open Camera</h1>
            <p className="font-bold text-gray-400">
              Tap below to start the live scanner. The camera stays visible while you capture each pass.
            </p>
          </div>
          {cameraError && (
            <p className="border-2 border-orange text-orange bg-orange/10 px-4 py-3 text-xs font-black uppercase tracking-wider">
              {cameraError}
            </p>
          )}
          <button
            onClick={() => void startCamera()}
            disabled={isStartingCamera}
            className="w-full py-5 bg-electricYellow text-foreground border-4 border-foreground shadow-[4px_4px_0px_#FFE500] font-black uppercase text-xl tracking-wider hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-60 flex items-center justify-center gap-3"
          >
            {isStartingCamera ? <Loader2 size={22} className="animate-spin" /> : <Camera size={24} />}
            {isStartingCamera ? 'Starting...' : 'Enable Camera'}
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-8 text-center">
        <CheckCircle2 size={100} className="mb-6 text-green animate-in zoom-in duration-500" />
        <h1 className="text-4xl font-black tracking-widest uppercase mb-4 text-electricYellow">
          Scan Complete
        </h1>
        <p className="font-bold text-gray-400 mb-12">
          3D Model successfully generated and linked to vehicle <span className="text-white font-mono bg-foreground px-2">MH 12 AB 1234</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button 
            variant="primary" 
            className="flex-1 text-lg py-4"
            onClick={() => router.push(`/admin/vehicles/${vehicleId}`)}
          >
            View in 3D
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 text-lg py-4 border-white text-white hover:text-foreground"
            onClick={() => {
              setPhotosTaken(0);
              setIsComplete(false);
            }}
          >
            Rescan
          </Button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return <Loader variant="dark" fullScreen text={`Analyzing ${REQUIRED_PHOTOS} Photos...`} />;
  }

  return (
    <div className="min-h-screen w-screen bg-[#0a0a0a] flex flex-col text-white overflow-hidden relative">
      {/* Top Bar */}
      <div className="sticky top-0 left-0 w-full p-4 z-20 flex justify-between items-center bg-linear-to-b from-black/90 to-black/30 backdrop-blur-sm border-b border-white/5">
        <div className="flex flex-col">
          <span className="text-electricYellow font-black tracking-widest uppercase text-xl">Vehicle Scanner</span>
          <span className="font-mono text-sm bg-white text-black px-2 py-0.5 inline-block w-fit mt-1 font-bold">MH 12 AB 1234</span>
        </div>
        <Button 
          variant="outline" 
          className="border-white text-white p-2 rounded-full hover:bg-white/20"
          onClick={() => router.back()}
        >
          <X size={24} />
        </Button>
      </div>

      {/* Live Camera Feed */}
      <div className="flex-1 px-4 pb-4 pt-2 flex flex-col gap-4">
        <div className="relative flex-1 min-h-[55vh] rounded-[28px] overflow-hidden border-4 border-electricYellow bg-black shadow-[8px_8px_0_#1a1a1a]">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          <button
            type="button"
            onClick={handleCapture}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 active:bg-black/20 transition-colors touch-manipulation"
            aria-label="Capture photo from live camera"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-35 pointer-events-none">
              <svg viewBox="0 0 400 200" className="w-[80vw] max-w-150 text-electricYellow" stroke="currentColor" fill="none" strokeWidth={3} strokeDasharray="10 5">
                <path d="M50 150 L30 150 L20 120 L40 70 L120 70 L160 30 L280 30 L340 70 L380 120 L370 150 L350 150" />
                <circle cx="90" cy="150" r="30" />
                <circle cx="310" cy="150" r="30" />
              </svg>
            </div>

            <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3 pointer-events-none">
              <p className="bg-foreground/85 px-4 py-2 font-black tracking-widest border-2 border-electricYellow text-electricYellow text-sm uppercase">
                Tap camera to capture
              </p>
              <p className="bg-electricYellow text-foreground px-4 py-2 font-black tracking-widest border-2 border-foreground text-sm uppercase">
                {photosTaken} / {REQUIRED_PHOTOS}
              </p>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
              <div className="bg-foreground/85 px-4 py-3 border-2 border-white/15 text-left max-w-[70%]">
                <p className="font-black uppercase text-sm text-white">{photosTaken < REQUIRED_PHOTOS / 2 ? 'MOVE TO: FRONT-RIGHT' : 'MOVE TO: REAR-LEFT'}</p>
                <p className="text-xs font-bold text-gray-300 mt-1">Hold steady, then tap the viewfinder.</p>
              </div>
              <div className="w-20 h-20 rounded-full border-[6px] border-white bg-foreground flex items-center justify-center shadow-[0_0_0_6px_rgba(255,255,255,0.08)] pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-white/95" />
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-foreground border-2 border-gray-800 p-4">
            <span className="font-black text-xs text-gray-400 tracking-wider uppercase">Progress</span>
            <p className="font-black text-2xl tracking-widest mt-1">{photosTaken} / {REQUIRED_PHOTOS}</p>
            <div className="w-full h-2 bg-black mt-3">
              <div 
                className="h-full bg-electricYellow transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-foreground border-2 border-gray-800 p-4 md:col-span-2 flex items-center gap-4">
            <div className="w-24 h-16 bg-black border border-gray-700 overflow-hidden shrink-0">
              {lastCaptureUrl ? (
                <img src={lastCaptureUrl} alt="Last capture preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-black uppercase text-gray-600 text-center px-2">
                  No capture yet
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-black uppercase text-sm tracking-wider">Last capture preview</p>
              <p className="text-xs text-gray-400 font-bold mt-1">Tap the camera feed or the capture button to save the current frame.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="sticky bottom-0 bg-foreground border-t-4 border-electricYellow z-20 p-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 border-2 border-electricYellow flex items-center justify-center bg-black shrink-0">
              <AlertCircle size={22} className="text-electricYellow" />
            </div>
            <div>
              <p className="font-black uppercase text-xs text-gray-400 tracking-wider">Status</p>
              <p className="font-bold text-sm text-white">
                {cameraError ? cameraError : 'Tap the live view to capture a frame.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {photosTaken >= REQUIRED_PHOTOS / 2 ? (
              <Button variant="primary" onClick={handleFinish} className="shadow-none px-6 py-4">
                Finish early
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-orange font-bold text-xs max-w-45 text-right sm:text-left">
                <AlertCircle size={16} className="shrink-0" />
                Need {Math.ceil(REQUIRED_PHOTOS / 2) - photosTaken} more to finish
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => void startCamera()}
              className="border-white text-white px-6 py-4 hover:bg-white hover:text-foreground"
            >
              <Camera size={18} className="mr-2" />
              View camera
            </Button>

            <Button
              variant="outline"
              onClick={handleReset}
              className="border-white text-white px-6 py-4 hover:bg-white hover:text-foreground"
            >
              <RotateCw size={18} className="mr-2" />
              Rescan
            </Button>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
