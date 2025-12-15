import React, { useState } from 'react';
import { SplineSceneBasic } from './components/SplineSceneBasic';
import { Onboarding } from './components/Onboarding';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Spotlight } from './components/ui/spotlight';
import { BrainCircuit } from 'lucide-react';

export default function App() {
    const [hasStarted, setHasStarted] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [showLanding, setShowLanding] = useState(true);

    const handleStart = () => {
        setHasStarted(true);
        setTimeout(() => setShowLanding(false), 1200); // Wait for transition + buffer
    };

    const handleOnboardingComplete = (data: any) => {
        setUserData(data);
        setIsOnboarded(true);
    };

    return (
        <div className="h-screen w-full bg-black flex overflow-hidden relative selection:bg-white/30">
            {/* Global Background Spotlight */}
            <Spotlight className="-top-40 left-0 opacity-40 z-0" fill="white" />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative z-10 p-0">

                {/* Header Area (Visible only during Onboarding) */}
                {!isOnboarded && (
                    <header className={`h-16 border-b border-white/10 flex items-center px-6 justify-between bg-black/40 backdrop-blur-sm ${!hasStarted ? 'hidden' : 'flex'} z-50`}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                                <BrainCircuit size={18} className="text-black" />
                            </div>
                            <span className="font-bold text-white text-lg tracking-tight">HyperMind</span>
                        </div>
                    </header>
                )}

                <main className="flex-1 overflow-hidden p-0 flex flex-col relative w-full h-full">

                    {/* 1. Landing & Auth Layer */}
                    {showLanding && (
                        <div className={`absolute inset-0 z-30 transition-all duration-1000 ease-in-out transform will-change-transform ${hasStarted ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                            <SplineSceneBasic onStart={handleStart} />
                        </div>
                    )}

                    {/* 2. Application Layer */}
                    <div className={`absolute inset-0 flex flex-col h-full w-full transition-all duration-1000 delay-300 will-change-transform ${hasStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
                        <ErrorBoundary>
                            {!isOnboarded ? (
                                // Onboarding Screen (Includes Dashboard Summary Step)
                                <div className="flex-1 min-h-0 animate-in fade-in zoom-in-95 duration-700 p-6 md:p-8">
                                    <Onboarding onComplete={handleOnboardingComplete} />
                                </div>
                            ) : (
                                // Main App (Sidebar + Chat)
                                <div className="flex h-full w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    <Sidebar mode={userData.mode || 'learn'} className="w-64 hidden md:flex border-r border-white/10" />
                                    <div className="flex-1 h-full relative flex flex-col min-w-0 bg-neutral-950">
                                        <ChatInterface mode="learn" userData={userData} />
                                    </div>
                                </div>
                            )}
                        </ErrorBoundary>
                    </div>

                </main>
            </div>
        </div>
    );
}