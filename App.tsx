import React, { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { SplineSceneBasic } from './components/SplineSceneBasic';
import { Spotlight } from './components/ui/spotlight';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [mode, setMode] = useState('fast');

  const handleStart = (selectedMode: string) => {
    setMode(selectedMode);
    setHasStarted(true);
  };

  return (
    <div className="h-screen w-full bg-black flex overflow-hidden relative selection:bg-indigo-500/30">
       {/* Global Background Spotlight */}
       <Spotlight className="-top-40 left-0 opacity-40 z-0" fill="white" />

       {/* Main Content Area */}
       <div className="flex-1 flex flex-col h-full relative z-10">
          
          {/* Header Area */}
          <header className={`h-16 border-b border-white/5 flex items-center px-6 justify-between bg-black/40 backdrop-blur-sm ${!hasStarted ? 'hidden' : 'flex'}`}>
             <div className="flex items-center gap-2">
                 <span className="font-bold text-white text-lg tracking-tight">HyperMind</span>
                 <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">BETA 2.0</span>
             </div>
          </header>

          <main className="flex-1 overflow-hidden p-0 md:p-6 flex flex-col gap-6 relative">
            
            <div className={`absolute inset-0 z-30 transition-all duration-700 ease-in-out transform ${hasStarted ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                 <SplineSceneBasic onStart={handleStart} />
            </div>

            <div className={`flex flex-col h-full gap-6 transition-all duration-1000 delay-300 ${hasStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
                {/* Chat - Full Height */}
                <div className="flex-1 min-h-0 bg-neutral-900/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    <ChatInterface mode={mode} />
                </div>
            </div>
            
          </main>
       </div>
    </div>
  );
}