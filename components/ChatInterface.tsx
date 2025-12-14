import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Paperclip, Bot, FileText, Copy, ThumbsUp, Loader2, BookOpen, BrainCircuit, ArrowRight, CheckCircle2, Circle, Play, Volume2, StopCircle, Image as ImageIcon, X, Flame } from 'lucide-react';
import { GoogleGenAI, Chat } from "@google/genai";
import { cn, blobToBase64, extractTextFromPdf } from '../lib/utils';
import { marked } from 'marked';
import { GenUI } from './GenUI';
import { Quiz } from './Quiz';
import { Diagram } from './Diagram';

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
    // Custom UI states
    isCurriculum?: boolean;
    curriculumData?: Topic[];
    isLessonComplete?: boolean;
    genUiType?: string;
    genUiData?: any[];
    genUiConfig?: any;
    quizData?: any; // Data for interactive quiz
    diagramData?: any; // Data for flowcharts/mindmaps
    images?: string[]; // base64 images
}

export interface ChatInterfaceProps {
    mode?: string;
    sessionId?: string;
    initialMessages?: Message[];
    onMessagesChange?: (messages: Message[]) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode = 'learn', sessionId, initialMessages = [], onMessagesChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [currentMode, setCurrentMode] = useState(mode);
  const [isFocused, setIsFocused] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | string | null>(null);
  const [attachedImages, setAttachedImages] = useState<{data: string, mime: string}[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sync local messages if initialMessages change
  useEffect(() => {
    setMessages(initialMessages);
  }, [sessionId, initialMessages]);

  // Update parent when messages change
  useEffect(() => {
    if (onMessagesChange && messages !== initialMessages) {
        onMessagesChange(messages);
    }
  }, [messages, onMessagesChange, initialMessages]);

  // Initialize Chat Session
  useEffect(() => {
    const initChat = async () => {
        if (!process.env.API_KEY) return;
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            let systemInstruction = `
You are HyperMind, an advanced AI Learning Companion.

**CAPABILITIES:**
1. **GenUI Rendering:** If the user asks for a chart, graph, or statistical visualization, return a JSON block EXACTLY like this (do not wrap in markdown):
   \`\`\`json
   { "genUi": { "type": "line-chart", "data": [{"name": "A", "value": 10}, ...], "config": {"color": "#6366f1"} } }
   \`\`\`
   Supported types: 'line-chart', 'bar-chart', 'area-chart'.

2. **Concept Tutor (Default):**
   - Analyze requests.
   - If complex, generate a JSON curriculum first: \`{ "curriculum": [...] }\`
   - Use Markdown for rich text.

3. **Debate Mode:**
   - If the user selects "Debate Mode", adopt a contrarian persona.
   - Challenge the user's assumptions politely but firmly.

4. **Interactive Quiz (Practice Mode):**
   - If the user is in Practice Mode or asks for a quiz, generate a **10-question MCQ quiz** about the topic or uploaded document.
   - Return a JSON block EXACTLY like this (separate from other text):
   \`\`\`json
   { "quiz": { "title": "Topic Quiz", "questions": [{ "question": "...", "options": ["A", "B", "C", "D"], "answer": "The full text of the correct option", "explanation": "Why this is correct." }] } }
   \`\`\`
   - **CRITICAL:** Do NOT provide the answers in the chat text. Only provide the JSON.
   - **CRITICAL:** Wait for the user to complete the quiz. The system will send you a message with the score and incorrect answers. 
   - Once you receive the results, provide a detailed analysis, conclusion, and study recommendations.

5. **Interactive Diagrams:**
   - If the user asks for a flowchart, mind map, process diagram, or structural visualization, return a JSON block EXACTLY like this (separate from other text):
   \`\`\`json
   { "diagram": { "title": "Diagram Title", "nodes": [{ "id": "1", "label": "Start" }, { "id": "2", "label": "Next Step" }], "edges": [{ "id": "e1-2", "source": "1", "target": "2", "label": "connects to" }] } }
   \`\`\`
            `;
            
            let greetingText = "";

            if (currentMode === 'practice') {
                systemInstruction += "\n\nMODE: PRACTICE & QUIZ.\nYour goal is to assess knowledge. When a user provides a topic or document, IMMEDIATELY generate a 10-question JSON quiz. Do not simply summarize.";
                greetingText = "Quiz Mode Ready. Upload a document or type a topic to generate a 10-question assessment.";
            } else if (currentMode === 'debate') {
                systemInstruction += "\n\nMODE: DEBATE.\nChallenge the user. Do not simply agree. Force them to defend their position.";
                greetingText = "I am ready to debate. State your premise, and I will dismantle it.";
            } else {
                greetingText = "HyperMind Online. Upload a PDF, ask a question, or share an image to begin.";
            }

            // Convert current messages to history format
            const history = messages
                .filter(m => m.id !== 'init')
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }));

            // If no messages, set initial greeting
            if (messages.length === 0) {
                 setMessages([{
                    id: 'init',
                    role: 'ai',
                    content: greetingText,
                    htmlContent: marked.parse(greetingText) as string,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }

            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
                history: history
            });

            setChatSession(chat);

        } catch (error) {
            console.error("Failed to initialize AI", error);
        }
    };

    initChat();
  }, [currentMode, sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    }
  }, [messages, isTyping]);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const processResponse = (text: string): Partial<Message> => {
    let content = text;
    let isCurriculum = false;
    let curriculumData: Topic[] = [];
    let isLessonComplete = false;
    let genUiType, genUiData, genUiConfig;
    let quizData;
    let diagramData;

    // 1. Check for GenUI JSON
    const genUiMatch = text.match(/```json\s*({[\s\S]*?"genUi"[\s\S]*?})\s*```/);
    if (genUiMatch) {
        try {
            const json = JSON.parse(genUiMatch[1]);
            if (json.genUi) {
                genUiType = json.genUi.type;
                genUiData = json.genUi.data;
                genUiConfig = json.genUi.config;
                content = content.replace(genUiMatch[0], "").trim();
            }
        } catch (e) { console.error("GenUI Parse Error", e); }
    }

    // 2. Check for Quiz JSON
    const quizMatch = text.match(/```json\s*({[\s\S]*?"quiz"[\s\S]*?})\s*```/);
    if (quizMatch) {
        try {
            const json = JSON.parse(quizMatch[1]);
            if (json.quiz) {
                quizData = json.quiz;
                content = content.replace(quizMatch[0], "").trim();
            }
        } catch (e) { console.error("Quiz Parse Error", e); }
    }

    // 3. Check for Diagram JSON
    const diagramMatch = text.match(/```json\s*({[\s\S]*?"diagram"[\s\S]*?})\s*```/);
    if (diagramMatch) {
        try {
            const json = JSON.parse(diagramMatch[1]);
            if (json.diagram) {
                diagramData = json.diagram;
                content = content.replace(diagramMatch[0], "").trim();
            }
        } catch (e) { console.error("Diagram Parse Error", e); }
    }

    // 4. Check for Curriculum JSON
    const curriculumMatch = text.match(/```json\s*({[\s\S]*?"curriculum"[\s\S]*?})\s*```/);
    if (curriculumMatch) {
        try {
            const data = JSON.parse(curriculumMatch[1]);
            if (data.curriculum) {
                isCurriculum = true;
                curriculumData = data.curriculum;
                content = content.replace(curriculumMatch[0], "").trim();
            }
        } catch (e) { console.error("Curriculum Parse Error", e); }
    }

    if (content.includes('[LESSON_COMPLETE]')) {
        isLessonComplete = true;
        content = content.replace('[LESSON_COMPLETE]', '').trim();
    }

    const htmlContent = marked.parse(content) as string;

    return { content, isCurriculum, curriculumData, isLessonComplete, htmlContent, genUiType, genUiData, genUiConfig, quizData, diagramData };
  };

  const handleSendMessage = async (text: string = inputValue, hidden: boolean = false) => {
    if ((!text.trim() && attachedImages.length === 0) || !chatSession) return;

    const userText = text.trim();
    const currentImages = [...attachedImages];
    
    // User Message (only add to UI if not hidden)
    if (!hidden) {
        const userMsg: Message = {
            id: Date.now(),
            role: 'user',
            content: userText,
            images: currentImages.map(img => img.data),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setAttachedImages([]);
    }

    setIsTyping(true);

    try {
        let result;
        const parts: any[] = [];
        if (userText) parts.push({ text: userText });
        
        currentImages.forEach(img => {
             parts.push({
                 inlineData: {
                     mimeType: img.mime,
                     data: img.data
                 }
             });
        });

        const messagePayload = parts.length === 1 && parts[0].text ? parts[0].text : parts;
        result = await chatSession.sendMessage({ message: messagePayload });
        const processed = processResponse(result.text);

        const aiMsg: Message = {
            id: Date.now() + 1,
            role: 'ai',
            content: processed.content || "",
            ...processed,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
        console.error("AI Error:", error);
        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'ai',
            content: "I encountered an error processing that request. Please try again.",
            isError: true
        }]);
    } finally {
        setIsTyping(false);
    }
  };

  const handleQuizCompletion = (results: { score: number; total: number; summary: string }) => {
      // Send hidden system message to AI with results
      handleSendMessage(`[SYSTEM] User completed the quiz. \n${results.summary}\nPlease analyze this performance, identify knowledge gaps based on the incorrect answers, and provide a concluding summary with recommendations.`, true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessingFile(true);
      try {
          if (file.type === 'application/pdf') {
              const text = await extractTextFromPdf(file);
              const prompt = currentMode === 'practice' 
                ? `I have uploaded a PDF document named "${file.name}". Content snippet: ${text.substring(0, 10000)}. Please generate a 10-question MCQ quiz based on this content.`
                : `I have uploaded a PDF document named "${file.name}". Here is its content:\n\n${text.substring(0, 30000)}... [truncated].\n\nPlease analyze this document and summarize the key learning points.`;
              
              handleSendMessage(prompt);
          } else if (file.type.startsWith('image/')) {
              const base64 = await blobToBase64(file);
              setAttachedImages(prev => [...prev, { data: base64, mime: file.type }]);
          } else {
             const text = await file.text();
             handleSendMessage(`Analyze this file content:\n\n${text}`);
          }
      } catch (err) {
          console.error("File upload error", err);
      } finally {
          setIsProcessingFile(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const removeAttachment = (index: number) => {
      setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleSpeech = (text: string, id: number | string) => {
    if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#`_\[\]]/g, '');
    const u = new SpeechSynthesisUtterance(clean);
    u.onend = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-4 right-4 z-20 flex bg-black/50 backdrop-blur rounded-full border border-white/10 p-1">
          {['learn', 'practice', 'debate'].map(m => (
              <button 
                key={m}
                onClick={() => setCurrentMode(m)}
                className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                    currentMode === m ? "bg-indigo-600 text-white shadow-lg" : "text-neutral-500 hover:text-white"
                )}
              >
                  {m}
              </button>
          ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 no-scrollbar pb-32">
        {messages.map((msg) => (
            <div key={msg.id} className={cn(
                "flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500",
                msg.role === 'user' ? "flex-row-reverse" : ""
            )}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-neutral-800' : 'bg-indigo-600'}`}>
                    {msg.role === 'user' ? <span className="text-xs font-bold text-white">YOU</span> : <BrainCircuit size={20} className="text-white" />}
                </div>

                <div className={cn("flex flex-col gap-2 max-w-[85%]", msg.role === 'user' ? "items-end" : "w-full")}>
                    
                    {msg.images && msg.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 justify-end">
                            {msg.images.map((img, i) => (
                                <img key={i} src={`data:image/jpeg;base64,${img}`} className="h-32 w-auto rounded-lg border border-white/10 shadow-md" alt="Upload" />
                            ))}
                        </div>
                    )}

                    <div className={cn(
                        "rounded-2xl px-6 py-4 shadow-md",
                        msg.role === 'user' ? "bg-neutral-800 text-white rounded-tr-sm" : "bg-transparent text-neutral-200 p-0 shadow-none px-0 py-0"
                    )}>
                        {msg.role === 'ai' ? (
                            <>
                                {msg.content && <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-white/10" dangerouslySetInnerHTML={{ __html: msg.htmlContent || '' }} />}
                                
                                {msg.genUiType && msg.genUiData && (
                                    <GenUI type={msg.genUiType} data={msg.genUiData} config={msg.genUiConfig} />
                                )}

                                {msg.quizData && (
                                    <Quiz data={msg.quizData} onComplete={handleQuizCompletion} />
                                )}

                                {msg.diagramData && (
                                    <Diagram data={msg.diagramData} />
                                )}

                                {msg.isCurriculum && msg.curriculumData && (
                                    <div className="w-full bg-neutral-900/50 border border-indigo-500/30 rounded-xl p-6 mt-4">
                                        <div className="flex items-center gap-2 mb-6">
                                            <BookOpen size={18} className="text-indigo-400" />
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Learning Path</h3>
                                        </div>
                                        <div className="relative space-y-0 pl-4">
                                            <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-neutral-800" />
                                            {msg.curriculumData.map((topic) => (
                                                <div key={topic.id} className="relative flex gap-4 pb-8 last:pb-0 group/topic">
                                                    <div className="relative z-10 w-3 h-3 mt-1.5 rounded-full bg-neutral-950 border-2 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                                    <div className="flex-1 -mt-1 p-3 rounded-lg hover:bg-white/5 transition-colors">
                                                        <h4 className="text-white font-medium text-sm">{topic.title}</h4>
                                                        <p className="text-xs text-neutral-400 mt-1">{topic.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="mt-4 flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-indigo-500 ml-auto">
                                            Start Path <Play size={12} />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                    </div>
                     
                    {msg.role === 'ai' && (
                        <div className="flex items-center gap-3 mt-2">
                             <button onClick={() => toggleSpeech(msg.content, msg.id)} className="text-neutral-500 hover:text-indigo-400">
                                {speakingId === msg.id ? <StopCircle size={16} className="animate-pulse text-indigo-500"/> : <Volume2 size={16} />}
                             </button>
                             <button className="text-neutral-500 hover:text-white"><Copy size={16}/></button>
                             <button className="text-neutral-500 hover:text-white"><ThumbsUp size={16}/></button>
                        </div>
                    )}
                </div>
            </div>
        ))}

        {(isTyping || isProcessingFile) && (
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Loader2 size={20} className="text-white animate-spin" />
                </div>
                <span className="text-neutral-500 text-sm mt-2">{isProcessingFile ? "Analyzing Document..." : "Thinking..."}</span>
             </div>
        )}
      </div>

      {/* Input Area */}
      <div className="w-full px-4 md:px-8 pb-6 pt-4 z-20 absolute bottom-0">
        <div className="max-w-4xl mx-auto relative group">
          {attachedImages.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 flex gap-2">
                  {attachedImages.map((img, i) => (
                      <div key={i} className="relative group/img">
                          <img src={`data:${img.mime};base64,${img.data}`} className="h-16 w-16 rounded-lg object-cover border border-indigo-500" />
                          <button onClick={() => removeAttachment(i)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity"><X size={12}/></button>
                      </div>
                  ))}
              </div>
          )}

          <div className="relative bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col shadow-2xl">
              <textarea 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                }}
                placeholder={currentMode === 'debate' ? "Challenge me..." : currentMode === 'practice' ? "Enter a topic to generate a quiz..." : "Ask anything or upload images/PDFs..."}
                disabled={isTyping || !chatSession}
                className="w-full bg-transparent border-0 rounded-3xl py-4 pl-12 pr-14 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-0 resize-none h-14 min-h-[56px] max-h-32 disabled:opacity-50"
              />
              
              <div className="absolute left-4 top-4 text-indigo-400">
                  {currentMode === 'debate' ? <Flame size={20} className="animate-pulse text-orange-500"/> : <Sparkles size={20} />}
              </div>

              <div className="absolute right-2 top-2 flex items-center gap-1">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept=".pdf,.txt,.doc,.docx,image/*"
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors" 
                    title="Upload Material"
                >
                    <Paperclip size={18} />
                </button>
                <button 
                    onClick={() => handleSendMessage()}
                    disabled={(!inputValue.trim() && attachedImages.length === 0) || isTyping}
                    className="p-2.5 bg-white text-black rounded-xl hover:bg-neutral-200 transition-colors shadow-lg active:scale-95 disabled:opacity-50"
                >
                    <Send size={18} />
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}