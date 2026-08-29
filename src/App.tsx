// Alen Pepa Copyright
import React, { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { TopBar } from './components/TopBar';
import { HexViewer } from './components/HexViewer';
import { Debugger } from './components/Debugger';
import { MemoryMap } from './components/MemoryMap';
import { CommandPalette, Command } from './components/CommandPalette';
import { VirtualConsole } from './components/VirtualConsole';
import { assembleToMachineCode, disassembleFromMachineCode } from './utils/assembler';
import { CpuState, ViewBase } from './types';
import { Code2, Binary } from 'lucide-react';
import { cn } from './utils/cn';

const INITIAL_CODE = `; Assemble+ | Advanced Web Assembler
; Start typing your assembly code here.

section .text
global _start

_start:
    ; Print message
    mov eax, 4
    mov ebx, 1
    mov ecx, msg
    mov edx, len
    int 0x80

    ; Exit
    mov eax, 1
    xor ebx, ebx
    int 0x80

section .data
    msg db 'Hello, Assemble+!', 0xa
    len equ $ - msg
`;

const STORAGE_KEY = 'assemble_plus_saved_code';

export default function App() {
  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? saved : INITIAL_CODE;
  });
  const [binaryData, setBinaryData] = useState<Uint8Array>(new Uint8Array(0));
  const [prevBinaryData, setPrevBinaryData] = useState<Uint8Array>(new Uint8Array(0));
  const [viewBase, setViewBase] = useState<ViewBase>('hex');
  
  const [cpuState, setCpuState] = useState<CpuState>({
    registers: [
      { name: 'EAX', value: 0x00000000, size: 32 },
      { name: 'EBX', value: 0x00000000, size: 32 },
      { name: 'ECX', value: 0x00000000, size: 32 },
      { name: 'EDX', value: 0x00000000, size: 32 },
      { name: 'ESP', value: 0xBFFFF000, size: 32 },
      { name: 'EBP', value: 0xBFFFF000, size: 32 },
      { name: 'ESI', value: 0x00000000, size: 32 },
      { name: 'EDI', value: 0x00000000, size: 32 },
    ],
    flags: { ZF: false, SF: false, OF: false, CF: false },
    instructionPointer: 0x08048000,
  });

  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [buildError, setBuildError] = useState<{line: number, message: string} | null>(null);

  const [showMemoryMap, setShowMemoryMap] = useState(true);
  const [showDebugger, setShowDebugger] = useState(true);
  const [showMinimap, setShowMinimap] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['Virtual Console initialized.']);

  // Compile on mount just to have initial data
  useEffect(() => {
    handleAssemble();
  }, []);

  const handleNewFile = () => {
    setCode(`; Assemble+ | Advanced Web Assembler\n; Start typing your assembly code here.\n\nsection .text\nglobal _start\n\n_start:\n    nop\n`);
    setBinaryData(new Uint8Array(0));
    setPrevBinaryData(new Uint8Array(0));
    setBreakpoints([]);
    setIsPaused(false);
    setConsoleLogs(['Virtual Console initialized.']);
  };

  const handleRun = () => {
    const newLogs = ['> Executing binary...'];
    try {
      assembleToMachineCode(code); // verify it compiles
      
      // Basic mock simulation: extract defined strings and print them if sys_write is present
      const strings = [...code.matchAll(/db\s+['"]([^'"]+)['"]/gi)].map(m => m[1]);
      if (strings.length > 0 && (code.toLowerCase().includes('int 0x80') || code.toLowerCase().includes('syscall'))) {
        newLogs.push(...strings);
      }
      
      newLogs.push('> Program exited normally with status 0.');
    } catch (e: any) {
      newLogs.push(`[ERROR] Execution aborted: ${e.message}`);
    }
    
    setConsoleLogs(prev => [...prev, ...newLogs]);
  };

  const handleEditorAction = (actionId: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.trigger('menu', actionId, null);
    }
  };

  // Real-time syntax validation
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        assembleToMachineCode(code);
        setBuildError(null);
        if (monacoRef.current && editorRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            monacoRef.current.editor.setModelMarkers(model, 'assembler', []);
          }
        }
      } catch (e: any) {
        if (e.line && e.message) {
          setBuildError({ line: e.line, message: e.message });
          if (monacoRef.current && editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
              monacoRef.current.editor.setModelMarkers(model, 'assembler', [{
                startLineNumber: e.line,
                startColumn: 1,
                endLineNumber: e.line,
                endColumn: model.getLineMaxColumn(e.line),
                message: e.message,
                severity: monacoRef.current.MarkerSeverity.Error
              }]);
            }
          }
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [code]);

  // Global hotkey for Command Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Auto-save code to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code);
  }, [code]);

  const handleAssemble = () => {
    try {
      const bytes = assembleToMachineCode(code);
      setBinaryData((currentBinary) => {
        // Only set previous data if we actually had data before, avoiding highlighting everything as new on first load
        if (currentBinary.length > 0) {
          setPrevBinaryData(currentBinary);
        }
        return bytes;
      });
      
      // Simulate updating CPU state based on initial instruction
      const hasBreakpoints = breakpoints.length > 0;
      
      setCpuState(prev => ({
        ...prev,
        instructionPointer: 0x08048000,
      }));
      
      setIsPaused(hasBreakpoints);
      setBuildError(null);
      if (monacoRef.current && editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monacoRef.current.editor.setModelMarkers(model, 'assembler', []);
        }
      }
    } catch (e: any) {
      if (e.line && e.message) {
        setBuildError({ line: e.line, message: e.message });
        if (monacoRef.current && editorRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            monacoRef.current.editor.setModelMarkers(model, 'assembler', [{
              startLineNumber: e.line,
              startColumn: 1,
              endLineNumber: e.line,
              endColumn: model.getLineMaxColumn(e.line),
              message: e.message,
              severity: monacoRef.current.MarkerSeverity.Error
            }]);
          }
        }
      }
    }
  };

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    editor.onMouseDown((e) => {
      if (e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = e.target.position?.lineNumber;
        if (lineNumber) {
          setBreakpoints(prev => 
            prev.includes(lineNumber) 
              ? prev.filter(l => l !== lineNumber) 
              : [...prev, lineNumber].sort((a, b) => a - b)
          );
        }
      }
    });
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    
    const monacoInstance = monacoRef.current;
    const newDecorations = breakpoints.map(line => ({
      range: new monacoInstance.Range(line, 1, line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'breakpoint-glyph'
      }
    }));
    
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecorations);
    
    if (breakpoints.length > 0 && !isPaused) {
      setIsPaused(true);
    }
  }, [breakpoints]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const isSourceFile = extension === 'asm' || extension === 's' || extension === 'txt';

    const reader = new FileReader();
    reader.onload = (event) => {
      if (isSourceFile) {
        const text = event.target?.result as string;
        if (typeof text === 'string') {
          setCode(text);
          setBinaryData(new Uint8Array(0));
          setPrevBinaryData(new Uint8Array(0));
        }
      } else {
        const buffer = event.target?.result as ArrayBuffer;
        if (buffer) {
          const bytes = new Uint8Array(buffer);
          setBinaryData(bytes);
          setPrevBinaryData(new Uint8Array(0));
          
          // Disassemble the binary directly into the editor
          const disassembledCode = disassembleFromMachineCode(bytes);
          setCode(disassembledCode);
        }
      }
    };
    
    if (isSourceFile) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDownload = () => {
    if (binaryData.length === 0) return;
    const blob = new Blob([binaryData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'build.bin';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetDebugger = () => {
    setBreakpoints([]);
    setIsPaused(false);
    setCpuState({
      registers: [
        { name: 'EAX', value: 0x00000000, size: 32 },
        { name: 'EBX', value: 0x00000000, size: 32 },
        { name: 'ECX', value: 0x00000000, size: 32 },
        { name: 'EDX', value: 0x00000000, size: 32 },
        { name: 'ESP', value: 0xBFFFF000, size: 32 },
        { name: 'EBP', value: 0xBFFFF000, size: 32 },
        { name: 'ESI', value: 0x00000000, size: 32 },
        { name: 'EDI', value: 0x00000000, size: 32 },
      ],
      flags: { ZF: false, SF: false, OF: false, CF: false },
      instructionPointer: 0x08048000,
    });
  };

  const commands: Command[] = [
    { id: 'assemble', label: 'Assemble Code', shortcut: 'Ctrl+Enter', action: handleAssemble },
    { id: 'export-bin', label: 'Export Binary (Download)', action: handleDownload },
    { id: 'reset-debug', label: 'Reset Debugger & Breakpoints', action: handleResetDebugger },
    { id: 'view-hex', label: 'Switch to HEX View', action: () => setViewBase('hex') },
    { id: 'view-dec', label: 'Switch to DEC View', action: () => setViewBase('dec') },
    { id: 'view-bin', label: 'Switch to BIN View', action: () => setViewBase('bin') },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-[#0d1117] text-[#c9d1d9] overflow-hidden selection:bg-[#238636] selection:text-white">
      <CommandPalette 
        isOpen={isPaletteOpen} 
        onClose={() => setIsPaletteOpen(false)} 
        commands={commands} 
      />
      <TopBar 
        onAssemble={handleAssemble}
        onFileUpload={handleFileUpload}
        onDownload={handleDownload}
        onNewFile={handleNewFile}
        onRun={handleRun}
        onEditorAction={handleEditorAction}
        viewBase={viewBase}
        setViewBase={setViewBase}
        showMemoryMap={showMemoryMap}
        setShowMemoryMap={setShowMemoryMap}
        showDebugger={showDebugger}
        setShowDebugger={setShowDebugger}
        showMinimap={showMinimap}
        setShowMinimap={setShowMinimap}
        openCommandPalette={() => setIsPaletteOpen(true)}
        onResetDebugger={handleResetDebugger}
      />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Memory Map */}
        {showMemoryMap && <MemoryMap cpuState={cpuState} />}

        {/* Main Workspace (Editor + Hex) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Editor Pane */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-[#30363d]">
            <div className="h-8 bg-[#0d1117] flex items-center px-4 border-b border-[#30363d] shrink-0 gap-2">
              <div className="text-[10px] font-mono text-[#79c0ff] bg-[#161b22] px-2 py-0.5 rounded">Assembly Source</div>
              <div className="text-[10px] font-mono text-[#8b949e]">Entry: _start</div>
            </div>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                defaultLanguage="x86"
                language="x86"
                theme="sophisticated-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorDidMount}
                beforeMount={(monaco) => {
                  monaco.editor.defineTheme('sophisticated-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                      { token: 'keyword', foreground: '79c0ff' },
                      { token: 'variable', foreground: 'f0f6fc' },
                      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
                      { token: 'string', foreground: 'a5d6ff' },
                      { token: 'number', foreground: 'd2a8ff' },
                      { token: 'type', foreground: 'ffa657' },
                    ],
                    colors: {
                      'editor.background': '#0d1117',
                      'editor.lineHighlightBackground': '#161b22',
                      'editorLineNumber.foreground': '#484f58',
                    }
                  });

                  // Only register if not already registered to avoid duplicates during dev
                  const isRegistered = monaco.languages.getLanguages().some(l => l.id === 'x86');
                  if (!isRegistered) {
                    monaco.languages.register({ id: 'x86' });
                    monaco.languages.setMonarchTokensProvider('x86', {
                      ignoreCase: true,
                      tokenizer: {
                        root: [
                          [/;.*$/, 'comment'],
                          [/"(?:[^\\]|\\.)*"/, 'string'],
                          [/'(?:[^\\]|\\.)*'/, 'string'],
                          [/\b(?:mov|push|pop|call|ret|add|sub|inc|dec|cmp|jmp|je|jne|jz|jnz|xor|and|or|test|lea|int|syscall|nop)\b/, 'keyword'],
                          [/\b(?:eax|ebx|ecx|edx|esi|edi|ebp|esp|rax|rbx|rcx|rdx|rsi|rdi|rbp|rsp|r8|r9|r10|r11|r12|r13|r14|r15|al|ah|bl|bh|cl|ch|dl|dh)\b/, 'variable'],
                          [/\b(?:byte|word|dword|qword)\b/, 'type'],
                          [/\b(?:section|global|db|dw|dd|dq|equ)\b/, 'keyword'],
                          [/\b0x[0-9a-fA-F]+\b/, 'number'],
                          [/\b\d+\b/, 'number'],
                          [/[a-zA-Z_]\w*:/, 'type'],
                        ]
                      }
                    });

                    monaco.languages.registerCompletionItemProvider('x86', {
                      provideCompletionItems: (model, position) => {
                        const word = model.getWordUntilPosition(position);
                        const range = {
                          startLineNumber: position.lineNumber,
                          endLineNumber: position.lineNumber,
                          startColumn: word.startColumn,
                          endColumn: word.endColumn,
                        };

                        const suggestions = [
                          ...['mov', 'push', 'pop', 'call', 'ret', 'add', 'sub', 'inc', 'dec', 'cmp', 'jmp', 'je', 'jne', 'jz', 'jnz', 'xor', 'and', 'or', 'test', 'lea', 'int', 'syscall', 'nop'].map(inst => ({
                            label: inst,
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            insertText: inst,
                            detail: 'Instruction',
                            range
                          })),
                          ...['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp', 'esp', 'rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rbp', 'rsp'].map(reg => ({
                            label: reg,
                            kind: monaco.languages.CompletionItemKind.Variable,
                            insertText: reg,
                            detail: 'Register',
                            range
                          })),
                          ...['section .text', 'section .data', 'section .bss', 'global', 'db', 'dw', 'dd', 'dq', 'equ'].map(dir => ({
                            label: dir,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: dir,
                            detail: 'Directive',
                            range
                          })),
                          ...['byte ptr', 'word ptr', 'dword ptr', 'qword ptr'].map(ptr => ({
                            label: ptr,
                            kind: monaco.languages.CompletionItemKind.TypeParameter,
                            insertText: ptr,
                            detail: 'Addressing/Size',
                            range
                          }))
                        ];

                        return { suggestions };
                      }
                    });
                  }
                }}
                options={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  minimap: { enabled: showMinimap },
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  renderLineHighlight: 'all',
                  lineHeight: 24,
                  glyphMargin: true,
                }}
              />
            </div>
            <VirtualConsole logs={consoleLogs} onClear={() => setConsoleLogs([])} />
          </div>

          {/* Hex Viewer Pane */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="h-8 bg-[#0d1117] flex items-center px-4 border-b border-[#30363d] shrink-0 gap-2">
              <div className="text-[10px] font-mono text-[#79c0ff] bg-[#161b22] px-2 py-0.5 rounded">Binary Memory</div>
              <div className="text-[10px] font-mono text-[#8b949e]">Base: {viewBase.toUpperCase()}</div>
              {isPaused && (
                <div className="ml-auto text-[10px] font-bold text-[#f78166] animate-pulse flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#f78166]"></div>
                  PAUSED ON BREAKPOINT
                </div>
              )}
            </div>
            <HexViewer data={binaryData} prevData={prevBinaryData} base={viewBase} />
          </div>

        </div>

        {/* Debugger Sidebar */}
        {showDebugger && <Debugger cpuState={cpuState} breakpoints={breakpoints} isPaused={isPaused} memory={binaryData} />}
      </main>
      
      <footer className={cn(
        "h-6 flex items-center px-3 justify-between text-[10px] font-bold shrink-0 select-none",
        buildError ? "bg-[#da3633] text-white" : "bg-[#238636] text-black"
      )}>
        <div className="flex gap-4">
          <span>Copyright © Alen Pepa</span>
          <span>UTF-8</span>
          <span>x86_64 ELF</span>
          <span>{viewBase.toUpperCase()} VIEW</span>
        </div>
        <div className="flex gap-4">
          {buildError ? (
            <span className="flex items-center gap-1">
              BUILD FAILED: Line {buildError.line} - {buildError.message}
            </span>
          ) : (
            <>
              <span>BUILD SUCCESSFUL</span>
              <span>DEBUGGER READY</span>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

