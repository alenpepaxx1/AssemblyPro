// Alen Pepa Copyright
import React, { useMemo } from 'react';
import { ViewBase } from '../types';
import { formatByte } from '../utils/assembler';
import { cn } from '../utils/cn';

interface HexViewerProps {
  data: Uint8Array;
  prevData?: Uint8Array;
  base: ViewBase;
  activeOffset?: number;
}

export const HexViewer: React.FC<HexViewerProps> = ({ data, prevData, base, activeOffset }) => {
  const rows = useMemo(() => {
    const result = [];
    const maxBytes = Math.min(data.length, 16384); // Limit to 16KB for performance
    for (let i = 0; i < maxBytes; i += 16) {
      result.push({
        offset: i,
        chunk: data.slice(i, i + 16),
      });
    }
    return result;
  }, [data]);

  const getChar = (byte: number) => {
    return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
  };

  const getByteWidth = () => {
    if (base === 'hex') return 'w-6';
    if (base === 'dec') return 'w-8';
    return 'w-16'; // bin
  };

  return (
    <div className="flex-1 overflow-auto bg-[#0d1117] text-[#c9d1d9] font-mono text-[11px] p-4 custom-scrollbar">
      {rows.length === 0 && (
        <div className="text-[#8b949e] italic">No binary data loaded. Compile code or open a file.</div>
      )}
      {rows.map((row) => (
        <div key={row.offset} className="flex hover:bg-[#161b22] px-2 py-0.5 rounded transition-colors group">
          {/* Offset */}
          <div className="w-20 text-[#8b949e] select-none shrink-0">
            {row.offset.toString(16).padStart(8, '0').toUpperCase()}
          </div>
          
          {/* Hex/Dec/Bin Data */}
          <div className="flex-1 flex gap-2">
            <div className="flex gap-x-2 flex-wrap text-[#79c0ff]">
              {Array.from(row.chunk).map((byte: number, i) => {
                const globalOffset = row.offset + i;
                const isActive = globalOffset === activeOffset;
                
                let isModified = false;
                let isNew = false;
                if (prevData && prevData.length > 0) {
                  if (globalOffset >= prevData.length) {
                    isNew = true;
                  } else if (prevData[globalOffset] !== byte) {
                    isModified = true;
                  }
                }
                
                return (
                  <span
                    key={i}
                    className={cn(
                      "inline-block text-center cursor-pointer transition-colors",
                      getByteWidth(),
                      isActive 
                        ? "bg-[#238636]/30 text-white" 
                        : isModified
                          ? "bg-[#d2a8ff]/20 text-[#d2a8ff] rounded-sm ring-1 ring-[#d2a8ff]/50"
                          : isNew
                            ? "bg-[#79c0ff]/20 text-[#79c0ff] rounded-sm ring-1 ring-[#79c0ff]/50"
                            : "hover:bg-[#30363d] hover:text-[#f0f6fc]",
                      byte === 0 && !isActive && !isModified && !isNew ? "text-[#484f58]" : ""
                    )}
                    title={isActive ? `Offset: 0x${globalOffset.toString(16).toUpperCase()}` : isModified ? `Modified Byte at 0x${globalOffset.toString(16).toUpperCase()}` : isNew ? `New Byte at 0x${globalOffset.toString(16).toUpperCase()}` : `Offset: 0x${globalOffset.toString(16).toUpperCase()}`}
                  >
                    {formatByte(byte, base)}
                  </span>
                );
              })}
              {/* Padding for incomplete rows */}
              {row.chunk.length < 16 && (
                <span className="text-transparent select-none">
                  {Array.from({ length: 16 - row.chunk.length })
                    .map(() => formatByte(0, base))
                    .join(' ')}
                </span>
              )}
            </div>
          </div>

          {/* ASCII View */}
          <div className="w-32 border-l border-[#30363d] pl-4 tracking-widest text-[#8b949e] break-all shrink-0">
            {Array.from(row.chunk).map((byte: number, i) => {
               const globalOffset = row.offset + i;
               const isActive = globalOffset === activeOffset;
               
               let isModified = false;
               let isNew = false;
               if (prevData && prevData.length > 0) {
                 if (globalOffset >= prevData.length) {
                   isNew = true;
                 } else if (prevData[globalOffset] !== byte) {
                   isModified = true;
                 }
               }
               
               return (
                 <span key={i} className={cn(
                   isActive ? 'text-[#238636] font-bold bg-[#238636]/20' : '',
                   isModified && !isActive ? 'text-[#d2a8ff] bg-[#d2a8ff]/10' : '',
                   isNew && !isActive ? 'text-[#79c0ff] bg-[#79c0ff]/10' : ''
                 )}>
                   {getChar(byte)}
                 </span>
               );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
