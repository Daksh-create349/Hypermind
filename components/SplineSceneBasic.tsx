'use client'

import React, { useState } from 'react'
import { SplineScene } from "./ui/spline";
import { Card } from "./ui/card"
import { Spotlight } from "./ui/spotlight"
import { ArrowRight, BookOpen, BrainCircuit, Check, Mail, Lock, Github, ArrowLeft, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
    onStart: (mode: string) => void;
}
 
export function SplineSceneBasic({ onStart }: Props) {
  const [step, setStep] = useState<'intro' | 'auth' | 'config'>('intro');
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAuth(true);
    // Simulate auth delay
    setTimeout(() => {
        setIsLoadingAuth(false);
        setStep('config');
    }, 1000);
  };

  const handleLaunch = () => {
    if (!selectedMode) return;
    setIsLaunching(true);
    // Simulate initialization delay for effect
    setTimeout(() => {
        onStart(selectedMode);
    }, 1500);
  };

  const modes = [
    {
        id: 'learn',
        title: 'Concept Tutor',
        desc: 'Deep explanations, analogies, and step-by-step reasoning.',
        icon: BookOpen
    },
    {
        id: 'practice',
        title: 'Practice & Quiz',
        desc: 'Generate problems, flashcards, and test your knowledge.',
        icon: BrainCircuit
    }
  ];

  return (
    <Card className="w-full h-full bg-black/[0.96] relative overflow-hidden border-neutral-800 flex flex-col shadow-2xl">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      
      <div className="relative w-full h-full flex flex-col md:block">
        
        {/* ROBOT CONTAINER */}
        {/* Intro: Right (left: 50%) | Auth: Left (left: 0) */}
        <div className={cn(
            "relative h-[400px] md:h-full w-full md:w-[50%] transition-all duration-1000 ease-in-out z-0",
            step === 'intro' ? "md:left-[50%]" : "md:left-0"
        )}>
             <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10 pointer-events-none" />
             <div className={cn("w-full h-full transition-opacity duration-1000", step === 'intro' ? "opacity-90" : "opacity-60")}>
                <SplineScene 
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full"
                />
             </div>
        </div>

        {/* INTRO TEXT (LEFT PANEL) */}
        {/* Visible when step is 'intro' */}
        <div className={cn(
            "md:absolute inset-y-0 left-0 w-full md:w-[50%] p-8 md:p-16 flex flex-col justify-center transition-all duration-1000 ease-in-out z-10",
            step === 'intro' 
                ? "opacity-100 translate-x-0 pointer-events-auto" 
                : "opacity-0 -translate-x-full pointer-events-none"
        )}>
            <div className="flex flex-col justify-center h-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 w-fit mb-6">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"/>
                    <span className="text-xs font-medium text-neutral-300">Adaptive Learning Engine</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-600 tracking-tight">
                    HyperMind
                </h1>
                <p className="mt-6 text-lg text-neutral-400 max-w-lg leading-relaxed">
                    Your personal AI Learning Companion. Democratizing high-quality education with adaptive pathways, instant practice generation, and accessible tutoring.
                </p>

                <button 
                    onClick={() => setStep('auth')}
                    className="mt-10 group relative w-fit flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-neutral-100 transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                    Start Learning
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>

        {/* AUTH & CONFIG (RIGHT PANEL) */}
        {/* Visible when step is 'auth' or 'config' */}
        <div className={cn(
            "md:absolute inset-y-0 right-0 w-full md:w-[50%] p-8 md:p-16 flex flex-col justify-center transition-all duration-1000 ease-in-out z-10",
            (step === 'auth' || step === 'config') 
                ? "opacity-100 translate-x-0 pointer-events-auto" 
                : "opacity-0 translate-x-full pointer-events-none"
        )}>
            
            {/* AUTH FORM */}
            <div className={cn(
                "absolute inset-0 p-8 md:p-16 flex flex-col justify-center transition-all duration-500",
                step === 'auth' ? "opacity-100 scale-100 delay-500 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
            )}>
                 <div className="w-full max-w-md mx-auto">
                    <button 
                        onClick={() => setStep('intro')} 
                        className="flex items-center gap-2 text-neutral-500 hover:text-white mb-8 transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back
                    </button>

                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-neutral-400 mb-8">Sign in to continue your learning journey.</p>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-neutral-300 ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:bg-neutral-900 transition-all"
                                    placeholder="student@hypermind.ai"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-neutral-300 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:bg-neutral-900 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoadingAuth}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-500 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait mt-4"
                        >
                            {isLoadingAuth ? "Authenticating..." : "Sign In"}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-black/90 px-2 text-neutral-500">Or continue with</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" className="flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-white py-2.5 rounded-xl transition-all">
                            <Github size={18} /> GitHub
                        </button>
                        <button type="button" className="flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-white py-2.5 rounded-xl transition-all">
                            <Globe size={18} /> Google
                        </button>
                    </div>
                 </div>
            </div>

            {/* CONFIG STEP */}
            <div className={cn(
                "absolute inset-0 p-8 md:p-16 flex flex-col justify-center transition-all duration-500",
                step === 'config' ? "opacity-100 scale-100 delay-200 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
            )}>
                 <div className="mb-8">
                    <button 
                        onClick={() => setStep('auth')} 
                        className="flex items-center gap-2 text-neutral-500 hover:text-white mb-6 transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back
                    </button>
                    <h2 className="text-3xl font-bold text-white mb-2">Initialize Session</h2>
                    <p className="text-neutral-400">Select your preferred learning mode.</p>
                 </div>

                 <div className="grid grid-cols-1 gap-4 mb-8 max-w-lg">
                    {modes.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setSelectedMode(mode.id)}
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left group",
                                selectedMode === mode.id 
                                    ? "bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]" 
                                    : "bg-neutral-900/50 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors shrink-0",
                                selectedMode === mode.id ? "bg-indigo-500 text-white" : "bg-neutral-800 text-neutral-400 group-hover:text-white"
                            )}>
                                <mode.icon size={20} />
                            </div>
                            <div>
                                <h3 className={cn("font-medium mb-1", selectedMode === mode.id ? "text-white" : "text-neutral-300")}>
                                    {mode.title}
                                </h3>
                                <p className="text-xs text-neutral-500 leading-relaxed">
                                    {mode.desc}
                                </p>
                            </div>
                        </button>
                    ))}
                 </div>

                 <div className="flex items-center gap-4">
                    <button 
                        onClick={handleLaunch}
                        disabled={!selectedMode || isLaunching}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-lg hover:bg-indigo-500",
                            !selectedMode ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]",
                            isLaunching && "animate-pulse cursor-wait"
                        )}
                    >
                        {isLaunching ? (
                            <>Initializing Neural Link...</>
                        ) : (
                            <>
                                Launch Session <Check size={18} />
                            </>
                        )}
                    </button>
                 </div>
            </div>

        </div>

      </div>
    </Card>
  )
}