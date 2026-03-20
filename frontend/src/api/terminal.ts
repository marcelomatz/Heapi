// ─── API: Terminal ────────────────────────────────────────────────────────────

import {
  StartTerminalSessionWithShell,
  SendTerminalDataToSession,
  CloseTerminalSession,
  SetTerminalSizeForSession,
  GetAvailableShells,
} from '../../wailsjs/go/main/App';
import type { Shell } from '../types';

export async function getAvailableShells(): Promise<Shell[]> {
  try {
    const data = await GetAvailableShells();
    return (data as unknown as Shell[]) ?? [];
  } catch (err) {
    console.error('[api/terminal] getAvailableShells failed:', err);
    return [{ id: 'pwsh', name: 'PowerShell', path: 'powershell.exe' }];
  }
}

export async function startSession(
  sessionId: string,
  shellPath: string,
  cols: number,
  rows: number,
): Promise<void> {
  await StartTerminalSessionWithShell(sessionId, shellPath, cols, rows);
}

export function sendData(sessionId: string, data: string): void {
  SendTerminalDataToSession(sessionId, data);
}

export async function closeSession(sessionId: string): Promise<void> {
  try {
    await CloseTerminalSession(sessionId);
  } catch {
    // Ignore cleanup errors
  }
}

export async function resizeSession(
  sessionId: string,
  cols: number,
  rows: number,
): Promise<void> {
  try {
    await SetTerminalSizeForSession(sessionId, cols, rows);
  } catch {
    // Ignore resize errors on shutdown
  }
}
