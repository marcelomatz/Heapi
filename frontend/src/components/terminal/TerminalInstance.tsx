import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { startSession, sendData, closeSession, resizeSession } from '../../api/terminal';
import * as runtime from '../../../wailsjs/runtime/runtime';
import type { TerminalTab, LogType } from '../../types';
import '@xterm/xterm/css/xterm.css';

// ─── Constants ────────────────────────────────────────────────────────────────

export const XTERM_THEME = {
  background: '#0b0b0f', foreground: '#d4d4d8',
  cursor: '#818cf8',     cursorAccent: '#0b0b0f',
  selectionBackground: 'rgba(129,140,248,0.25)',
  black: '#1e1e2e',   red: '#f38ba8',     green: '#a6e3a1',
  yellow: '#f9e2af',  blue: '#89b4fa',    magenta: '#cba6f7',
  cyan: '#89dceb',    white: '#cdd6f4',
  brightBlack: '#45475a',   brightRed: '#f38ba8',     brightGreen: '#a6e3a1',
  brightYellow: '#f9e2af',  brightBlue: '#89b4fa',    brightMagenta: '#cba6f7',
  brightCyan: '#89dceb',    brightWhite: '#cdd6f4',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TerminalInstanceProps {
  tab: TerminalTab;
  isActive: boolean;
  onClose: () => void;
  onRegisterSearch: (addon: SearchAddon) => void;
  onLog: (message: string, type?: LogType) => void;
}

// ─── TerminalInstance ─────────────────────────────────────────────────────────

const TerminalInstance = ({ tab, isActive, onClose, onRegisterSearch, onLog }: TerminalInstanceProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef    = useRef<Terminal | null>(null);
  const fitRef      = useRef<FitAddon | null>(null);
  const isStartedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      lineHeight: 1.25,
      fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Menlo, monospace',
      theme: XTERM_THEME,
      allowTransparency: true,
      scrollback: 8000,
    });

    const fitAddon    = new FitAddon();
    const searchAddon = new SearchAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);
    term.writeln('\x1b[2m  Connecting to session...\x1b[0m');

    xtermRef.current = term;
    fitRef.current   = fitAddon;
    onRegisterSearch(searchAddon);

    // Subscribe to backend events FIRST
    let hasOutput = false;
    const unsubOutput = runtime.EventsOn(`terminal:output:${tab.sessionId}`, (data: string) => {
      hasOutput = true;
      term.write(data);
    });

    const connectionTimeout = setTimeout(() => {
      if (!hasOutput) {
        term.writeln('\r\n\x1b[33m  [Warning] Still waiting for shell output...');
        term.writeln('  This might be due to a slow startup or an invalid shell path.\x1b[0m');
      }
    }, 4000);

    let closedTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubClosed = runtime.EventsOn(`terminal:closed:${tab.sessionId}`, () => {
      clearTimeout(connectionTimeout);
      closedTimer = setTimeout(() => {
        term.writeln('\r\n\x1b[38;5;240m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
        term.writeln('\x1b[2m  Process exited.\x1b[0m');
      }, 800);
    });

    term.onData((data: string) => {
      if (!isStartedRef.current) return;
      if (closedTimer) { clearTimeout(closedTimer); closedTimer = null; }
      sendData(tab.sessionId, data);
    });

    let retryCount = 0;
    const maxRetries = 2;
    let initialOutputTimeout: ReturnType<typeof setTimeout> | null = null;

    const doStartSession = async () => {
      if (!fitRef.current) return;
      fitRef.current.fit();
      const dims = fitRef.current.proposeDimensions();
      const cols = dims?.cols ?? 80;
      const rows = dims?.rows ?? 24;

      onLog(`Starting session for tab ${tab.name} (${tab.sessionId})...`);
      try {
        await startSession(tab.sessionId, tab.shellPath, cols, rows);
        onLog(`Shell process spawned: ${tab.shellPath}`, 'success');
        isStartedRef.current = true;

        initialOutputTimeout = setTimeout(() => {
          if (!hasOutput) {
            onLog(`No output in 5s. Retry ${retryCount + 1}/${maxRetries}...`, 'warn');
            retrySession();
          }
        }, 5000);
      } catch (err) {
        onLog(`Failed to start shell: ${err}`, 'error');
        clearTimeout(connectionTimeout);
        term.writeln(`\r\n\x1b[1;31m[Critical] Failed to start shell: ${err}\x1b[0m`);
        term.writeln(`\x1b[2mPath: ${tab.shellPath}\x1b[0m`);
        if (retryCount < maxRetries) {
          onLog(`Retrying in 2s...`, 'warn');
          setTimeout(retrySession, 2000);
        }
      }
    };

    const retrySession = async () => {
      if (retryCount >= maxRetries) {
        onLog(`Max retries reached for session ${tab.sessionId}.`, 'error');
        term.writeln('\r\n\x1b[1;31m[Critical] Shell initialization failed after multiple attempts.\x1b[0m');
        return;
      }
      retryCount++;
      hasOutput = false;
      onLog(`Cleaning up failed session ${tab.sessionId}...`);
      await closeSession(tab.sessionId);
      onLog(`Restarting session (Attempt ${retryCount + 1})...`, 'warn');
      doStartSession();
    };

    setTimeout(() => { doStartSession(); term.focus(); }, 100);

    term.onResize(({ cols, rows }) => {
      if (isStartedRef.current) resizeSession(tab.sessionId, cols, rows);
    });

    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        const code = e.code;
        if (key === 'w') { onClose(); return false; }
        if (['`', 'j', 'b', 'd', 'k', 't', 'l', '\\', 'tab'].includes(key) ||
            ['Backquote', 'Backslash', 'Tab'].includes(code)) {
          return false;
        }
      }
      return true;
    });

    const onWindowResize = () => fitAddon.fit();
    window.addEventListener('resize', onWindowResize);

    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (closedTimer) clearTimeout(closedTimer);
      clearTimeout(connectionTimeout);
      if (initialOutputTimeout) clearTimeout(initialOutputTimeout);
      unsubOutput();
      unsubClosed();
      term.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isActive && fitRef.current) {
      setTimeout(() => {
        fitRef.current?.fit();
        xtermRef.current?.focus();
      }, 60);
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      style={{ display: isActive ? 'block' : 'none', height: '100%', width: '100%' }}
    />
  );
};

export default TerminalInstance;
