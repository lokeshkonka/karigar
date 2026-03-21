'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Camera, ArrowRight, Check, Loader2, RotateCcw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { extractDominantColor, estimateCarDimensions } from '@/lib/colorExtractor';
import dynamic from 'next/dynamic';
const VehicleModelViewer = dynamic(
  () => import('@/components/3d/VehicleModelViewer').then(m => m.VehicleModelViewer),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-[#1a1a1a]/20 rounded font-bold text-sm">Rendering 3D preview...</div> }
);
import { supabase } from '@/lib/supabase';

type Step = 'intro' | 'top' | 'side' | 'processing' | 'result';

const PROCESSING_STEPS = [
  'Sampling pixel matrices...',
  'Running k-means clustering (k=5)...',
  'Filtering environmental noise...',
  'Estimating hull geometry...',
  'Computing color coefficients...',
  'Assembling 3D mesh...',
  'Applying PBR material shaders...',
  'Rendering preview...',
];

export default function ScanIntakePage() {
  const { vehicleId } = useParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const topCanvasRef = useRef<HTMLCanvasElement>(null);
  const sideCanvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<Step>('intro');
  const [topDataUrl, setTopDataUrl] = useState<string | null>(null);
  const [sideDataUrl, setSideDataUrl] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [extractedColor, setExtractedColor] = useState('#888888');
  const [carScale, setCarScale] = useState({ scaleX: 1, scaleZ: 1 });
  const [saving, setSaving] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      toast.error('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  }, []);

  const capture = useCallback((type: 'top' | 'side') => {
    const video = videoRef.current;
    const canvas = type === 'top' ? topCanvasRef.current : sideCanvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    if (type === 'top') {
      setTopDataUrl(dataUrl);
      toast.success('Top view captured ✓');
      setStep('side');
    } else {
      setSideDataUrl(dataUrl);
      stopCamera();
      runAnalysis();
    }
  }, [stopCamera]);

  const runAnalysis = useCallback(async () => {
    setStep('processing');

    // Animate through processing steps
    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 380 + Math.random() * 250));
      setProcessingStep(i);
    }

    // Run the actual algorithms on the captured canvases
    await new Promise(r => setTimeout(r, 200));

    const topCanvas = topCanvasRef.current;
    const sideCanvas = sideCanvasRef.current;

    // Extract dominant color from side view (cleaner surface area)
    const color = sideCanvas
      ? extractDominantColor(sideCanvas)
      : (topCanvas ? extractDominantColor(topCanvas) : '#888888');

    // Estimate proportions from top-down view
    const scale = topCanvas ? estimateCarDimensions(topCanvas) : { scaleX: 1, scaleZ: 1 };

    setExtractedColor(color);
    setCarScale(scale);
    setStep('result');
    toast.success('3D model generated!', { duration: 3000 });
  }, []);

  const handleSaveToVehicle = async () => {
    if (!vehicleId) return;
    setSaving(true);

    const { error } = await supabase
      .from('vehicles')
      .update({
        color: extractedColor,
        scan_3d_data: {
          scaleX: carScale.scaleX,
          scaleZ: carScale.scaleZ,
          scanned_at: new Date().toISOString()
        }
      })
      .eq('id', vehicleId as string);

    setSaving(false);
    if (error) {
      toast.error('Save failed — vehicle may not be in DB yet. Model shown correctly!');
    } else {
      toast.success('Color & scan saved to vehicle profile!');
    }
  };

  const resetScan = () => {
    setStep('intro');
    setTopDataUrl(null);
    setSideDataUrl(null);
    setProcessingStep(0);
    setExtractedColor('#888888');
    setCarScale({ scaleX: 1, scaleZ: 1 });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="bg-electricYellow text-[#1a1a1a] px-4 py-3 flex justify-between items-center shrink-0 border-b-4 border-[#1a1a1a]">
        <div>
          <h1 className="font-black uppercase tracking-widest text-lg leading-none">Vehicle Scanner</h1>
          <p className="font-bold text-[10px] text-[#1a1a1a]/60 uppercase">AI Color Extraction · 3D Build</p>
        </div>
        <div className="bg-[#1a1a1a] text-electricYellow font-mono text-xs px-3 py-1.5 font-black border-2 border-[#1a1a1a]">
          ID: {String(vehicleId).slice(0, 8)}...
        </div>
      </header>

      {/* Hidden canvases for capture */}
      <canvas ref={topCanvasRef} className="hidden" />
      <canvas ref={sideCanvasRef} className="hidden" />

      <div className="flex-1 relative">

        {/* ── INTRO ── */}
        {step === 'intro' && (
          <div className="flex flex-col items-center justify-center h-full min-h-[80vh] p-6 space-y-8 text-center animate-in fade-in">
            <div className="w-28 h-28 bg-electricYellow text-[#1a1a1a] border-4 border-[#1a1a1a] flex items-center justify-center rotate-3">
              <Camera size={56} strokeWidth={2} />
            </div>

            <div>
              <h2 className="text-4xl font-black uppercase tracking-widest">Start Scan</h2>
              <p className="text-gray-400 font-bold mt-3 max-w-xs mx-auto text-sm">
                We'll take 2 photos — a <strong className="text-white">top-down</strong> and a <strong className="text-white">side profile</strong>.
                Our k-means algorithm will extract the paint color and build a 3D model.
              </p>
            </div>

            <div className="flex gap-4 text-left">
              {[
                { n: '01', label: 'Top Down', desc: 'Hold phone directly above the roof' },
                { n: '02', label: 'Side Profile', desc: 'Stand 2-3m from the side panel' },
                { n: '03', label: '3D Result', desc: 'Color-accurate model generated' },
              ].map(item => (
                <div key={item.n} className="bg-[#1a1a1a] border border-gray-800 p-4 flex-1">
                  <p className="text-electricYellow font-black text-2xl">{item.n}</p>
                  <p className="font-black uppercase text-sm mt-1">{item.label}</p>
                  <p className="text-gray-500 text-xs font-bold mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={async () => { setStep('top'); await startCamera(); }}
              className="w-full max-w-sm py-5 bg-electricYellow text-[#1a1a1a] border-4 border-[#1a1a1a] shadow-[4px_4px_0px_#FFE500] font-black uppercase text-xl tracking-wider hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              <Camera size={24} className="inline mr-3 -mt-1" /> Begin Scan
            </button>
          </div>
        )}

        {/* ── CAMERA VIEWS (Top & Side) ── */}
        {(step === 'top' || step === 'side') && (
          <div className="absolute inset-0 flex flex-col">
            {/* Video */}
            <div className="relative flex-1">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline muted autoPlay
              />

              {/* AR Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner brackets */}
                {[
                  'top-8 left-8 border-t-4 border-l-4',
                  'top-8 right-8 border-t-4 border-r-4',
                  'bottom-32 left-8 border-b-4 border-l-4',
                  'bottom-32 right-8 border-b-4 border-r-4',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-12 h-12 border-electricYellow ${cls}`} />
                ))}

                {/* Center guidance */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-electricYellow/50 w-3/4 h-1/2" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-8">
                  <div className="bg-electricYellow text-[#1a1a1a] font-black uppercase text-sm px-4 py-2 tracking-widest">
                    {step === 'top' ? '▲ TOP VIEW — Hold above roof' : '◀ SIDE VIEW — Level with door panel'}
                  </div>
                </div>

                {/* Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-electricYellow/80" />
                  <div className="absolute left-1/2 top-0 h-full w-0.5 bg-electricYellow/80" />
                </div>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="bg-[#0a0a0a] shrink-0 p-5 space-y-4 border-t-4 border-electricYellow">
              {/* Progress pills */}
              <div className="flex justify-center gap-3">
                {[
                  { label: 'TOP', done: topDataUrl !== null },
                  { label: 'SIDE', done: sideDataUrl !== null },
                  { label: '3D', done: false },
                ].map((p, i) => (
                  <div key={p.label} className={`flex items-center gap-1 px-3 py-1 text-xs font-black uppercase border-2 ${
                    p.done ? 'border-green bg-green/20 text-green' :
                    i === (step === 'top' ? 0 : 1) ? 'border-electricYellow bg-electricYellow/10 text-electricYellow' :
                    'border-gray-700 text-gray-600'
                  }`}>
                    {p.done && <Check size={12} />} {p.label}
                  </div>
                ))}
              </div>

              <button
                onClick={() => capture(step === 'top' ? 'top' : 'side')}
                className="w-full py-5 bg-electricYellow text-[#1a1a1a] font-black uppercase text-2xl tracking-wider flex items-center justify-center gap-3 border-4 border-[#1a1a1a] active:scale-95 transition-transform"
              >
                <Camera size={28} strokeWidth={2.5} />
                CAPTURE {step === 'top' ? 'TOP' : 'SIDE'} VIEW
              </button>
            </div>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-8 animate-in fade-in">
            {/* Preview thumbnails */}
            <div className="flex gap-3 w-full max-w-xs">
              {topDataUrl && (
                <div className="flex-1 border-2 border-gray-700">
                  <img src={topDataUrl} className="w-full h-24 object-cover grayscale" />
                  <p className="text-center text-[9px] font-black uppercase text-gray-600 py-1">Top View</p>
                </div>
              )}
              {sideDataUrl && (
                <div className="flex-1 border-2 border-gray-700">
                  <img src={sideDataUrl} className="w-full h-24 object-cover grayscale" />
                  <p className="text-center text-[9px] font-black uppercase text-gray-600 py-1">Side View</p>
                </div>
              )}
            </div>

            <div className="w-20 h-20 relative">
              <Loader2 size={80} className="text-electricYellow/20 animate-spin absolute inset-0" strokeWidth={1} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera size={28} className="text-electricYellow" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black uppercase">Analysing...</h2>
              <p className="font-mono text-electricYellow text-sm tracking-widest animate-pulse">
                {PROCESSING_STEPS[Math.min(processingStep, PROCESSING_STEPS.length - 1)]}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs h-2 bg-gray-800">
              <div
                className="h-full bg-electricYellow transition-all duration-300"
                style={{ width: `${((processingStep + 1) / PROCESSING_STEPS.length) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 font-bold uppercase w-full max-w-xs">
              <span>▪ K-Means k=5</span>
              <span>▪ Noise Filtering</span>
              <span>▪ Hull Geometry</span>
              <span>▪ PBR Materials</span>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {step === 'result' && (
          <div className="flex flex-col h-full min-h-[80vh]">
            {/* 3D Canvas */}
            <div className="flex-1 min-h-[55vh]">
              <VehicleModelViewer
                color={extractedColor}
                scaleX={carScale.scaleX}
                scaleZ={carScale.scaleZ}
                autoRotate={true}
                info={[
                  { label: 'Extracted Color', value: extractedColor.toUpperCase() },
                  { label: 'Width Scale', value: `${carScale.scaleX.toFixed(2)}x` },
                ]}
              />
            </div>

            {/* Result Panel */}
            <div className="bg-[#1a1a1a] border-t-4 border-electricYellow p-5 space-y-4 shrink-0">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 border-4 border-white shrink-0"
                  style={{ backgroundColor: extractedColor }}
                />
                <div>
                  <p className="font-black uppercase text-lg text-white">Model Complete</p>
                  <p className="font-mono text-electricYellow text-sm">{extractedColor.toUpperCase()}</p>
                  <p className="text-gray-500 text-xs font-bold">K-Means color extraction · PBR rendering</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetScan}
                  className="flex-1 py-3 border-2 border-gray-700 text-gray-400 font-black uppercase text-sm flex items-center justify-center gap-2 hover:border-white hover:text-white transition-colors"
                >
                  <RotateCcw size={16} /> Rescan
                </button>
                <button
                  onClick={handleSaveToVehicle}
                  disabled={saving}
                  className="flex-1 py-3 bg-electricYellow text-[#1a1a1a] border-2 border-electricYellow font-black uppercase text-sm flex items-center justify-center gap-2 hover:brightness-90 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save to Vehicle'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
