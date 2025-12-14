import React, { useState } from 'react';
import { FileText, FileAudio, Link as LinkIcon, MoreHorizontal, Settings, HelpCircle, UploadCloud } from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar({ className }: { className?: string }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sources, setSources] = useState<any[]>([]);

  return (
    <div className={cn("flex flex-col h-full border-r border-white/5 bg-black/60 backdrop-blur-xl p-4 transition-all duration-300", className)}>
      <div className="flex items-center justify-between mb-8 px-2 pt-2">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <div className="w-2 h-2 bg-white rounded-full" />
           </div>
           <h1 className="text-lg font-bold tracking-tight text-white">
             HyperMind
           </h1>
        </div>
        <div className="h-8 w-8 rounded-full bg-neutral-800/80 border border-white/10 flex items-center justify-center text-xs font-medium text-neutral-400 cursor-pointer hover:bg-neutral-700 hover:text-white transition-colors">
          ME
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
        <div>
            <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Study Materials ({sources.length})</span>
            </div>
            
            {sources.length === 0 ? (
                <div className="border border-dashed border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mb-3">
                        <UploadCloud size={20} className="text-neutral-500" />
                    </div>
                    <p className="text-sm text-neutral-400 font-medium">No materials</p>
                    <p className="text-xs text-neutral-600 mt-1">Upload notes, textbooks, or papers</p>
                </div>
            ) : (
                <div className="space-y-2">
                {sources.map((source) => (
                    <div 
                        key={source.id} 
                        onClick={() => setActiveId(source.id)}
                        className={cn(
                            "group relative flex items-center gap-3 p-3 rounded-xl border border-transparent transition-all duration-200 cursor-pointer",
                            activeId === source.id
                                ? "bg-neutral-900/80 border-white/5 hover:border-white/10" 
                                : "hover:bg-neutral-900/50"
                        )}
                    >
                    {/* Active Indicator */}
                    {activeId === source.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    )}

                    <div className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        activeId === source.id ? "bg-indigo-500/20 text-indigo-400" : "bg-neutral-800 text-neutral-400 group-hover:text-neutral-300"
                    )}>
                        {source.type === 'pdf' && <FileText size={16} />}
                        {source.type === 'audio' && <FileAudio size={16} />}
                        {source.type === 'link' && <LinkIcon size={16} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h4 className={cn(
                            "text-sm font-medium truncate transition-colors",
                            activeId === source.id ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"
                        )}>
                            {source.name}
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-neutral-600 font-medium">{source.size}</span>
                            {activeId === source.id && <span className="w-1 h-1 rounded-full bg-indigo-500" />}
                        </div>
                    </div>

                    <button className="text-neutral-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <MoreHorizontal size={16} />
                    </button>
                    </div>
                ))}
                </div>
            )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 px-2 flex flex-col gap-1">
         <button className="flex items-center gap-3 p-2 text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-lg transition-colors text-sm font-medium">
             <Settings size={16} />
             <span>Settings</span>
         </button>
         <button className="flex items-center gap-3 p-2 text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-lg transition-colors text-sm font-medium">
             <HelpCircle size={16} />
             <span>Help & Support</span>
         </button>
      </div>
    </div>
  );
}