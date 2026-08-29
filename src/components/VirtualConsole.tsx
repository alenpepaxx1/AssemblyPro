// Alen Pepa Copyright
import React, { useEffect, useRef } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

interface VirtualConsoleProps {
  logs: string[];
  onClear: () => void;
}

export const VirtualConsole: React.FC<VirtualConsoleProps> = ({ logs, onClear }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-48 bg-[#090c10] border-t border-[#30363d] flex flex-col shrink-0">
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-[#30363d] bg-[#161b22]">
        <div className="flex items-center gap-2 text-[#8b949e] text-[11px] uppercase font-bold tracking-wider">
          <Terminal className="w-3.5 h-3.5" />
          Virtual Console
        </div>
        <button 
          onClick={onClear}
          className="p-1 text-[#8b949e] hover:text-[#f0f6fc] transition-colors rounded hover:bg-[#30363d]"
          title="Clear Console"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[12px] leading-relaxed custom-scrollbar text-[#c9d1d9] selection:bg-[#238636] selection:text-white">
        {logs.length === 0 ? (
          <div className="text-[#484f58] italic">No output. Run your program to see logs...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={
              log.startsWith('>') 
                ? 'text-[#79c0ff] font-bold mb-1' 
                : log.startsWith('[ERROR]')
                  ? 'text-[#f85149]'
                  : 'whitespace-pre-wrap'
            }>
              {log}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};
