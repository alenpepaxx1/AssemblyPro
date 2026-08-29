// Alen Pepa Copyright
import React from 'react';
import { CpuState } from '../types';
import { cn } from '../utils/cn';
import { Download } from 'lucide-react';

interface MemoryMapProps {
  cpuState: CpuState;
}

interface MemoryRegion {
  name: string;
  start: number;
  end: number;
  perms: string;
  description: string;
  color: string;
}

const MEMORY_REGIONS: MemoryRegion[] = [
  { name: '.text', start: 0x08048000, end: 0x08049000, perms: 'r-x', description: 'Executable Code', color: 'text-[#79c0ff] bg-[#79c0ff]/10 border-[#79c0ff]' },
  { name: '.data', start: 0x08049000, end: 0x0804A000, perms: 'rw-', description: 'Initialized Data', color: 'text-[#d2a8ff] bg-[#d2a8ff]/10 border-[#d2a8ff]' },
  { name: '.bss',  start: 0x0804A000, end: 0x0804B000, perms: 'rw-', description: 'Uninitialized Data', color: 'text-[#ffa657] bg-[#ffa657]/10 border-[#ffa657]' },
  { name: 'heap',  start: 0x0804B000, end: 0x08060000, perms: 'rw-', description: 'Dynamic Memory', color: 'text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]' },
  // A gap exists here in real memory
  { name: 'stack', start: 0xBFFDF000, end: 0xBFFFF000, perms: 'rw-', description: 'Local Variables', color: 'text-[#f78166] bg-[#f78166]/10 border-[#f78166]' },
];

export const MemoryMap: React.FC<MemoryMapProps> = ({ cpuState }) => {
  const eip = cpuState.instructionPointer;

  const handleExportJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      cpuState: cpuState,
      memoryMapRegions: MEMORY_REGIONS,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory_map_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="w-64 bg-[#0d1117] border-r border-[#30363d] flex flex-col shrink-0">
      <div className="p-3 text-[10px] uppercase font-bold text-[#8b949e] border-b border-[#30363d] flex justify-between items-center shrink-0">
        <span>Virtual Memory Map</span>
        <button 
          onClick={handleExportJSON}
          className="p-1 hover:text-[#f0f6fc] hover:bg-[#30363d] rounded transition-colors"
          title="Export State to JSON"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 p-3 overflow-auto custom-scrollbar flex flex-col gap-2 font-mono">
        {MEMORY_REGIONS.map((region, index) => {
          // Check if EIP is currently in this region
          const isActiveEIP = eip >= region.start && eip < region.end;
          
          return (
            <React.Fragment key={region.name}>
              {region.name === 'stack' && (
                <div className="flex flex-col items-center justify-center py-2 opacity-50">
                  <div className="h-4 border-l-2 border-dashed border-[#8b949e]"></div>
                  <span className="text-[9px] text-[#8b949e] my-1">Unmapped / Gap</span>
                  <div className="h-4 border-l-2 border-dashed border-[#8b949e]"></div>
                </div>
              )}
              <div 
                className={cn(
                  "p-2 rounded border-l-2 relative overflow-hidden group shrink-0",
                  region.color,
                  isActiveEIP ? "ring-1 ring-inset ring-white/20" : ""
                )}
              >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-[11px]">{region.name}</span>
                <span className="text-[9px] opacity-70 px-1 py-0.5 rounded bg-black/20">{region.perms}</span>
              </div>
              
              <div className="text-[10px] opacity-80 mb-2">
                {region.description}
              </div>
              
              <div className="flex justify-between items-center text-[9px] opacity-60">
                <span>0x{region.start.toString(16).padStart(8, '0').toUpperCase()}</span>
                <span>0x{region.end.toString(16).padStart(8, '0').toUpperCase()}</span>
              </div>
              
              {isActiveEIP && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#f78166] text-black text-[9px] font-bold px-1 py-0.5 rounded-l flex items-center gap-1 shadow-[0_0_10px_rgba(247,129,102,0.5)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></div>
                  EIP
                </div>
              )}
            </div>
            </React.Fragment>
          );
        })}
        
        <div className="mt-4 p-2 text-[10px] text-[#8b949e] bg-[#161b22] rounded border border-[#30363d] text-center leading-relaxed">
          The memory map visualizes how the OS isolates program segments. 
          The <span className="text-[#f78166] font-bold">EIP</span> indicator shows where execution is currently occurring.
        </div>
      </div>
    </aside>
  );
};
