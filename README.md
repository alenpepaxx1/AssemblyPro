# x86 Assembly Virtual IDE

A powerful, web-based x86 Assembly Integrated Development Environment (IDE) and CPU simulator. Built with modern web technologies, this tool allows you to write, compile, and debug assembly code directly in your browser.

**Author:** Alen Pepa  
**Copyright:** © Alen Pepa

## 🚀 Features

* **Advanced Code Editor:** Integrated with Monaco Editor for a VS Code-like experience, including syntax highlighting and live error markers for Assembly language.
* **Live Assembler & Disassembler:** Real-time translation of assembly instructions into machine code.
* **Hex Viewer:** Inspect compiled binary data in Hexadecimal, Decimal, and Binary formats alongside their ASCII representation.
* **Virtual CPU Debugger:** Step through your code instruction by instruction. Monitor CPU registers (EAX, EBX, ECX, EDX, EIP, etc.) and system flags (ZF, CF, SF, OF) in real-time.
* **Memory Map & Watch:** Visualize memory segments (`.text`, `.data`, `.bss`, `heap`, `stack`) dynamically. Use the **Memory Watch** tool to inspect specific memory addresses, and export the CPU state and memory map to JSON.
* **Virtual Console:** A built-in terminal to view program output during execution.
* **Command Palette:** Quick access to actions and tools via `Ctrl+Shift+P`.
* **File Management:** Upload and download `.asm`, `.s`, `.txt` source files or pre-compiled binaries effortlessly.

## 🛠️ How It Works

1. **Write Code:** Enter your x86 assembly instructions in the main editor panel.
2. **Compile:** The IDE parses the instructions and converts them into machine code bytes. Syntax errors are caught and highlighted immediately in the editor.
3. **Debug & Run:** Use the Top Bar controls to "Run" the program or "Step Into" instructions. The Virtual CPU executes the instructions, updates the registers, and modifies the memory map dynamically.
4. **Analyze:** Check the Hex Viewer to see how your code translates to raw bytes, and watch the Virtual Console for simulated standard output.

## 💻 Installation

To run this project locally on your machine, ensure you have [Node.js](https://nodejs.org/) installed, then follow these steps:

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <your-project-directory>
   ```

2. **Install dependencies:**
   Run the following command to download all required NPM packages:
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to the local URL provided in your terminal (usually `http://localhost:5173`) to start using the IDE.

## 📦 Build for Production

To create an optimized, production-ready build:

```bash
npm run build
```
The compiled static files will be located in the `dist/` directory, ready to be deployed to any static web host.

---
*Designed and Developed by Alen Pepa.*
