import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Activity, AlertTriangle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { cn, base64ToUint8Array, uint8ArrayToBase64, decodeAudioData } from '../lib/utils';
import { SplineScene } from './ui/spline';

interface LiveSessionProps {
  onClose: () => void;
}

export function LiveSession({ onClose }: LiveSessionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [volume, setVolume] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Audio Input Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastVolumeUpdateRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    let cleanupFunc: (() => void) | undefined;

    const startSession = async () => {
        try {
            if (!process.env.API_KEY) throw new Error("API Key Missing");
            
            // 1. Get User Media first to fail fast on permissions
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            } catch (err: any) {
                console.error("Media Access Error:", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    throw new Error("PermissionDenied");
                } else if (err.name === 'NotFoundError') {
                     // Try audio only if video not found
                     try {
                        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        setIsVideoOn(false); // Force video off state
                     } catch (audioErr) {
                        throw new Error("NoDeviceFound");
                     }
                } else {
                    throw err;
                }
            }

            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => { /* ignore play errors */ });
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Audio Output Context - Handle AudioContext possibly not being available immediately
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
            
            // Resume context immediately in case it's suspended (browser policy)
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const outputNode = audioContextRef.current.createGain();
            outputNode.connect(audioContextRef.current.destination);

            // Audio Input Context
            inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
            if (inputAudioContextRef.current.state === 'suspended') {
                await inputAudioContextRef.current.resume();
            }

            // Create a silence node to prevent feedback loop (Mic -> Speaker)
            const silenceNode = inputAudioContextRef.current.createGain();
            silenceNode.gain.value = 0;
            silenceNode.connect(inputAudioContextRef.current.destination);

            // Connect to Gemini Live
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        if (!mounted) return;
                        setIsConnected(true);
                        nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;

                        // Setup Audio Input Streaming
                        if (inputAudioContextRef.current && stream) {
                            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                            // Use smaller buffer size (2048) for lower latency
                            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(2048, 1, 1);
                            processorRef.current = scriptProcessor;

                            scriptProcessor.onaudioprocess = (e) => {
                                if (!isMicOn) return; 
                                
                                const inputData = e.inputBuffer.getChannelData(0);
                                
                                // Calculate volume for visualizer (throttled)
                                const now = Date.now();
                                if (now - lastVolumeUpdateRef.current > 100) {
                                    let sum = 0;
                                    for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                                    const rms = Math.sqrt(sum / inputData.length);
                                    setVolume(Math.min(rms * 100 * 3, 100)); // Boost sensitivity
                                    lastVolumeUpdateRef.current = now;
                                }

                                // PCM16 Conversion
                                const l = inputData.length;
                                const int16 = new Int16Array(l);
                                for (let i = 0; i < l; i++) {
                                    int16[i] = inputData[i] * 32768;
                                }
                                const base64Data = uint8ArrayToBase64(new Uint8Array(int16.buffer));

                                sessionPromise.then((session) => {
                                    session.sendRealtimeInput({ 
                                        media: {
                                            mimeType: 'audio/pcm;rate=16000',
                                            data: base64Data
                                        } 
                                    });
                                });
                            };
                            
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(silenceNode);
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (!mounted) return;
                        
                        // Handle Interruption
                        if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(source => {
                                try { source.stop(); } catch(e) {}
                            });
                            sourcesRef.current.clear();
                            // Reset audio cursor to current time
                            if (audioContextRef.current) {
                                nextStartTimeRef.current = audioContextRef.current.currentTime;
                            }
                            return;
                        }

                        // Handle Audio Output
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && audioContextRef.current) {
                            const ctx = audioContextRef.current;
                            
                            // Ensure next start time is at least current time
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            
                            try {
                                const audioBuffer = await decodeAudioData(
                                    base64ToUint8Array(audioData),
                                    ctx,
                                    24000,
                                    1
                                );

                                const source = ctx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputNode);
                                source.addEventListener('ended', () => {
                                    sourcesRef.current.delete(source);
                                });
                                
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                sourcesRef.current.add(source);
                            } catch (err) {
                                console.error("Audio decoding error:", err);
                            }
                        }
                    },
                    onclose: () => {
                        console.log("Live session closed");
                        if (mounted) setIsConnected(false);
                    },
                    onerror: (e) => {
                        console.error("Live session error", e);
                        setErrorMsg("Connection Lost");
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                    },
                    systemInstruction: "You are a helpful, witty, and concise AI tutor. We are in a real-time voice call. Keep responses relatively short and conversational."
                }
            });
            
            // Handle initial connection failure (e.g. Quota Exceeded)
            sessionPromise.catch(e => {
                const isQuota = e.message?.includes('429') || e.status === 429 || e.toString().includes('Quota');
                if (isQuota) {
                    setErrorMsg("Quota Exceeded (Rate Limit). Try again later.");
                } else {
                    setErrorMsg("Failed to establish neural link.");
                }
                setIsConnected(false);
            });
            
            // Video Streaming Interval
            const videoInterval = setInterval(async () => {
                if (!mounted || !isVideoOn || !videoRef.current) return;
                
                const canvas = canvasRef.current;
                const video = videoRef.current;
                if (video.readyState < 2) return; 

                canvas.width = video.videoWidth / 4; 
                canvas.height = video.videoHeight / 4;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                    
                    sessionPromise.then(session => {
                        if (isConnected) {
                             session.sendRealtimeInput({
                                media: {
                                    mimeType: 'image/jpeg',
                                    data: base64
                                }
                             });
                        }
                    }).catch(() => {});
                }
            }, 1000); 

            cleanupFunc = () => {
                clearInterval(videoInterval);
                sessionPromise.then(session => session.close()).catch(() => {});
            };

        } catch (e: any) {
            console.error("Failed to start session", e);
            const isQuota = e.message?.includes('429') || e.status === 429 || e.toString().includes('Quota');
            const isPermission = e.message === 'PermissionDenied' || e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError';
            
            if (isQuota) {
                setErrorMsg("Quota Limit Reached.");
            } else if (isPermission) {
                setErrorMsg("Permission Denied: Please allow Camera/Mic access.");
            } else if (e.message === 'NoDeviceFound') {
                setErrorMsg("No input devices found.");
            } else {
                setErrorMsg("Microphone/Camera access denied or API error.");
            }
        }
    };

    startSession();

    return () => {
        mounted = false;
        if (cleanupFunc) cleanupFunc();
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (audioContextRef.current) audioContextRef.current.close();
        if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        {/* Background Visuals */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="w-full h-full" />
        </div>
        
        {/* Connection Status */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-neutral-900/50 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
            <div className={cn("w-2 h-2 rounded-full", errorMsg ? "bg-red-500" : isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500")} />
            <span className={cn("text-xs font-medium tracking-wide", errorMsg ? "text-red-400" : "text-white")}>
                {errorMsg ? errorMsg.toUpperCase() : isConnected ? "LIVE NEURAL LINK ACTIVE" : "ESTABLISHING CONNECTION..."}
            </span>
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-4xl aspect-video bg-neutral-900/80 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row">
            
            {/* User Camera */}
            <div className="relative flex-1 bg-black overflow-hidden group">
                 {errorMsg ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-6 text-center animate-in fade-in">
                         <AlertTriangle size={48} className="mb-4" />
                         <p className="font-bold">Connection Failed</p>
                         <p className="text-sm opacity-70 mt-2">{errorMsg}</p>
                         {errorMsg.includes('Permission') && (
                             <button onClick={onClose} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm">
                                Close & Retry
                             </button>
                         )}
                     </div>
                 ) : (
                    <>
                        <video 
                            ref={videoRef} 
                            className={cn("w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500", !isVideoOn && "opacity-0")} 
                            muted 
                            playsInline 
                        />
                        {!isVideoOn && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center animate-in zoom-in">
                                    <VideoOff className="text-neutral-500" />
                                </div>
                            </div>
                        )}
                        
                        {/* Audio Visualizer Overlay */}
                        <div className="absolute bottom-6 left-6 flex gap-1 items-end h-8 z-10">
                             {[...Array(5)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="w-1.5 bg-indigo-500 rounded-full transition-all duration-75 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    style={{ height: `${Math.max(4, volume * (1 + Math.random()))}px` }}
                                />
                             ))}
                        </div>
                    </>
                 )}
            </div>

            {/* AI Avatar / Status */}
            <div className="flex-1 bg-gradient-to-br from-indigo-950/50 to-black flex items-center justify-center relative border-t md:border-t-0 md:border-l border-white/5">
                <div className="relative group cursor-pointer">
                    <div className={cn("absolute inset-0 bg-indigo-500/30 blur-[60px] transition-all duration-1000", isConnected ? "opacity-100" : "opacity-0")} />
                    <div className="w-40 h-40 rounded-full border border-white/10 flex items-center justify-center relative bg-black/50 backdrop-blur-sm z-10 shadow-2xl">
                         {/* Dynamic Activity Indicator */}
                         <div className={cn(
                             "w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-1000",
                             isConnected ? "animate-spin [animation-duration:4s]" : "scale-90 opacity-50 grayscale",
                             errorMsg && "from-red-900 to-red-950 opacity-100 grayscale-0"
                         )} />
                         
                         <div className="absolute inset-0 flex items-center justify-center">
                            {errorMsg ? (
                                <AlertTriangle className="text-red-500" size={32} />
                            ) : (
                                <Activity className={cn("text-white transition-opacity", isConnected ? "opacity-100" : "opacity-50")} size={32} />
                            )}
                         </div>
                    </div>
                </div>
                <div className="absolute bottom-8 text-center">
                    <h3 className="text-white font-bold text-lg tracking-tight">HyperMind AI</h3>
                    <p className={cn("text-indigo-300 text-sm font-medium transition-opacity", isConnected ? "animate-pulse" : "opacity-50")}>
                        {errorMsg ? "System Offline" : isConnected ? "Listening & Watching" : "Offline"}
                    </p>
                </div>
            </div>

        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center gap-6 z-20">
            <button 
                onClick={() => setIsMicOn(!isMicOn)}
                disabled={!!errorMsg}
                className={cn("p-4 rounded-full transition-all duration-200 hover:scale-110 active:scale-95", isMicOn && !errorMsg ? "bg-neutral-800 hover:bg-neutral-700 text-white" : "bg-red-500/20 text-red-500 border border-red-500/50")}
            >
                {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            
            <button 
                onClick={onClose}
                className="p-6 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 active:scale-95"
            >
                <PhoneOff size={32} fill="currentColor" />
            </button>

            <button 
                onClick={() => setIsVideoOn(!isVideoOn)}
                disabled={!!errorMsg}
                className={cn("p-4 rounded-full transition-all duration-200 hover:scale-110 active:scale-95", isVideoOn && !errorMsg ? "bg-neutral-800 hover:bg-neutral-700 text-white" : "bg-red-500/20 text-red-500 border border-red-500/50")}
            >
                {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
        </div>
    </div>
  );
}