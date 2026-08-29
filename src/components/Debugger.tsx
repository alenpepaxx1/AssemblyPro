// Alen Pepa Copyright
import React, { useState } from 'react';
import { CpuState } from '../types';
import { cn } from '../utils/cn';
import { Search } from 'lucide-react';

interface DebuggerProps {
  cpuState: CpuState;
  breakpoints: number[];
  isPaused: boolean;
  memory?: Uint8Array;
}

export const Debugger: React.FC<DebuggerProps> = ({ cpuState, breakpoints, isPaused, memory = new Uint8Array(0) }) => {
  const [watchAddress, setWatchAddress] = useState<string>('0x08048000');

  // Basic mock memory lookup assuming memory base is 0x08048000 (.text segment)
  const getMemoryValue = (addrStr: string) => {
    try {
      const addr = parseInt(addrStr, 16);
      if (isNaN(addr)) return 'Invalid';
      const offset = addr - 0x08048000;
      if (offset >= 0 && offset < memory.length) {
        return `0x${memory[offset].toString(16).padStart(2, '0').toUpperCase()}`;
      }
      return 'Unmapped';
    } catch {
      return 'Error';
    }
  };
  return (
    <aside className="w-72 bg-[#0d1117] border-l border-[#30363d] flex flex-col shrink-0">
      <div className="p-3 text-[10px] uppercase font-bold text-[#8b949e] border-b border-[#30363d] flex justify-between items-center shrink-0">
        <span>Registers</span>
        <span className={cn("font-mono", isPaused ? "text-[#f78166] animate-pulse" : "text-[#238636]")}>
          {isPaused ? "PAUSED" : "LIVE"}
        </span>
      </div>

      <div className="flex-1 p-3 space-y-4 font-mono overflow-auto custom-scrollbar">
        <div className="space-y-1.5">
          {cpuState.registers.map((reg) => (
            <div key={reg.name} className="flex justify-between text-[11px] px-1 py-0.5 rounded hover:bg-[#161b22]">
              <span className="text-[#79c0ff]">{reg.name}</span>
              <span className="text-[#f0f6fc]">
                0x{reg.value.toString(16).padStart(reg.size / 4, '0').toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        <div className="h-[1px] bg-[#30363d] w-full"></div>

        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-[#8b949e] mb-1">Flags</div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {Object.entries(cpuState.flags).map(([flag, value]) => (
              <span key={flag} className={cn(
                "px-1.5 py-0.5 rounded",
                value ? "bg-[#238636] text-black font-bold" : "bg-[#30363d] text-[#f0f6fc]"
              )}>
                {flag}:{value ? '1' : '0'}
              </span>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-[#30363d] w-full"></div>
        
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-[#8b949e] mb-1">Instruction Ptr</div>
          <div className="flex justify-between text-[11px] px-1 py-0.5 rounded">
            <span className="text-[#d2a8ff]">EIP</span>
            <span className="text-[#f78166]">
              0x{cpuState.instructionPointer.toString(16).padStart(8, '0').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="h-[1px] bg-[#30363d] w-full"></div>

        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-[#8b949e] mb-1">Breakpoints</div>
          {breakpoints.length === 0 ? (
            <div className="text-[10px] text-[#484f58] italic px-1">No breakpoints set</div>
          ) : (
            <div className="space-y-1 text-[11px]">
              {breakpoints.map((line) => (
                <div key={line} className="flex justify-between px-1 py-0.5 rounded bg-[#161b22] border-l-2 border-[#f78166]">
                  <span className="text-[#8b949e]">Line {line}</span>
                  <span className="text-[#f78166] opacity-80">ACTIVE</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-[1px] bg-[#30363d] w-full"></div>

        <div className="space-y-2">
          <div className="text-[10px] uppercase font-bold text-[#8b949e] mb-1">Memory Watch</div>
          <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded px-2 py-1">
            <Search className="w-3 h-3 text-[#8b949e] mr-2 shrink-0" />
            <input
              type="text"
              value={watchAddress}
              onChange={(e) => setWatchAddress(e.target.value)}
              placeholder="e.g. 0x08048000"
              className="bg-transparent border-none outline-none text-[11px] text-[#c9d1d9] w-full font-mono placeholder:text-[#484f58]"
            />
          </div>
          <div className="flex justify-between items-center text-[11px] px-1 py-1 rounded bg-[#0d1117] border border-[#30363d] mt-2">
            <span className="text-[#8b949e]">Value:</span>
            <span className={cn(
              "font-bold",
              getMemoryValue(watchAddress) === 'Unmapped' || getMemoryValue(watchAddress) === 'Invalid'
                ? "text-[#f85149]"
                : "text-[#79c0ff]"
            )}>
              {getMemoryValue(watchAddress)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
