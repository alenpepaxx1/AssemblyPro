// Alen Pepa Copyright
export interface Register {
  name: string;
  value: number;
  size: 8 | 16 | 32 | 64;
}

export interface CpuState {
  registers: Register[];
  flags: {
    ZF: boolean; // Zero Flag
    SF: boolean; // Sign Flag
    OF: boolean; // Overflow Flag
    CF: boolean; // Carry Flag
  };
  instructionPointer: number;
}

export type ViewBase = 'hex' | 'dec' | 'bin';
