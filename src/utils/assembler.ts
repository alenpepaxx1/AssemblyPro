// Alen Pepa Copyright
// A mock assembler to simulate real-time compilation in the browser
// In a real advanced app, this would wrap an Emscripten port of Capstone/Keystone or similar.

export function assembleToMachineCode(assembly: string): Uint8Array {
  const lines = assembly.split('\n');
  const bytes: number[] = [];

  const validMnemonics = ['NOP', 'RET', 'INT', 'MOV', 'XOR', 'JMP', 'PUSH', 'POP', 'CALL', 'ADD', 'SUB', 'INC', 'DEC', 'CMP', 'JE', 'JNE', 'JZ', 'JNZ', 'AND', 'OR', 'TEST', 'LEA', 'SYSCALL'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let clean = line.split(';')[0].trim().toUpperCase();
    if (!clean) continue;

    // Handle labels on the same line (e.g., "_start: NOP")
    const colonIndex = clean.indexOf(':');
    if (colonIndex !== -1) {
      // It's possible there's an instruction after the label
      clean = clean.substring(colonIndex + 1).trim();
      if (!clean) continue; // It was just a label
    }

    // Skip directives
    if (clean.startsWith('SECTION') || 
        clean.startsWith('GLOBAL') || 
        clean.startsWith('EXTERN') ||
        clean.startsWith('BITS') ||
        clean.includes(' EQU ') || 
        clean.includes(' DB ') || 
        clean.includes(' DW ') || 
        clean.includes(' DD ') || 
        clean.includes(' DQ ')) {
        continue;
    }

    const mnemonic = clean.split(/[ \t]+/)[0];

    if (!validMnemonics.includes(mnemonic)) {
      throw { line: i + 1, message: `Invalid or unsupported instruction: '${mnemonic}'` };
    }

    // Very basic mock translation for visual demonstration
    if (clean === 'NOP') {
      bytes.push(0x90);
    } else if (clean === 'RET') {
      bytes.push(0xC3);
    } else if (clean === 'INT 3') {
      bytes.push(0xCC);
    } else if (clean === 'INT 0X80') {
      bytes.push(0xCD, 0x80);
    } else if (clean.startsWith('MOV EAX, 1')) {
      bytes.push(0xB8, 0x01, 0x00, 0x00, 0x00);
    } else if (clean.startsWith('MOV EAX, 4')) {
      bytes.push(0xB8, 0x04, 0x00, 0x00, 0x00);
    } else if (clean.startsWith('MOV EBX, 1')) {
      bytes.push(0xBB, 0x01, 0x00, 0x00, 0x00);
    } else if (clean.startsWith('XOR EAX, EAX')) {
      bytes.push(0x31, 0xC0);
    } else if (clean.startsWith('JMP')) {
      bytes.push(0xEB, 0xFE); // Mock infinite loop jump
    } else {
      // Mock generation for unknown valid instructions to look realistic
      let hash = 0;
      for (let j = 0; j < clean.length; j++) {
        hash = ((hash << 5) - hash) + clean.charCodeAt(j);
        hash = hash & hash;
      }
      bytes.push(0x0F, Math.abs(hash % 255));
      if (clean.includes(',')) {
        bytes.push(Math.abs((hash >> 8) % 255));
      }
    }
  }

  // If no code, return some mock ELF header or empty
  if (bytes.length === 0) {
    return new Uint8Array([0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00]);
  }

  return new Uint8Array(bytes);
}

export function disassembleFromMachineCode(bytes: Uint8Array): string {
  if (bytes.length === 0) return '; Empty binary\n';
  
  // Check for mock ELF header
  if (bytes.length >= 8 && bytes[0] === 0x7F && bytes[1] === 0x45 && bytes[2] === 0x4C && bytes[3] === 0x46) {
    if (bytes.length === 8) return '; Empty ELF Header\n';
  }

  let code = '; Disassembled from binary\n\nsection .text\nglobal _start\n\n_start:\n';
  
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    
    if (b === 0x90) {
      code += '    NOP\n';
      i += 1;
    } else if (b === 0xC3) {
      code += '    RET\n';
      i += 1;
    } else if (b === 0xCC) {
      code += '    INT 3\n';
      i += 1;
    } else if (b === 0xCD && i + 1 < bytes.length && bytes[i+1] === 0x80) {
      code += '    INT 0x80\n';
      i += 2;
    } else if (b === 0xB8 && i + 4 < bytes.length && bytes[i+1] === 0x01 && bytes[i+2] === 0x00 && bytes[i+3] === 0x00 && bytes[i+4] === 0x00) {
      code += '    MOV EAX, 1\n';
      i += 5;
    } else if (b === 0xB8 && i + 4 < bytes.length && bytes[i+1] === 0x04 && bytes[i+2] === 0x00 && bytes[i+3] === 0x00 && bytes[i+4] === 0x00) {
      code += '    MOV EAX, 4\n';
      i += 5;
    } else if (b === 0xBB && i + 4 < bytes.length && bytes[i+1] === 0x01 && bytes[i+2] === 0x00 && bytes[i+3] === 0x00 && bytes[i+4] === 0x00) {
      code += '    MOV EBX, 1\n';
      i += 5;
    } else if (b === 0x31 && i + 1 < bytes.length && bytes[i+1] === 0xC0) {
      code += '    XOR EAX, EAX\n';
      i += 2;
    } else if (b === 0xEB && i + 1 < bytes.length && bytes[i+1] === 0xFE) {
      code += '    JMP $\n';
      i += 2;
    } else if (b === 0x0F && i + 1 < bytes.length) {
      // Mock generated hashes
      code += `    DB 0x0F, 0x${bytes[i+1].toString(16).padStart(2, '0').toUpperCase()} ; Unknown mocked instruction\n`;
      i += 2;
    } else {
      // Default to data byte for unknown instructions
      code += `    DB 0x${b.toString(16).padStart(2, '0').toUpperCase()}\n`;
      i += 1;
    }
  }
  
  return code;
}

export function formatByte(byte: number, base: 'hex' | 'dec' | 'bin'): string {
  switch (base) {
    case 'hex':
      return byte.toString(16).padStart(2, '0').toUpperCase();
    case 'dec':
      return byte.toString(10).padStart(3, '0');
    case 'bin':
      return byte.toString(2).padStart(8, '0');
  }
}
