import React, { useState, useEffect } from 'react';
import { SplineScene } from './ui/spline';
import { GoogleGenAI } from "@google/genai";
import { Assessment } from './Assessment';
import { 
    GraduationCap, 
    Briefcase, 
    School, 
    User, 
    Clock, 
    Globe, 
    ArrowRight, 
    Check, 
    ChevronLeft,
    BrainCircuit,
    Sparkles,
    Target, 
    Mountain,
    Coffee,
    Lightbulb,
    ScanLine,
    Activity,
    Layout,
    Zap,
    BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';

interface OnboardingProps {
    onComplete: (data: any) => void;
}

const SUBJECTS = [
    "Computer Science", "Physics", "Mathematics", "History", 
    "Philosophy", "Art & Design", "Economics", "Biology", 
    "Psychology", "Literature", "Business", "Political Science"
];

const TypingText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i > text.length) clearInterval(intervalId);
    }, 30);
    return () => clearInterval(intervalId);
  }, [text]);
  
  return <>{displayedText}<span className="animate-pulse text-white">|</span></>;
};

export function Onboarding({ onComplete }: OnboardingProps) {
    // Phases: 'setup' (Form) -> 'assessment' (Test) -> 'optimization' (Results)
    const [phase, setPhase] = useState<'setup' | 'assessment' | 'optimization'>('setup');
    const [setupStep, setSetupStep] = useState(1); // 1, 2, 3
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [showDashboard, setShowDashboard] = useState(false);
    
    const [formData, setFormData] = useState({
        qualification: '',
        ageRange: '',
        language: 'English',
        studyTime: '30m',
        subjects: [] as string[],
        learningDepth: '',
        motivation: '',
        assessmentScore: 0,
        assessmentAnalysis: ''
    });

    const [curriculum, setCurriculum] = useState<any>(null);

    const handleSelect = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const toggleSubject = (subject: string) => {
        setFormData(prev => {
            const current = prev.subjects;
            if (current.includes(subject)) {
                return { ...prev, subjects: current.filter(s => s !== subject) };
            } else {
                return { ...prev, subjects: [...current, subject] };
            }
        });
    };

    const handleNext = () => {
        if (phase === 'setup') {
            if (setupStep < 3) {
                setSetupStep(setupStep + 1);
            } else {
                // Move to Assessment after setup is complete
                setPhase('assessment');
            }
        }
    };

    const handleBack = () => {
        if (phase === 'setup') {
            if (setupStep > 1) setSetupStep(setupStep - 1);
        } else if (phase === 'assessment') {
            setPhase('setup');
            setSetupStep(3);
        }
    };

    const handleAssessmentComplete = (result: { score: number; analysis: string }) => {
        setFormData(prev => ({
            ...prev,
            assessmentScore: result.score,
            assessmentAnalysis: result.analysis
        }));
        setPhase('optimization');
    };

    // Trigger optimization when entering the phase
    useEffect(() => {
        if (phase === 'optimization' && !isProcessing && !showDashboard) {
             startOptimization();
        }
    }, [phase]);

    const getFallbackCurriculum = () => {
        const { subjects, studyTime, learningDepth, motivation, qualification } = formData;
        
        let intensityDescriptor = "Balanced";
        if (studyTime === '15m') intensityDescriptor = "Gentle";
        else if (studyTime === '60m') intensityDescriptor = "Rigorous";
        else if (studyTime === '120m') intensityDescriptor = "Immersive";

        let actionVerb = "explore";
        if (learningDepth === 'mastery') actionVerb = "master";
        else if (qualification === 'pro' && motivation === 'career') actionVerb = "upskill in";
        else if (learningDepth === 'casual') actionVerb = "discover";

        const primarySubject = subjects[0] || "General Knowledge";
        const primaryGoal = `An ${intensityDescriptor.toLowerCase()} path to ${actionVerb} ${primarySubject}.`;

        const secondaryGoals: string[] = ["Synthesize core concepts", "Apply practical frameworks", "Review historical context"];

        return { primaryGoal, secondaryGoals };
    };

    const generateAiCurriculum = async () => {
        if (!process.env.API_KEY) return getFallbackCurriculum();

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Act as an AI educational architect.
            User Profile:
            - Subjects: ${formData.subjects.join(", ")}
            - Level: ${formData.qualification}
            - Motivation: ${formData.motivation}
            
            Assessment Results:
            - Score: ${formData.assessmentScore}
            - Analysis: ${formData.assessmentAnalysis}
            
            Based on the profile AND assessment analysis, create a tailored curriculum summary.
            Return JSON: { "primaryGoal": "string", "secondaryGoals": ["string", "string", "string"] }
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            if (response.text) return JSON.parse(response.text);
            throw new Error("Empty");
        } catch (e) {
            return getFallbackCurriculum();
        }
    };

    const startOptimization = async () => {
        setIsProcessing(true);
        setProcessingStep(0);
        
        const step1Timer = setTimeout(() => setProcessingStep(1), 1500);

        try {
            const [generatedData] = await Promise.all([
                generateAiCurriculum(),
                new Promise(resolve => setTimeout(resolve, 2500))
            ]);
            clearTimeout(step1Timer);
            setProcessingStep(2);
            setTimeout(() => {
                setCurriculum(generatedData);
                setIsProcessing(false);
                setShowDashboard(true);
            }, 800);
        } catch (e) {
            setCurriculum(getFallbackCurriculum());
            setIsProcessing(false);
            setShowDashboard(true);
        }
    };

    const handleFinalStart = () => {
        onComplete({ ...formData, ...curriculum });
    };

    // Validations
    const isStep1Valid = formData.qualification && formData.ageRange;
    const isStep2Valid = formData.language && formData.studyTime;
    const isStep3Valid = formData.subjects.length > 0 && formData.learningDepth && formData.motivation;

    // Robot Visuals
    const getRobotTransform = () => {
        if (isProcessing) return "scale-[2.5] translate-y-20 blur-[2px] opacity-60"; 
        if (showDashboard) return "scale-100 md:scale-125 translate-y-10 md:translate-y-20 md:-translate-x-4";
        if (phase === 'assessment') return "scale-100 translate-y-20 md:translate-x-12";
        
        // Setup Steps
        switch(setupStep) {
            case 1: return "scale-125 md:scale-150 translate-y-10 md:translate-y-20";
            case 2: return "scale-125 md:scale-[1.6] translate-y-10 md:translate-y-20 md:translate-x-12";
            case 3: return "scale-125 md:scale-[1.7] translate-y-10 md:translate-y-10 md:-translate-x-12";
            default: return "scale-125 md:scale-150 translate-y-10 md:translate-y-20";
        }
    };

    const getRobotMessage = () => {
        if (showDashboard) return "Curriculum synthesized. Parameters optimal. Ready to engage?";
        if (phase === 'assessment') return "Verifying knowledge baselines. Answer honestly.";
        if (phase === 'setup') {
            if (setupStep === 1) return "Initiating neural handshake. Identify yourself.";
            if (setupStep === 2) return "Calibrating temporal and linguistic parameters.";
            if (setupStep === 3) return "Define your primary learning vectors.";
        }
        return "System Processing.";
    };

    if (phase === 'assessment') {
        return (
            <div className="w-full h-full flex flex-col md:flex-row bg-black relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                 <div className="relative w-full md:w-5/12 h-[100px] md:h-full bg-neutral-900/40 border-r border-white/10 overflow-hidden pointer-events-none">
                     <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black z-0" />
                     <div className="absolute top-4 left-4 z-20 max-w-[90%]">
                         <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-sm text-neutral-200 shadow-xl">
                             <div className="flex items-center gap-2 mb-2 text-white font-bold text-[10px] uppercase">
                                 <Activity size={12} className="animate-pulse" /> Live Feed
                             </div>
                             <div className="font-mono text-xs"><TypingText text={getRobotMessage()} /></div>
                         </div>
                     </div>
                     <div className={cn("w-full h-full transition-all duration-[1500ms] ease-in-out relative z-0 mix-blend-lighten", getRobotTransform())}>
                        <div className="w-full h-full contrast-125 saturate-0">
                            <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="w-full h-full" />
                        </div>
                     </div>
                </div>
                <div className="flex-1 bg-black/80 backdrop-blur-md relative z-20">
                    <Assessment 
                        userProfile={formData}
                        onComplete={handleAssessmentComplete}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col md:flex-row bg-black relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            {/* Robot Companion Column */}
            <div className="relative w-full md:w-5/12 h-[200px] md:h-full bg-neutral-900/40 border-b md:border-b-0 md:border-r border-white/10 order-1 md:order-1 overflow-hidden pointer-events-none group">
                 <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black z-0" />
                 <div className="absolute inset-0 z-10 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
                 {!isProcessing && !showDashboard && <div className="absolute top-0 left-0 w-full h-1 bg-white/20 blur-sm animate-[scan_4s_ease-in-out_infinite] z-10" />}
                 <div className={cn("absolute top-4 left-4 z-20 max-w-[80%] md:max-w-[90%] pointer-events-auto transition-all duration-500", isProcessing ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0")}>
                     <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl rounded-tl-sm p-4 text-sm text-neutral-200 shadow-xl">
                         <div className="flex items-center gap-2 mb-2 text-white font-bold text-[10px] uppercase tracking-wider">
                             <Activity size={12} className="animate-pulse" /> 
                             <span>Live Feed // {showDashboard ? "Finalizing" : `Phase 0${setupStep}`}</span>
                         </div>
                         <div className="font-mono text-xs md:text-sm leading-relaxed min-h-[40px]">
                            <TypingText key={phase + setupStep} text={getRobotMessage()} />
                         </div>
                     </div>
                 </div>
                 <div className={cn("w-full h-full transition-all duration-[1500ms] ease-in-out relative z-0 mix-blend-lighten", getRobotTransform())}>
                    <div className="w-full h-full contrast-125 saturate-0">
                        <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="w-full h-full" />
                    </div>
                 </div>
                 {isProcessing && (
                     <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                         <div className="w-full h-full absolute inset-0 bg-white/5 mix-blend-overlay animate-pulse" />
                         <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-64 h-64 border border-white/20 rounded-full animate-[spin_10s_linear_infinite]" />
                             <div className="w-48 h-48 border border-white/10 rounded-full absolute animate-[spin_5s_linear_infinite_reverse]" />
                         </div>
                     </div>
                 )}
            </div>

            {/* Right Column */}
            <div className="flex-1 h-full relative order-2 md:order-2 flex flex-col z-20 bg-black/80 backdrop-blur-md md:bg-transparent md:backdrop-blur-none">
                {isProcessing ? (
                    // PROCESSING VIEW
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
                        <div className="relative w-24 h-24 mb-8">
                             <div className="absolute inset-0 border-t-2 border-white/80 rounded-full animate-spin" />
                             <div className="absolute inset-2 border-r-2 border-neutral-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
                             <BrainCircuit className="absolute inset-0 m-auto text-white animate-pulse" size={32} />
                        </div>
                        <div className="w-full max-w-sm space-y-4">
                            <div className="flex justify-between text-xs font-mono text-neutral-400 uppercase tracking-widest">
                                <span>Compile</span><span>{processingStep === 0 ? "33%" : processingStep === 1 ? "66%" : "100%"}</span>
                            </div>
                            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                                <div className={cn("h-full bg-white shadow-[0_0_10px_white] transition-all duration-700 ease-out", processingStep === 0 ? "w-1/3" : processingStep === 1 ? "w-2/3" : "w-full")} />
                            </div>
                            <div className="h-6 relative overflow-hidden text-center">
                                <p className={cn("absolute w-full text-sm font-bold text-white transition-all duration-500 transform", processingStep === 0 ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0")}>Analyzing neural patterns...</p>
                                <p className={cn("absolute w-full text-sm font-bold text-white transition-all duration-500 transform", processingStep === 1 ? "translate-y-0 opacity-100" : processingStep > 1 ? "-translate-y-full opacity-0" : "translate-y-full opacity-0")}>Synthesizing curriculum...</p>
                                <p className={cn("absolute w-full text-sm font-bold text-white transition-all duration-500 transform", processingStep === 2 ? "translate-y-0 opacity-100" : "translate-y-full opacity-0")}>Optimization complete.</p>
                            </div>
                        </div>
                    </div>
                ) : showDashboard ? (
                    // DASHBOARD
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-700 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar">
                            <div className="max-w-xl mx-auto space-y-8">
                                <div className="text-left space-y-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-white text-[10px] font-mono tracking-widest uppercase">
                                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>
                                        Path_Initialized
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tighter">Optimization Complete</h2>
                                    <p className="text-neutral-400 leading-relaxed">Your neural curriculum is ready.</p>
                                </div>
                                <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/30 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target size={120} className="text-white" /></div>
                                    <h3 className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" /> Primary Directive</h3>
                                    <p className="text-xl font-medium text-white leading-relaxed relative z-10">{curriculum?.primaryGoal}</p>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Layout size={12} /> Key Vectors</h3>
                                    {curriculum?.secondaryGoals?.map((goal: string, i: number) => (
                                        <div key={i} className="flex gap-4 items-start p-4 bg-neutral-900/30 border border-white/5 rounded-xl hover:bg-neutral-900/60 transition-colors">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-mono text-white">0{i + 1}</div>
                                            <p className="text-sm text-neutral-300 font-medium">{goal}</p>
                                        </div>
                                    ))}
                                </div>
                                {formData.assessmentAnalysis && (
                                     <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
                                        <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={12} /> Assessment Analysis</h3>
                                        <p className="text-sm text-indigo-100 leading-relaxed opacity-80">{formData.assessmentAnalysis}</p>
                                     </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-sm relative z-50">
                             <button onClick={handleFinalStart} className="w-full group relative flex items-center justify-center gap-3 bg-white text-black px-6 py-4 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.15)]">Initiate Sequence <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></button>
                        </div>
                    </div>
                ) : (
                    // PROFILE SETUP STEPS
                    <>
                        <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar">
                            <div className="flex items-center gap-2 mb-8">
                                {[1, 2, 3].map((s) => (<div key={s} className={cn("h-1 flex-1 rounded-full transition-all duration-500", setupStep >= s ? "bg-white shadow-[0_0_10px_white]" : "bg-neutral-800")} />))}
                            </div>

                            {/* Step 1: Qualification & Age */}
                            {setupStep === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2"><ScanLine size={12} /> Qualification</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {[
                                                { id: 'school', label: 'School Student', icon: School, desc: 'Grades 1-12' },
                                                { id: 'college', label: 'College / Univ', icon: GraduationCap, desc: 'Undergrad & Grad' },
                                                { id: 'pro', label: 'Professional', icon: Briefcase, desc: 'Working & Upskilling' },
                                                { id: 'other', label: 'Lifelong Learner', icon: User, desc: 'Self-paced exploration' },
                                            ].map((item) => (
                                                <button key={item.id} onClick={() => handleSelect('qualification', item.id)} className={cn("relative flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-300 group hover:scale-[1.02]", formData.qualification === item.id ? "bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "bg-neutral-900/50 border-white/5 hover:bg-neutral-800 hover:border-white/10")}>
                                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", formData.qualification === item.id ? "bg-white text-black" : "bg-neutral-800 text-neutral-400")}><item.icon size={20} /></div>
                                                    <div><div className={cn("font-medium", formData.qualification === item.id ? "text-white" : "text-neutral-300")}>{item.label}</div><div className="text-xs text-neutral-500">{item.desc}</div></div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Age Range</label>
                                        <div className="flex flex-wrap gap-3">
                                            {['< 13', '13 - 17', '18 - 24', '25 - 34', '35+'].map((age) => (
                                                <button key={age} onClick={() => handleSelect('ageRange', age)} className={cn("px-6 py-3 rounded-full border text-sm font-medium transition-all hover:scale-105 active:scale-95", formData.ageRange === age ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white")}>{age}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Language & Study Time */}
                            {setupStep === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Preferred Language</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {['English', 'Spanish', 'French', 'German', 'Mandarin', 'Hindi'].map((lang) => (
                                                <button key={lang} onClick={() => handleSelect('language', lang)} className={cn("flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:bg-neutral-800/50", formData.language === lang ? "bg-white/10 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "bg-neutral-900/50 border-white/5 text-neutral-400 hover:border-white/20 hover:text-white")}>
                                                    <Globe size={16} className={formData.language === lang ? "text-white" : "text-neutral-600"} /><span className="text-sm font-medium">{lang}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Daily Study Goal</label>
                                        <div className="grid grid-cols-1 gap-4">
                                            {[ { val: '15m', label: 'Casual', sub: '15m' }, { val: '30m', label: 'Steady', sub: '30m' }, { val: '60m', label: 'Deep', sub: '1h' }, { val: '120m', label: 'Intensive', sub: '2h' } ].map((opt) => (
                                                <button key={opt.val} onClick={() => handleSelect('studyTime', opt.val)} className={cn("flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-white/5 group", formData.studyTime === opt.val ? "border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "border-white/10 bg-neutral-900/30")}>
                                                    <div className="flex items-center gap-4"><div className={cn("w-12 h-12 rounded-full flex items-center justify-center border transition-colors", formData.studyTime === opt.val ? "border-white bg-white/20 text-white" : "border-white/10 bg-neutral-800 text-neutral-500 group-hover:border-white/30")}><Clock size={20} /></div><div className="text-left"><div className={cn("font-bold transition-colors", formData.studyTime === opt.val ? "text-white" : "text-neutral-300")}>{opt.label}</div><div className="text-xs text-neutral-500">{opt.sub}</div></div></div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Subjects, Depth, Motivation */}
                            {setupStep === 3 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2"><BookOpen size={12} /> Focus Areas</label>
                                        <div className="flex flex-wrap gap-2">
                                            {SUBJECTS.map((subject) => (
                                                <button key={subject} onClick={() => toggleSubject(subject)} className={cn("px-4 py-2 rounded-full border text-sm transition-all hover:scale-110 active:scale-95", formData.subjects.includes(subject) ? "bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white")}>{subject}</button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Depth</label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {[ { id: 'casual', label: 'Casual', icon: Coffee }, { id: 'mastery', label: 'Mastery', icon: Mountain } ].map((item) => (
                                                    <button key={item.id} onClick={() => handleSelect('learningDepth', item.id)} className={cn("flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:bg-neutral-800/50 group hover:scale-[1.02]", formData.learningDepth === item.id ? "bg-white/10 border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "bg-neutral-900/50 border-white/5 hover:border-white/10")}><div className={cn("w-12 h-12 rounded-full flex items-center justify-center border transition-colors", formData.learningDepth === item.id ? "bg-white/20 border-white text-white" : "bg-neutral-800 border-white/5 text-neutral-500 group-hover:text-neutral-300")}><item.icon size={20} /></div><div><span className={cn("font-bold block transition-colors", formData.learningDepth === item.id ? "text-white" : "text-neutral-300")}>{item.label}</span></div></button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Motivation</label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {[ { id: 'career', label: 'Career', icon: Briefcase }, { id: 'curiosity', label: 'Curiosity', icon: Lightbulb } ].map((item) => (
                                                    <button key={item.id} onClick={() => handleSelect('motivation', item.id)} className={cn("flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:bg-neutral-800/50 group hover:scale-[1.02]", formData.motivation === item.id ? "bg-white/10 border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "bg-neutral-900/50 border-white/5 hover:border-white/10")}><div className={cn("w-12 h-12 rounded-full flex items-center justify-center border transition-colors", formData.motivation === item.id ? "bg-white/20 border-white text-white" : "bg-neutral-800 border-white/5 text-neutral-500 group-hover:text-neutral-300")}><item.icon size={20} /></div><div><span className={cn("font-bold block transition-colors", formData.motivation === item.id ? "text-white" : "text-neutral-300")}>{item.label}</span></div></button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-sm flex justify-between items-center z-50 relative">
                            <button 
                                onClick={handleBack}
                                disabled={setupStep === 1}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                                    setupStep === 1 ? "text-neutral-700 cursor-not-allowed" : "text-neutral-400 hover:text-white"
                                )}
                            >
                                <ChevronLeft size={16} /> Back
                            </button>

                            <button 
                                onClick={handleNext} 
                                disabled={setupStep === 1 ? !isStep1Valid : setupStep === 2 ? !isStep2Valid : !isStep3Valid}
                                className="group flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                {setupStep === 3 ? "Start Assessment" : "Next Step"} 
                                {setupStep === 3 ? <Zap size={16} className="text-neutral-600 animate-pulse" /> : <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>
                    </>
                )}
            </div>
            <style>{`@keyframes scan { 0% { top: 0; opacity: 1; } 50% { opacity: 0.5; } 100% { top: 100%; opacity: 0; } }`}</style>
        </div>
    );
}