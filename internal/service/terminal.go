package service

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"sync"
	"syscall"

	"github.com/charmbracelet/x/conpty"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type terminalSession struct {
	pty    *conpty.ConPty
	pid    int
	stopCh chan struct{}
}

// TerminalManager securely handles all active multi-tab ConPTY sessions.
type TerminalManager struct {
	ctx      context.Context
	sessions map[string]*terminalSession
	mu       sync.RWMutex
}

// NewTerminalManager allocates a new registry for pseudo-terminals.
func NewTerminalManager() *TerminalManager {
	return &TerminalManager{
		sessions: make(map[string]*terminalSession),
	}
}

// SetContext assigns the global wails context, required for runtime.EventsEmit.
func (tm *TerminalManager) SetContext(ctx context.Context) {
	tm.ctx = ctx
}

// Start spawns an asynchronous ConPTY session bounded to a unique sessionID.
func (tm *TerminalManager) Start(sessionID string, shellPath string, cols, rows int) error {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	// Check idempotency - restart if exists but broken, else ignore.
	if existing, ok := tm.sessions[sessionID]; ok {
		// A rudimentary check. If it exists, we close and recreate.
		existing.pty.Close()
		close(existing.stopCh)
	}

	lower := strings.ToLower(shellPath)
	if shellPath == "" {
		shellPath = "powershell.exe"
		lower = "powershell.exe"
	}

	var args []string
	switch {
	case strings.HasSuffix(lower, "powershell.exe") || strings.HasSuffix(lower, "pwsh.exe"):
		args = []string{"-NoLogo"}
	case strings.HasSuffix(lower, "bash.exe"):
		args = []string{"--login"}
	case strings.HasSuffix(lower, "cmd.exe"):
		args = []string{}
	}

	// Create pseudo console
	cpty, err := conpty.New(cols, rows, 0)
	if err != nil {
		return fmt.Errorf("failed creating conpty: %w", err)
	}

	// Spawn the requested shell
	pid, _, err := cpty.Spawn(shellPath, args, &syscall.ProcAttr{
		Env: os.Environ(),
	})
	if err != nil {
		cpty.Close()
		return fmt.Errorf("failed spawning shell: %w", err)
	}

	stopCh := make(chan struct{})
	session := &terminalSession{
		pty:    cpty,
		pid:    pid,
		stopCh: stopCh,
	}
	tm.sessions[sessionID] = session

	// Background thread: continuously read STDOUT from pseudo-terminal and stream to Wails event system
	// This multithreaded design prevents any I/O blocking in the main Wails event loop.
	go tm.readPump(sessionID, cpty, stopCh)

	// We intentionally do not wait for the process here to keep the application responsive.
	// Clean up would be driven by the frontend closing the tab or process death detection if desired.
	// Right now, an I/O read error will trigger cleanup.

	return nil
}

// Write safely submits raw keystroke bytes to the ConPTY STDIN stream asynchronously.
func (tm *TerminalManager) Write(sessionID string, data string) {
	tm.mu.RLock()
	session, ok := tm.sessions[sessionID]
	tm.mu.RUnlock()

	if ok && session.pty != nil {
		// Asynchronous write prevents hanging Wails bindings if the shell is unresponsive.
		go func() {
			_, err := session.pty.Write([]byte(data))
			if err != nil {
				fmt.Printf("[TerminalManager] Error writing to session %s: %v\n", sessionID, err)
			}
		}()
	}
}

// Resize dynamically recalculates the rows/cols bounds of the backing ConPTY pseudo console.
func (tm *TerminalManager) Resize(sessionID string, cols, rows int) error {
	tm.mu.RLock()
	session, ok := tm.sessions[sessionID]
	tm.mu.RUnlock()

	if !ok {
		// Silent return for race conditions where frontend resizes before backend starts.
		return nil
	}

	return session.pty.Resize(cols, rows)
}

// Close gracefully shuts down the requested terminal and kills the child process.
func (tm *TerminalManager) Close(sessionID string) error {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	session, ok := tm.sessions[sessionID]
	if !ok {
		return nil
	}

	// Signalling the read pump to stop
	select {
	case <-session.stopCh:
	default:
		close(session.stopCh)
	}

	err := session.pty.Close() // Will force IO EOF on readPump. Process might be orphaned on windows if not explicitly tracked, but conpty handles pseudo-console handle tearing.

	// Terminate the underlying process trees explicitly if needed via os:
	if p, findErr := os.FindProcess(session.pid); findErr == nil {
		_ = p.Kill()
	}

	delete(tm.sessions, sessionID)

	if tm.ctx != nil {
		runtime.EventsEmit(tm.ctx, "terminal:closed:"+sessionID, nil)
	}

	return err
}

// readPump handles continuous byte transfer from PTY STDOUT to Frontend via events.
func (tm *TerminalManager) readPump(sessionID string, cpty *conpty.ConPty, stopCh chan struct{}) {
	eventKey := "terminal:output:" + sessionID
	buf := make([]byte, 8192) // 8KB buffer for optimal chunky reads

	for {
		select {
		case <-stopCh:
			return
		default:
			// Blocking read inside this goroutine.
			// PTY merges STDOUT and STDERR intrinsically!
			n, err := cpty.Read(buf)
			if n > 0 && tm.ctx != nil {
				// We must emit chunks precisely for xterm engine to decode ANSI properly.
				runtime.EventsEmit(tm.ctx, eventKey, string(buf[:n]))
			}

			if err != nil {
				// On Windows, "The pipe has been ended" (err 109) is a standard EOF for pipes.
				if err != io.EOF && !strings.Contains(err.Error(), "pipe has been ended") {
					fmt.Printf("[TerminalManager] Read Pump failed for %s: %v\n", sessionID, err)
				}
				// Auto-close on process exit
				tm.Close(sessionID)
				return
			}
		}
	}
}
