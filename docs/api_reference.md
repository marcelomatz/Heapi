# Heapi API Reference

Heapi uses a layered API architecture. The backend is built with Go and Wails, while the frontend provides typed TypeScript wrappers for ease of use.

## API Layers

1.  **Backend (Go):** Functions defined in `App` struct (`app.go`), exposed via Wails.
2.  **Frontend (TypeScript):** Located in `src/api/`, providing async wrappers with error handling and proper typing.

---

## Collections API

### `getCollections`
Retrieves all collections and their requests.
- **Frontend:** `getCollections(): Promise<Collection[]>`
- **Backend:** `GetCollections() ([]models.Collection, error)`
- **Description:** Loads collections from YAML storage and enriches requests with last response metadata from the database.

### `createCollection`
Creates a new collection.
- **Frontend:** `createCollection(name: string): Promise<Collection | null>`
- **Backend:** `CreateCollection(name string) (models.Collection, error)`

### `deleteCollection`
Deletes a collection and its requests.
- **Frontend:** `deleteCollection(id: string): Promise<boolean>`
- **Backend:** `DeleteCollection(id string) error`

### `renameCollection`
Renames an existing collection.
- **Frontend:** `renameCollection(id: string, name: string): Promise<boolean>`
- **Backend:** `RenameCollection(id string, name string) error`

---

## Requests API

### `execute`
Executes an HTTP request.
- **Frontend:** `execute(requestID: string, method, url, headers, body, auth: string, envID: string | null): Promise<ResponseResult | null>`
- **Backend:** `Execute(requestID string, method, url, headers, body, auth string, envID *string) (*service.ResponseResult, error)`
- **Description:** Performs the actual HTTP call, performs variable substitution from the environment, and persists results/history.

### `createRequest`
Adds a new request to a collection.
- **Frontend:** `createRequest(colId, name, method, url): Promise<Request | null>`
- **Backend:** `CreateRequest(colID string, name, method, url string) (models.Request, error)`

### `updateRequest`
Updates request details and persists response metadata.
- **Frontend:** `updateRequest(id, name, method, url, headers, body, auth, lastRes, lastStatus, lastDur, lastHeaders): Promise<boolean>`
- **Backend:** `UpdateRequest(id string, name, method, url, headers, body, auth string, lastRes string, lastStatus int, lastDur int64, lastHeaders string) error`

---

## Environments API

### `getEnvironments`
Lists all available environments.
- **Frontend:** `getEnvironments(): Promise<Environment[]>`
- **Backend:** `GetEnvironments() ([]models.Environment, error)`

### `updateEnvironment`
Updates an environment's variables (JSON).
- **Frontend:** `updateEnvironment(id, name, variables): Promise<boolean>`
- **Backend:** `UpdateEnvironment(id, name, variables string) error`

---

## Terminal API (Wails Events)

The terminal uses a specialized `TerminalManager` and provides streaming data via Wails events.

### `getAvailableShells`
Returns detected shells on the host system (PowerShell, CMD, Git Bash, WSL).
- **Backend:** `GetAvailableShells() []map[string]string`

### `startTerminalSession`
Starts a PTY session for a specific shell.
- **Backend:** `StartTerminalSessionWithShell(sessionID, shellPath string, cols, rows int) error`

### Events
- `terminal:data:{sessionID}`: Emitted from backend when the PTY has new output.
- `terminal:exit:{sessionID}`: Emitted when the shell process terminates.
