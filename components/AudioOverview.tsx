import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { SplineScene } from './ui/spline';
import { Play, SkipForward, Volume2, Mic, Pause } from 'lucide-react';

export function AudioOverview() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 0; // No track loaded
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-reset if no duration
  useEffect(() => {
    if (duration === 0) setIsPlaying(false);
  }, [duration]);

  useEffect(() => {
    if (isPlaying && duration > 0) {
      progressInterval.current = setInterval(() => {
        setCurrentTime((prev) => (prev < duration ? prev + 1 : duration));
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }
    return () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="w-full h-[320px] bg-black border-white/10 relative overflow-hidden group shadow-2xl">
      {/* Background Visualizer - Enabled pointer events for interaction */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen grayscale">
        <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full scale-[1.2]"
        />
      </div>
      
      {/* Glass Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />

      {/* Interactive Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-8">
        
        {/* Header */}
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 backdrop-blur-md px-3 py-1 text-xs font-medium text-neutral-400 ring-1 ring-inset ring-white/10">
                    <span className="relative flex h-2 w-2">
                      <span className={`relative inline-flex rounded-full h-2 w-2 bg-neutral-600`}></span>
                    </span>
                    System Standby
                </div>
                <h3 className="text-3xl font-bold text-neutral-500 tracking-tight">No Audio Source</h3>
                <p className="text-sm text-neutral-500 max-w-[250px] font-medium leading-relaxed">
                    Upload documents to generate an audio overview.
                </p>
            </div>
            
            <div className="flex gap-2">
                 <button className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-neutral-600 cursor-not-allowed">
                    <Mic size={18} />
                 </button>
            </div>
        </div>

        {/* Player Controls */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-5 shadow-xl opacity-60">
            <button 
                disabled={true}
                className="h-14 w-14 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center cursor-not-allowed"
            >
                <Play fill="currentColor" size={24} className="ml-1" />
            </button>
            
            <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs font-medium text-neutral-500">
                    <span>--:--</span>
                    <span>--:--</span>
                </div>
                {/* Progress Bar */}
                <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="absolute h-full w-full"></div>
                </div>
            </div>
            
             <div className="flex items-center gap-1 text-neutral-600">
                <button disabled className="p-2 cursor-not-allowed"><Volume2 size={20} /></button>
                <button disabled className="p-2 cursor-not-allowed"><SkipForward size={20} /></button>
            </div>
        </div>
      </div>
    </Card>
  );
}