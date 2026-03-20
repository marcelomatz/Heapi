//go:build !windows

package service

import (
	"context"
	"fmt"
)

type TerminalManager struct {
	ctx context.Context
}

func NewTerminalManager() *TerminalManager {
	return &TerminalManager{}
}

func (tm *TerminalManager) SetContext(ctx context.Context) {
	tm.ctx = ctx
}

func (tm *TerminalManager) Start(sessionID string, shellPath string, cols, rows int) error {
	return fmt.Errorf("terminal is not supported on this platform")
}

func (tm *TerminalManager) Resize(sessionID string, cols, rows int) error {
	return nil
}

func (tm *TerminalManager) Write(sessionID string, data string) error {
	return nil
}

func (tm *TerminalManager) Stop(sessionID string) error {
	return nil
}

func (tm *TerminalManager) StopAll() {
}
