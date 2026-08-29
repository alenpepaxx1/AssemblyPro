// Alen Pepa Copyright
import React, { useState, useRef, useEffect } from 'react';
import { Play, ChevronRight } from 'lucide-react';
import { ViewBase } from '../types';
import { cn } from '../utils/cn';

interface TopBarProps {
  onAssemble: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: () => void;
  onNewFile: () => void;
  onRun: () => void;
  onEditorAction: (actionId: string) => void;
  viewBase: ViewBase;
  setViewBase: (base: ViewBase) => void;
  showMemoryMap: boolean;
  setShowMemoryMap: (show: boolean) => void;
  showDebugger: boolean;
  setShowDebugger: (show: boolean) => void;
  showMinimap: boolean;
  setShowMinimap: (show: boolean) => void;
  openCommandPalette: () => void;
  onResetDebugger: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  onAssemble, onFileUpload, onDownload, onNewFile, onRun, onEditorAction,
  viewBase, setViewBase, 
  showMemoryMap, setShowMemoryMap,
  showDebugger, setShowDebugger,
  showMinimap, setShowMinimap,
  openCommandPalette, onResetDebugger
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menu: string) => {
    setActiveMenu(prev => prev === menu ? null : menu);
  };

  const handleAction = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <nav className="h-12 flex items-center justify-between px-4 bg-[#161b22] border-b border-[#30363d] shrink-0 select-none">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#238636] rounded flex items-center justify-center font-bold text-black text-xs">A+</div>
          <span className="font-bold text-sm tracking-tight text-[#f0f6fc]">Assemble+ <span className="text-[#8b949e] font-normal font-mono px-1">v2.4.0</span></span>
        </div>

        <div className="flex gap-2 text-xs font-medium text-[#c9d1d9]" ref={menuRef}>
          {/* FILE MENU */}
          <div className="relative">
            <button 
              className={cn("px-2 py-1 rounded transition-colors", activeMenu === 'file' ? "bg-[#30363d] text-[#f0f6fc]" : "hover:bg-[#30363d]/50 hover:text-[#f0f6fc]")} 
              onClick={() => toggleMenu('file')}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#161b22] border border-[#30363d] rounded-md shadow-xl py-1 z-50">
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(onNewFile)}>New File</button>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => { setActiveMenu(null); if (fileInputRef.current) fileInputRef.current.value = ''; fileInputRef.current?.click(); }}>
                  Open File...
                  <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { onFileUpload(e); }} />
                </button>
                <div className="h-px bg-[#30363d] my-1"></div>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(onDownload)}>Export Binary...</button>
              </div>
            )}
          </div>

          {/* EDIT MENU */}
          <div className="relative">
            <button 
              className={cn("px-2 py-1 rounded transition-colors", activeMenu === 'edit' ? "bg-[#30363d] text-[#f0f6fc]" : "hover:bg-[#30363d]/50 hover:text-[#f0f6fc]")} 
              onClick={() => toggleMenu('edit')}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#161b22] border border-[#30363d] rounded-md shadow-xl py-1 z-50">
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(() => onEditorAction('undo'))}>Undo</button>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(() => onEditorAction('redo'))}>Redo</button>
                <div className="h-px bg-[#30363d] my-1"></div>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(() => onEditorAction('editor.action.clipboardCutAction'))}>Cut</button>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(() => onEditorAction('editor.action.clipboardCopyAction'))}>Copy</button>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(() => onEditorAction('editor.action.clipboardPasteAction'))}>Paste</button>
                <div className="h-px bg-[#30363d] my-1"></div>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(() => onEditorAction('actions.find'))}>Find</button>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(() => onEditorAction('editor.action.startFindReplaceAction'))}>Replace</button>
              </div>
            )}
          </div>

          {/* VIEW MENU */}
          <div className="relative">
            <button 
              className={cn("px-2 py-1 rounded transition-colors", activeMenu === 'view' ? "bg-[#30363d] text-[#f0f6fc]" : "hover:bg-[#30363d]/50 hover:text-[#f0f6fc]")} 
              onClick={() => toggleMenu('view')}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#161b22] border border-[#30363d] rounded-md shadow-xl py-1 z-50">
                <div className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-[#238636] hover:text-white group relative cursor-default">
                  <span>Binary Format</span>
                  <ChevronRight className="w-4 h-4" />
                  <div className="hidden group-hover:block absolute top-0 left-full ml-0 w-32 bg-[#161b22] border border-[#30363d] rounded-md shadow-xl py-1">
                    <div className={cn("w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white cursor-pointer", viewBase === 'hex' && "font-bold text-[#79c0ff]")} onClick={(e) => { e.stopPropagation(); handleAction(() => setViewBase('hex')); }}>Hexadecimal</div>
                    <div className={cn("w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white cursor-pointer", viewBase === 'dec' && "font-bold text-[#79c0ff]")} onClick={(e) => { e.stopPropagation(); handleAction(() => setViewBase('dec')); }}>Decimal</div>
                    <div className={cn("w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white cursor-pointer", viewBase === 'bin' && "font-bold text-[#79c0ff]")} onClick={(e) => { e.stopPropagation(); handleAction(() => setViewBase('bin')); }}>Binary</div>
                  </div>
                </div>
                <div className="h-px bg-[#30363d] my-1"></div>
                <button className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(() => setShowMemoryMap(!showMemoryMap))}>
                  <span>Memory Map</span>
                  {showMemoryMap && <span className="text-xs">✓</span>}
                </button>
                <button className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(() => setShowDebugger(!showDebugger))}>
                  <span>Debugger</span>
                  {showDebugger && <span className="text-xs">✓</span>}
                </button>
                <button className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(() => setShowMinimap(!showMinimap))}>
                  <span>Editor Minimap</span>
                  {showMinimap && <span className="text-xs">✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* TOOLS MENU */}
          <div className="relative">
            <button 
              className={cn("px-2 py-1 rounded transition-colors", activeMenu === 'tools' ? "bg-[#30363d] text-[#f0f6fc]" : "hover:bg-[#30363d]/50 hover:text-[#f0f6fc]")} 
              onClick={() => toggleMenu('tools')}
            >
              Tools
            </button>
            {activeMenu === 'tools' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#161b22] border border-[#30363d] rounded-md shadow-xl py-1 z-50">
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(onAssemble)}>Assemble Code</button>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(onRun)}>Run Code</button>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(onResetDebugger)}>Reset Debugger</button>
                <div className="h-px bg-[#30363d] my-1"></div>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(() => onEditorAction('editor.action.formatDocument'))}>Format Document</button>
                <button className="w-full text-left px-4 py-1.5 hover:bg-[#238636] hover:text-white" onClick={() => handleAction(openCommandPalette)}>Command Palette...</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-[#0d1117] border border-[#30363d] rounded p-1">
          {(['hex', 'dec', 'bin'] as ViewBase[]).map((base) => (
            <button
              key={base}
              onClick={() => setViewBase(base)}
              className={cn(
                "px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors",
                viewBase === base 
                  ? "bg-[#30363d] text-[#f0f6fc] shadow-sm" 
                  : "text-[#8b949e] hover:text-[#f0f6fc]"
              )}
            >
              {base}
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-[#30363d]"></div>

        <button 
          onClick={onAssemble}
          className="px-3 py-1 text-[10px] font-bold bg-[#161b22] text-[#f0f6fc] border border-[#30363d] rounded shadow-sm hover:bg-[#30363d] flex items-center gap-1 transition-colors"
        >
          COMPILE
        </button>
        <button 
          onClick={onRun}
          className="px-3 py-1 text-[10px] font-bold bg-[#238636] text-white rounded shadow-sm hover:bg-[#2ea043] flex items-center gap-1 transition-colors"
        >
          <Play className="w-3 h-3 fill-current" />
          RUN
        </button>
      </div>
    </nav>
  );
};
