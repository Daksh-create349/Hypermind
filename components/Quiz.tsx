import React, { useState } from 'react';
import { Check, X, AlertCircle, Trophy, ArrowRight, BarChart3, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface QuizProps {
  data: {
    title?: string;
    questions: Question[];
  };
  onComplete?: (results: { score: number; total: number; summary: string }) => void;
}

export function Quiz({ data, onComplete }: QuizProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const handleSelect = (qIndex: number, option: string) => {
    if (answers[qIndex]) return; // Prevent changing answer

    const isCorrect = option === data.questions[qIndex].answer;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
    
    if (isCorrect) {
        setScore(prev => prev + 1);
    }
  };

  const handleSubmit = () => {
    if (!onComplete || isSubmitting || isAnalyzed) return;
    setIsSubmitting(true);
    
    // Construct summary for AI
    let summary = `Quiz: ${data.title || "Practice Quiz"}\nScore: ${score}/${data.questions.length}\n\nDetails:\n`;
    data.questions.forEach((q, idx) => {
        const userAns = answers[idx];
        const isCorrect = userAns === q.answer;
        summary += `Q${idx + 1}: ${isCorrect ? "Correct" : "Incorrect"}. (Question: "${q.question}", User Answer: "${userAns}", Correct: "${q.answer}")\n`;
    });

    // Simulate small delay for effect
    setTimeout(() => {
        onComplete({ score, total: data.questions.length, summary });
        setIsSubmitting(false);
        setIsAnalyzed(true);
    }, 600);
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = data.questions.length;
  const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  const allAnswered = totalCount > 0 && answeredCount === totalCount;

  return (
    <div className="w-full mt-6 space-y-8">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-white/10 p-6 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-neutral-800">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
          </div>
          
          <div className="flex items-start justify-between gap-4 mt-2">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                        Practice Mode
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                        {answeredCount}/{totalCount} Completed
                    </span>
                </div>
                <h3 className="text-xl font-bold text-white leading-tight">{data.title || "Topic Assessment"}</h3>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-800/50 border border-white/5 shadow-inner">
                <Trophy className={cn("transition-colors duration-500", allAnswered ? "text-yellow-400" : "text-neutral-600")} size={24} />
            </div>
          </div>
      </div>

      {/* Questions List */}
      <div className="grid gap-8">
        {data.questions.map((q, qIndex) => {
            const userAnswer = answers[qIndex];
            const isAnswered = !!userAnswer;
            const isCorrect = userAnswer === q.answer;

            return (
            <div key={qIndex} className="group relative pl-4 md:pl-0">
                {/* Connector Line */}
                {qIndex !== data.questions.length - 1 && (
                    <div className="absolute left-[15px] top-10 bottom-[-32px] w-0.5 bg-neutral-800 md:hidden" />
                )}
                
                <div className="relative bg-black/40 border border-white/5 rounded-2xl p-6 transition-all hover:bg-neutral-900/40">
                    <div className="flex gap-5">
                        <span className={cn(
                            "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border transition-colors duration-300",
                            isAnswered 
                                ? (isCorrect ? "bg-green-500/20 border-green-500 text-green-500" : "bg-red-500/20 border-red-500 text-red-500")
                                : "bg-neutral-800 border-white/10 text-neutral-400"
                        )}>
                            {qIndex + 1}
                        </span>
                        
                        <div className="flex-1 space-y-4">
                            <p className="text-neutral-200 font-medium text-lg leading-relaxed">{q.question}</p>
                            
                            <div className="grid gap-3">
                                {q.options.map((option, oIndex) => {
                                    const isSelected = userAnswer === option;
                                    const isTheCorrectAnswer = option === q.answer;
                                    
                                    let buttonStyle = "border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-neutral-600 text-neutral-400";
                                    
                                    if (isAnswered) {
                                        if (isTheCorrectAnswer) {
                                            buttonStyle = "bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                                        } else if (isSelected && !isCorrect) {
                                            buttonStyle = "bg-red-500/10 border-red-500/50 text-red-400 opacity-60";
                                        } else {
                                            buttonStyle = "border-neutral-800 opacity-30 grayscale";
                                        }
                                    }

                                    return (
                                        <button
                                            key={oIndex}
                                            onClick={() => handleSelect(qIndex, option)}
                                            disabled={isAnswered}
                                            className={cn(
                                                "w-full text-left px-5 py-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between group/btn relative overflow-hidden",
                                                buttonStyle
                                            )}
                                        >
                                            <span className="relative z-10 text-sm">{option}</span>
                                            {isAnswered && isTheCorrectAnswer && <Check size={16} className="text-green-500 animate-in zoom-in spin-in-45" />}
                                            {isAnswered && isSelected && !isCorrect && <X size={16} className="text-red-500 animate-in zoom-in" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explanation Card */}
                            {isAnswered && (
                                <div className={cn(
                                    "mt-4 p-4 rounded-xl text-sm flex gap-3 items-start animate-in fade-in slide-in-from-top-2 border backdrop-blur-md",
                                    isCorrect ? "bg-green-950/20 border-green-500/20 text-green-200" : "bg-red-950/20 border-red-500/20 text-red-200"
                                )}>
                                    <AlertCircle size={16} className={cn("mt-0.5 shrink-0", isCorrect ? "text-green-500" : "text-red-500")} />
                                    <div>
                                        <span className={cn("font-bold block mb-1 text-xs uppercase tracking-wide opacity-80", isCorrect ? "text-green-400" : "text-red-400")}>
                                            {isCorrect ? "Explanation" : "Correction"}
                                        </span>
                                        <span className="opacity-90 leading-relaxed text-sm">{q.explanation}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            );
        })}
      </div>

      {/* Completion & Analysis Section */}
      {allAnswered && (
        <div className="sticky bottom-4 z-10 animate-in slide-in-from-bottom-4 duration-700">
            <div className="bg-neutral-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl p-1 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col md:flex-row items-center gap-6 p-6">
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="text-2xl font-bold text-white mb-1">Assessment Complete</h4>
                        <p className="text-neutral-400 text-sm">
                            You scored <span className="text-indigo-400 font-bold text-lg">{score}</span> / {totalCount}. 
                            {isAnalyzed ? " Analysis provided below." : " Ready for AI analysis?"}
                        </p>
                    </div>
                    
                    {!isAnalyzed ? (
                        <button 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-wait whitespace-nowrap"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Analyzing Performance...
                                </>
                            ) : (
                                <>
                                    <BarChart3 size={18} />
                                    Get AI Conclusion
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="px-6 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm font-bold flex items-center gap-2">
                            <Check size={16} /> Analysis Received
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}