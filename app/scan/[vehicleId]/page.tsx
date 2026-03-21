'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { 
  X, Camera, RotateCw, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Loader } from '@/components/ui/Loader';

const REQUIRED_PHOTOS = 36;

export default function ScannerPage() {
  const router = useRouter();
  const { vehicleId } = useParams();
  
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [photosTaken, setPhotosTaken] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Simulate asking for camera permission
    setTimeout(() => setPermissionGranted(true), 1500);
  }, []);

  const handleCapture = () => {
    if (photosTaken < REQUIRED_PHOTOS) {
      setPhotosTaken(prev => prev + 1);
    }
  };

  const handleFinish = () => {
    setIsProcessing(true);
    // Simulate GLB generation pipeline
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
    }, 4000);
  };

  const progressPercentage = (photosTaken / REQUIRED_PHOTOS) * 100;

  if (permissionGranted === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-8 text-center">
        <Camera size={64} className="mb-6 opacity-50 animate-pulse text-electricYellow" />
        <h1 className="text-3xl font-black tracking-widest uppercase mb-4">Requesting Camera Access</h1>
        <p className="font-bold text-gray-400">Please allow GarageOS to use your device's camera.</p>
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
          3D Model successfully generated and linked to vehicle <span className="text-white font-mono bg-[#1a1a1a] px-2">MH 12 AB 1234</span>
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
            className="flex-1 text-lg py-4 border-white text-white hover:text-[#1a1a1a]"
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
    <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col text-white overflow-hidden relative">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
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

      {/* Simulated Live Camera Feed */}
      <div className="flex-1 relative bg-[#111] overflow-hidden">
        {/* Wireframe Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-10">
          <svg viewBox="0 0 400 200" className="w-[80vw] max-w-[600px] text-electricYellow" stroke="currentColor" fill="none" strokeWidth={3} strokeDasharray="10 5">
            <path d="M50 150 L30 150 L20 120 L40 70 L120 70 L160 30 L280 30 L340 70 L380 120 L370 150 L350 150" />
            <circle cx="90" cy="150" r="30" />
            <circle cx="310" cy="150" r="30" />
          </svg>
        </div>
        
        <div className="absolute bottom-40 w-full text-center z-20">
          <p className="bg-[#1a1a1a]/80 inline-block px-4 py-2 font-black tracking-widest border-neo-sm border-electricYellow text-electricYellow text-lg animate-pulse">
            MOVE TO: FRONT-RIGHT
          </p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="h-40 bg-[#1a1a1a] border-t-4 border-electricYellow z-20 flex items-center justify-between px-8">
        <div className="w-1/3">
          <div className="flex flex-col">
            <span className="font-black text-xs text-gray-400 tracking-wider">PROGRESS</span>
            <span className="font-black text-2xl tracking-widest">{photosTaken} / {REQUIRED_PHOTOS}</span>
            <div className="w-full h-2 bg-black mt-2">
              <div 
                className="h-full bg-electricYellow transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="w-1/3 flex justify-center">
          <button 
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-[6px] border-white active:scale-95 transition-transform flex items-center justify-center bg-[#1a1a1a] group hover:border-electricYellow relative"
          >
            <div className="w-16 h-16 rounded-full bg-white group-hover:bg-electricYellow group-active:scale-90 transition-all absolute"></div>
          </button>
        </div>

        <div className="w-1/3 flex justify-end">
          {photosTaken >= REQUIRED_PHOTOS / 2 ? (
            <Button variant="primary" onClick={handleFinish} className="shadow-none">
              Finish early
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-orange font-bold text-xs max-w-[120px] text-right">
              <AlertCircle size={16} className="shrink-0" />
              Need {Math.ceil(REQUIRED_PHOTOS / 2) - photosTaken} more to finish
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
