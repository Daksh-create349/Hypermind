import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Paperclip, Bot, FileText, Copy, ThumbsUp, Loader2, BookOpen, BrainCircuit, Play, Volume2, StopCircle, X, Flame, Phone } from 'lucide-react';
import { GoogleGenAI, Chat } from "@google/genai";
import { cn, blobToBase64, extractTextFromPdf, parseJsonFromText } from '../lib/utils';
import { marked } from 'marked';
import { GenUI } from './GenUI';
import { Quiz } from './Quiz';
import { Diagram } from './Diagram';
import { LiveSession } from './LiveSession';

export interface Topic {
    id: number;
    title: string;
    description: string;
}

export interface Message {
    id: number | string;
    role: 'user' | 'ai';
    content: string;
    htmlContent?: string;
    timestamp?: string;
    isError?: boolean;
    citations?: any[];
    isCurriculum?: boolean;
    curriculumData?: Topic[];
    isLessonComplete?: boolean;
    genUiType?: string;
    genUiData?: any[];
    genUiConfig?: any;
    quizData?: any;
    diagramData?: any;
    images?: string[];
}

export interface ChatInterfaceProps {
    mode?: string;
    sessionId?: string;
    initialMessages?: Message[];
    onMessagesChange?: (messages: Message[]) => void;
    userData?: any;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode = 'learn', sessionId, initialMessages = [], onMessagesChange, userData }) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [currentMode, setCurrentMode] = useState(mode);
  const [speakingId, setSpeakingId] = useState<number | string | null>(null);
  const [attachedImages, setAttachedImages] = useState<{data: string, mime: string}[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  
  // Default to true if no messages, so we show loader immediately instead of black screen
  const [isGeneratingCurriculum, setIsGeneratingCurriculum] = useState(initialMessages.length === 0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedPath = useRef(false);
  
  useEffect(() => {
    setMessages(initialMessages);
  }, [sessionId, initialMessages]);

  useEffect(() => {
    if (mode !== currentMode) {
        setCurrentMode(mode);
        if (initialMessages.length === 0) {
            setMessages([]);
            setChatSession(null);
            hasInitializedPath.current = false;
            setIsGeneratingCurriculum(true); // Reset loader for new mode
        }
    }
  }, [mode, currentMode, initialMessages]);

  useEffect(() => {
    if (onMessagesChange && messages !== initialMessages) {
        onMessagesChange(messages);
    }
  }, [messages, onMessagesChange, initialMessages]);

  useEffect(() => {
    if ((window as any).Prism) {
        try { (window as any).Prism.highlightAll(); } catch (e) {}
    }
  }, [messages]);

  // Initialization & Safety Timeout
  useEffect(() => {
      // Safety: If after 10s we are still loading and have no session/messages, kill the loader
      const timer = setTimeout(() => {
          if (isGeneratingCurriculum && messages.length === 0) {
              setIsGeneratingCurriculum(false);
              setMessages([{
                  id: 'timeout',
                  role: 'ai',
                  content: "System ready. Please enter a topic to begin.",
                  htmlContent: "<p>System ready. Please enter a topic to begin.</p>"
              }]);
          }
      }, 10000);
      return () => clearTimeout(timer);
  }, [isGeneratingCurriculum, messages.length]);

  useEffect(() => {
    const initChat = async () => {
        if (!process.env.API_KEY) {
            console.error("API Key missing");
            setIsGeneratingCurriculum(false);
            return;
        }
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let systemInstruction = `You are HyperMind. 
            Output JSON for:
            1. Charts: { "genUi": { "type": "line-chart", ... } }
            2. Quizzes: { "quiz": { "questions": [...] } }
            3. Diagrams: { "diagram": { "nodes": [], "edges": [] } }
            4. Curriculum: { "curriculum": [...] }
            Separate JSON from text.
            If the user asks for a learning path, ALWAYS provide a diagram.
            `;
            
            if (currentMode === 'practice') systemInstruction += " Quiz mode active.";
            else if (currentMode === 'debate') systemInstruction += " Debate mode active.";

            const history = messages
                .filter(m => m.id !== 'init' && m.id !== 'timeout' && !m.isError)
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }));

            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
                history: history
            });

            setChatSession(chat);

        } catch (error) {
            console.error("Failed to initialize AI", error);
            setIsGeneratingCurriculum(false);
        }
    };
    initChat();
  }, [currentMode, sessionId]);

  // Automatic Flowchart Generation
  useEffect(() => {
    const generateInitialCurriculum = async () => {
        // Only run if we have a session, haven't run it yet, and there are no real messages
        if (chatSession && !hasInitializedPath.current && messages.length === 0) {
            hasInitializedPath.current = true;
            setIsGeneratingCurriculum(true);
            
            // Use user subjects or a default interesting topic
            const subjects = userData?.subjects?.join(", ") || "Artificial Intelligence Evolution";
            
            const prompt = `
                Generate a comprehensive hierarchical Learning Path flowchart for: ${subjects}.
                Format: JSON only with key "diagram".
                The flowchart should start with a root node (The Subject) and branch into 3-4 major concepts, then sub-concepts.
                Output Example:
                { "diagram": { "title": "${subjects} Roadmap", "nodes": [{ "id": "1", "label": "Start" }], "edges": [] } }
            `;
            
            try {
                // Ensure UI is clear
                setMessages([]); 
                await handleSendMessage(prompt, true);
            } catch (e) {
                // Silent catch for auto-generation, handleSendMessage handles the rest
            } finally {
                setIsGeneratingCurriculum(false);
            }
        } else if (messages.length > 0) {
            // If messages already exist (restored session), stop loading
            setIsGeneratingCurriculum(false);
        }
    };

    generateInitialCurriculum();
  }, [chatSession, userData, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
        setTimeout(() => scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
    }
  }, [messages, isTyping]);

  const processResponse = (text: string): Partial<Message> => {
    let content = text;
    let isCurriculum = false;
    let curriculumData: Topic[] = [];
    let genUiType, genUiData, genUiConfig;
    let quizData;
    let diagramData;

    // Use robust parser
    const rawJson = parseJsonFromText(text);
    const json = Array.isArray(rawJson) ? rawJson[0] : rawJson;

    if (json) {
        if (json.genUi) {
            genUiType = json.genUi.type;
            genUiData = json.genUi.data;
            genUiConfig = json.genUi.config;
        }
        if (json.quiz) {
            quizData = json.quiz;
        }
        if (json.diagram) {
            diagramData = json.diagram;
        }
        if (json.curriculum) {
            isCurriculum = true;
            curriculumData = json.curriculum;
        }
        
        // Remove the JSON string from content
        content = content.replace(JSON.stringify(rawJson), '') // Try removing raw
                         .replace(JSON.stringify(json), '')    // Try removing unwrapped
                         .replace(/```json[\s\S]*```/, '')
                         .replace(/\{[\s\S]*\}/g, match => {
                             // Only remove if it looks like the parsed json
                             return match.length > 20 ? '' : match; 
                         })
                         .trim();
    }

    if (quizData || diagramData || isCurriculum) {
         if (!content || content.length < 10) content = "I've visualized the learning path below.";
    }

    const htmlContent = marked.parse(content || " ") as string;

    return { content, isCurriculum, curriculumData, htmlContent, genUiType, genUiData, genUiConfig, quizData, diagramData };
  };

  const handleSendMessage = async (text: string = inputValue, hidden: boolean = false) => {
    if ((!text.trim() && attachedImages.length === 0) || !chatSession) return;

    const userText = text.trim();
    if (!hidden) {
        const userMsg: Message = {
            id: Date.now(),
            role: 'user',
            content: userText,
            images: attachedImages.map(img => img.data),
            timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setAttachedImages([]);
    }

    setIsTyping(true);

    try {
        const result = await chatSession.sendMessage({ message: userText });
        const processed = processResponse(result.text);

        const aiMsg: Message = {
            id: Date.now() + 1,
            role: 'ai',
            content: processed.content || "",
            ...processed,
            timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, aiMsg]);

    } catch (error: any) {
        const isQuota = error.message?.includes('429') || error.status === 429 || error.toString().includes('Quota');
        
        if (!isQuota) {
             console.error("AI Error:", error);
        } else {
             console.warn("Quota exceeded in Chat. Triggering fallback.");
        }

        // Fallback Logic for Quota Exceeded or Network Error
        if (hidden && messages.length <= 1) {
            // If this error happened during initial auto-generation, show a fallback curriculum
            const subjects = userData?.subjects?.join(", ") || "Learning Path";
            const fallbackDiagram = {
                 title: `${subjects} (Offline Mode)`,
                 nodes: [
                     { id: "1", label: "Start Here" },
                     { id: "2", label: "Fundamentals" },
                     { id: "3", label: "Core Concepts" },
                     { id: "4", label: "Advanced Practice" }
                 ],
                 edges: [
                     { id: "e1-2", source: "1", target: "2" },
                     { id: "e2-3", source: "2", target: "3" },
                     { id: "e3-4", source: "3", target: "4" }
                 ]
             };
             
             const fallbackMsg: Message = {
                id: Date.now() + 1,
                role: 'ai',
                content: "I'm detecting high network traffic (Quota Limit). I've generated a standard learning path template for you to begin with.",
                htmlContent: "<p>I'm detecting high network traffic (Quota Limit). I've generated a standard learning path template for you to begin with.</p>",
                diagramData: fallbackDiagram,
                timestamp: new Date().toLocaleTimeString()
             };
             setMessages(prev => [...prev, fallbackMsg]);
        } else {
             const errorContent = isQuota 
                ? "My cognitive resources are currently exhausted (Rate Limit Reached). Please wait a moment before trying again."
                : "I encountered a connection error. Please try again.";
                
             const errorMsg: Message = {
                id: Date.now() + 1,
                role: 'ai',
                content: errorContent,
                htmlContent: `<p class="text-red-400 font-bold">${errorContent}</p>`,
                isError: true,
                timestamp: new Date().toLocaleTimeString()
             };
             setMessages(prev => [...prev, errorMsg]);
        }
    } finally {
        setIsTyping(false);
        setIsGeneratingCurriculum(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsProcessingFile(true);
      try {
          if (file.type === 'application/pdf') {
              const text = await extractTextFromPdf(file);
              handleSendMessage(`PDF: ${text.substring(0, 10000)}... Analyze.`);
          } else if (file.type.startsWith('image/')) {
              const base64 = await blobToBase64(file);
              setAttachedImages(prev => [...prev, { data: base64, mime: file.type }]);
          }
      } finally {
          setIsProcessingFile(false);
      }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Live Button */}
          <button 
             onClick={() => setIsLiveOpen(true)}
             className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all animate-pulse"
             title="Start Live Voice Session"
          >
              <Phone size={16} fill="currentColor" />
          </button>
          
          <div className="flex bg-black/50 backdrop-blur rounded-full border border-white/10 p-1">
              {['learn', 'practice', 'debate'].map(m => (
                  <button key={m} onClick={() => setCurrentMode(m)} className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase", currentMode === m ? "bg-indigo-600 text-white" : "text-neutral-500")}>{m}</button>
              ))}
          </div>
      </div>

      {isLiveOpen && <LiveSession onClose={() => setIsLiveOpen(false)} />}

      {isGeneratingCurriculum && (
          <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-700">
               <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin" />
                    <div className="absolute inset-4 border-r-2 border-purple-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
                    <BrainCircuit className="absolute inset-0 m-auto text-white animate-pulse" size={48} />
               </div>
               <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Architecting Learning Path</h2>
               <p className="text-neutral-400 font-mono text-sm animate-pulse">Analyzing Prerequisites • Mapping Nodes</p>
          </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 no-scrollbar pb-32">
        {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]", msg.role === 'user' ? "bg-neutral-800" : (msg.isError ? "bg-red-900/50" : "bg-indigo-600"))}>
                    {msg.role === 'user' ? "ME" : <BrainCircuit size={20} className="text-white" />}
                </div>
                <div className={cn("flex flex-col gap-2 max-w-[85%]", msg.role === 'user' ? "items-end" : "w-full")}>
                    <div className={cn("rounded-2xl px-6 py-4", msg.role === 'user' ? "bg-neutral-800 text-white" : "bg-transparent text-neutral-200 p-0")}>
                        {msg.role === 'ai' ? (
                            <>
                                {msg.content && <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: msg.htmlContent || '' }} />}
                                {msg.genUiType && <GenUI type={msg.genUiType} data={msg.genUiData} config={msg.genUiConfig} />}
                                {msg.quizData && <Quiz data={msg.quizData} />}
                                {msg.diagramData && <Diagram data={msg.diagramData} />}
                                {msg.isCurriculum && msg.curriculumData && (
                                    <div className="w-full bg-neutral-900 border border-indigo-500 rounded-xl p-4 mt-4">
                                        <h3 className="font-bold text-white mb-4">Curriculum</h3>
                                        {msg.curriculumData.map(t => (
                                            <div key={t.id} className="mb-2 text-sm text-neutral-300">• {t.title}</div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <p>{msg.content}</p>
                        )}
                    </div>
                </div>
            </div>
        ))}
        {isTyping && !isGeneratingCurriculum && (
            <div className="ml-14 flex items-center gap-2 text-neutral-500 text-sm">
                <Loader2 size={14} className="animate-spin" /> Thinking...
            </div>
        )}
      </div>

      <div className="w-full px-4 md:px-8 pb-6 pt-4 z-20 absolute bottom-0">
          <div className="relative bg-neutral-900 border border-white/10 rounded-3xl flex items-center p-2 shadow-2xl">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload} 
              />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-neutral-400 hover:text-white transition-colors"><Paperclip size={20}/></button>
              <input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask follow-up questions..."
                className="flex-1 bg-transparent border-0 text-white placeholder:text-neutral-500 focus:outline-none px-4"
              />
              <button onClick={() => handleSendMessage()} className="p-3 bg-white text-black rounded-full hover:bg-neutral-200 transition-colors"><Send size={18} /></button>
          </div>
      </div>
    </div>
  );
}