package main

import (
	"context"
	"encoding/json"
	"fmt"
	"heapi/internal/database"
	"heapi/internal/models"
	"heapi/internal/service"
	"heapi/internal/storage"
	"os"
	"os/exec"
	"runtime"
	"sort"
	"sync"

	"github.com/google/uuid"
	"gorm.io/gorm/clause"
)

// App struct
type App struct {
	ctx             context.Context
	fileMutex       sync.Mutex
	terminalManager *service.TerminalManager
	activeEnvID     string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		terminalManager: service.NewTerminalManager(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.terminalManager.SetContext(ctx)

	err := database.InitDB()
	if err != nil {
		fmt.Printf("Error initializing database: %v\n", err)
		return
	}
	err = storage.EnsureDirs()
	if err != nil {
		fmt.Printf("Error ensuring storage directories: %v\n", err)
	}
	a.SeedData() // Create initial data for testing
}

func (a *App) SeedData() {
	cols, _ := storage.LoadCollections()
	if len(cols) == 0 {
		col, _ := a.CreateCollection("Sample API")
		a.CreateRequest(col.ID, "Get Users", "GET", "https://jsonplaceholder.typicode.com/users")
	}
}

func (a *App) GetCollections() ([]models.Collection, error) {
	a.fileMutex.Lock()
	cols, err := storage.LoadCollections()
	a.fileMutex.Unlock()
	if err != nil {
		return nil, err
	}

	// Collect all request IDs and build a map for quick lookup
	var allIDs []string
	idToReq := make(map[string]*models.Request)
	for i := range cols {
		for j := range cols[i].Requests {
			id := cols[i].Requests[j].ID
			allIDs = append(allIDs, id)
			idToReq[id] = &cols[i].Requests[j]
		}
	}

	if len(allIDs) == 0 {
		return cols, nil
	}

	// Enrich with database-persisted fields in a single batch query
	var dbReqs []models.Request
	err = database.DB.Select("id", "last_response", "last_status_code", "last_duration", "last_headers").
		Where("id IN ?", allIDs).
		Find(&dbReqs).Error

	if err == nil {
		for _, dbReq := range dbReqs {
			if req, ok := idToReq[dbReq.ID]; ok {
				req.LastResponse = dbReq.LastResponse
				req.LastStatusCode = dbReq.LastStatusCode
				req.LastDuration = dbReq.LastDuration
				req.LastHeaders = dbReq.LastHeaders
			}
		}
	}

	// Sort collections by order
	sort.Slice(cols, func(i, j int) bool {
		return cols[i].Order < cols[j].Order
	})

	return cols, nil
}

func (a *App) UpdateCollection(id string, name string, color string, order int, isCollapsed bool) error {
	a.fileMutex.Lock()
	defer a.fileMutex.Unlock()
	cols, _ := storage.LoadCollections()
	for i, col := range cols {
		if col.ID == id {
			cols[i].Name = name
			cols[i].Color = color
			cols[i].Order = order
			cols[i].IsCollapsed = isCollapsed
			return storage.SaveCollection(cols[i], "yaml")
		}
	}
	return fmt.Errorf("collection not found")
}

func (a *App) UpdateCollectionsOrder(ids []string) error {
	a.fileMutex.Lock()
	defer a.fileMutex.Unlock()
	cols, _ := storage.LoadCollections()
	idToCol := make(map[string]models.Collection)
	for _, col := range cols {
		idToCol[col.ID] = col
	}

	for i, id := range ids {
		if col, ok := idToCol[id]; ok {
			col.Order = i
			storage.SaveCollection(col, "yaml")
		}
	}
	return nil
}

func (a *App) CreateCollection(name string) (models.Collection, error) {
	a.fileMutex.Lock()
	defer a.fileMutex.Unlock()
	col := models.Collection{
		ID:   uuid.New().String(),
		Name: name,
	}
	err := storage.SaveCollection(col, "yaml")
	return col, err
}

func (a *App) DeleteCollection(id string) error {
	a.fileMutex.Lock()
	defer a.fileMutex.Unlock()
	return storage.DeleteCollection(id)
}

func (a *App) RenameCollection(id string, name string) error {
	cols, _ := storage.LoadCollections()
	for _, col := range cols {
		if col.ID == id {
			col.Name = name
			return storage.SaveCollection(col, "yaml")
		}
	}
	return nil
}

// Requests
func (a *App) CreateUntitledRequest() (models.Request, error) {
	cols, err := a.GetCollections()
	if err != nil || len(cols) == 0 {
		col, err := a.CreateCollection("Default")
		if err != nil {
			return models.Request{}, err
		}
		return a.CreateRequest(col.ID, "Untitled Request", "GET", "https://api.example.com")
	}
	return a.CreateRequest(cols[0].ID, "Untitled Request", "GET", "https://api.example.com")
}

func (a *App) CreateRequest(colID string, name, method, url string) (models.Request, error) {
	cols, _ := storage.LoadCollections()
	for i, col := range cols {
		if col.ID == colID {
			req := models.Request{
				ID:           uuid.New().String(),
				CollectionID: colID,
				Name:         name,
				Method:       method,
				URL:          url,
			}
			cols[i].Requests = append(cols[i].Requests, req)
			err := storage.SaveCollection(cols[i], "yaml")
			return req, err
		}
	}
	return models.Request{}, fmt.Errorf("collection not found")
}

func (a *App) DeleteRequest(id string) error {
	cols, _ := storage.LoadCollections()
	for i, col := range cols {
		for j, req := range col.Requests {
			if req.ID == id {
				cols[i].Requests = append(cols[i].Requests[:j], cols[i].Requests[j+1:]...)
				return storage.SaveCollection(cols[i], "yaml")
			}
		}
	}
	return nil
}

func (a *App) RenameRequest(id string, name string) error {
	a.fileMutex.Lock()
	defer a.fileMutex.Unlock()
	cols, _ := storage.LoadCollections()
	for i, col := range cols {
		for j, req := range col.Requests {
			if req.ID == id {
				cols[i].Requests[j].Name = name
				return storage.SaveCollection(cols[i], "yaml")
			}
		}
	}
	return nil
}

func (a *App) UpdateRequest(id string, name, method, url, headers, body, auth string, lastRes string, lastStatus int, lastDur int64, lastHeaders string) error {
	a.fileMutex.Lock()
	defer a.fileMutex.Unlock()
	cols, _ := storage.LoadCollections()
	for i, col := range cols {
		for j, req := range col.Requests {
			if req.ID == id {
				cols[i].Requests[j].Name = name
				cols[i].Requests[j].Method = method
				cols[i].Requests[j].URL = url
				cols[i].Requests[j].Headers = headers
				cols[i].Requests[j].Body = body
				cols[i].Requests[j].AuthConfig = auth
				err := storage.SaveCollection(cols[i], "yaml")
				if err != nil {
					return err
				}

				// Also update/upsert the database with response metadata
				dbReq := models.Request{
					ID:             id,
					CollectionID:   col.ID,
					Name:           name,
					Method:         method,
					URL:            url,
					Headers:        headers,
					Body:           body,
					AuthConfig:     auth,
					LastResponse:   lastRes,
					LastStatusCode: lastStatus,
					LastDuration:   lastDur,
					LastHeaders:    lastHeaders,
				}
				database.DB.Clauses(clause.OnConflict{
					UpdateAll: true,
				}).Create(&dbReq)

				return nil
			}
		}
	}
	return nil
}

// Environments
func (a *App) GetEnvironments() ([]models.Environment, error) {
	return storage.LoadEnvironments()
}

func (a *App) CreateEnvironment(name string) (models.Environment, error) {
	env := models.Environment{
		ID:   uuid.New().String(),
		Name: name,
	}
	err := storage.SaveEnvironment(env, "yaml")
	return env, err
}

func (a *App) UpdateEnvironment(id string, name string, variables string) error {
	envs, _ := storage.LoadEnvironments()
	for _, env := range envs {
		if env.ID == id {
			env.Name = name
			env.Variables = variables
			return storage.SaveEnvironment(env, "yaml")
		}
	}
	return nil
}

func (a *App) DeleteEnvironment(id string) error {
	return storage.DeleteEnvironment(id)
}

func (a *App) SetActiveEnvironment(id string) {
	a.activeEnvID = id
}

func (a *App) ImportFromCurl(curl string) (models.Request, error) {
	return storage.ImportFromCurl(curl)
}

func (a *App) ImportPostman(jsonData string) (models.Collection, error) {
	col, err := storage.ImportPostmanV2([]byte(jsonData))
	if err == nil {
		err = storage.SaveCollection(col, "yaml")
	}
	return col, err
}

func (a *App) ExportCollection(id string, format string) (string, error) {
	cols, _ := storage.LoadCollections()
	for _, col := range cols {
		if col.ID == id {
			var data []byte
			var err error
			if format == "json" {
				data, err = json.MarshalIndent(col, "", "  ")
			} else {
				data, err = storage.YamlMarshal(col) // I'll add this helper
			}
			return string(data), err
		}
	}
	return "", fmt.Errorf("collection not found")
}

func (a *App) Execute(requestID string, method, url, headers, body, auth string, envID *string) (*service.ResponseResult, error) {
	// 1. Prepare Request Options from direct frontend values (Race-condition safe)
	var activeHeaders map[string]string
	if headers != "" {
		var headerItems []struct {
			Key     string `json:"key"`
			Value   string `json:"value"`
			Enabled bool   `json:"enabled"`
		}
		if err := json.Unmarshal([]byte(headers), &headerItems); err == nil {
			activeHeaders = make(map[string]string)
			for _, h := range headerItems {
				if h.Enabled && h.Key != "" {
					activeHeaders[h.Key] = h.Value
				}
			}
		}
	}

	opts := service.RequestOptions{
		Method:     method,
		URL:        url,
		Headers:    activeHeaders,
		Body:       body,
		AuthConfig: auth,
	}

	// 2. Load Environments
	envVars := make(map[string]string)
	if envID != nil {
		envs, _ := storage.LoadEnvironments()
		for _, e := range envs {
			if e.ID == *envID {
				json.Unmarshal([]byte(e.Variables), &envVars)
				break
			}
		}
	}

	// 3. Execute
	res, err := service.ExecuteRequest(opts, envVars)
	if err == nil {
		// Persist last response in background (Non-blocking)
		var colID string
		var reqName string
		cols, _ := storage.LoadCollections()
		for _, col := range cols {
			for _, r := range col.Requests {
				if r.ID == requestID {
					colID = col.ID
					reqName = r.Name
					break
				}
			}
			if colID != "" {
				break
			}
		}

		go func(rID, cID, name, m, u, h, b, a string, res service.ResponseResult) {
			// Last Response Persistence (UPSERT)
			headersJSON, _ := json.Marshal(res.Headers)
			dbReq := models.Request{
				ID:             rID,
				CollectionID:   cID,
				Name:           name,
				Method:         m,
				URL:            u,
				Headers:        h,
				Body:           b,
				AuthConfig:     a,
				LastResponse:   res.Body,
				LastStatusCode: res.StatusCode,
				LastDuration:   res.Duration,
				LastHeaders:    string(headersJSON),
			}
			database.DB.Clauses(clause.OnConflict{
				UpdateAll: true,
			}).Create(&dbReq)
		}(requestID, colID, reqName, method, url, headers, body, auth, *res)
	}

	return res, err
}

// GetAvailableShells returns the list of available shells on the system
func (a *App) GetAvailableShells() []map[string]string {
	shells := []map[string]string{}

	// Windows specific shells
	if runtime.GOOS == "windows" {
		// PowerShell (always available on modern Windows)
		if path, err := exec.LookPath("powershell.exe"); err == nil {
			shells = append(shells, map[string]string{"id": "pwsh", "name": "PowerShell", "path": path})
		}

		// PowerShell 7+
		if path, err := exec.LookPath("pwsh.exe"); err == nil {
			shells = append(shells, map[string]string{"id": "pwsh7", "name": "PowerShell 7", "path": path})
		}

		// CMD
		if path, err := exec.LookPath("cmd.exe"); err == nil {
			shells = append(shells, map[string]string{"id": "cmd", "name": "Command Prompt", "path": path})
		}

		// Git Bash
		gitBashPaths := []string{
			`C:\Program Files\Git\bin\bash.exe`,
			`C:\Program Files (x86)\Git\bin\bash.exe`,
		}
		for _, p := range gitBashPaths {
			if _, err := os.Stat(p); err == nil {
				shells = append(shells, map[string]string{"id": "gitbash", "name": "Git Bash", "path": p})
				break
			}
		}

		// WSL
		if path, err := exec.LookPath("wsl.exe"); err == nil {
			shells = append(shells, map[string]string{"id": "wsl", "name": "WSL", "path": path})
		}
	} else {
		// Unix-like shells
		unixShells := []struct {
			id   string
			name string
			bin  string
		}{
			{"bash", "Bash", "bash"},
			{"zsh", "Zsh", "zsh"},
			{"sh", "Sh", "sh"},
			{"fish", "Fish", "fish"},
		}

		for _, s := range unixShells {
			if path, err := exec.LookPath(s.bin); err == nil {
				shells = append(shells, map[string]string{"id": s.id, "name": s.name, "path": path})
			}
		}
	}

	return shells
}

// StartTerminalSessionWithShell starts a new isolated terminal session with the given shell.
// Idempotent: if a session with the same ID is already running, this is a no-op.
func (a *App) StartTerminalSessionWithShell(sessionID string, shellPath string, cols int, rows int) error {
	return a.terminalManager.Start(sessionID, shellPath, cols, rows)
}

// SendTerminalDataToSession sends input to a specific terminal session
func (a *App) SendTerminalDataToSession(sessionID string, data string) {
	a.terminalManager.Write(sessionID, data)
}

// CloseTerminalSession terminates a terminal session and cleans up
func (a *App) CloseTerminalSession(sessionID string) error {
	return a.terminalManager.Close(sessionID)
}

// SetTerminalSizeForSession adjusts the pseudo-console's columns and rows.
func (a *App) SetTerminalSizeForSession(sessionID string, cols, rows int) {
	err := a.terminalManager.Resize(sessionID, cols, rows)
	if err != nil {
		fmt.Printf("[%s] Terminal resize error: %v\n", sessionID, err)
	}
}

// --- Legacy compat wrappers (use session "default") ---

func (a *App) StartTerminalSession() error {
	return a.StartTerminalSessionWithShell("default", "powershell.exe", 80, 24)
}

func (a *App) SendTerminalData(data string) {
	a.SendTerminalDataToSession("default", data)
}

func (a *App) SetTerminalSize(cols, rows int) {
	a.SetTerminalSizeForSession("default", cols, rows)
}
