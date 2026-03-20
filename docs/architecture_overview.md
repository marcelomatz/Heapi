# Heapi Architecture Overview

Heapi is a high-performance API client built with **Go** (Backend) and **React/TypeScript** (Frontend), using **Wails** as the bridge.

## Layered Design

### 1. Presentation Layer (Frontend)
- **Framework:** React + Vite.
- **Logic:** Custom hooks (`useCollections`, `useEnvironments`) manage state.
- **API Layer:** `src/api/` provides a typed interface to the backend, abstracting Wails-specific logic and adding error telemetry.
- **UI:** Shadcn/UI (Radix Primitives + Tailwind CSS) for a premium, high-density experience.

### 2. Bridge Layer (Wails)
- Automatically generates TypeScript bindings for Go structs and methods.
- Handles IPC (Inter-Process Communication) and Window management.

### 3. Service Layer (Backend Go)
- **App (`app.go`):** The main entry point for frontend calls.
- **Terminal Manager:** Handles PTY (Pseudo-Terminal) lifecycle and I/O streaming.
- **Execute Service:** Manages HTTP client instances, cookie jars, and variable substitution.

### 4. Persistence Layer
- **YAML Storage:** Collections and Environments are stored as human-readable YAML files, making them git-friendly.
- **SQLite (GORM):** Used for high-frequency data:
    - Execution History.
    - Cached Response metadata (Last body, headers, duration).
    - Terminal session states.

## Data Flow: Request Execution
1. UI triggers `execute(id)`.
2. Frontend API layer validates inputs and calls Wails binding.
3. Backend Service loads active Environment variables.
4. Substitution engine replaces `{{temp}}` placeholders.
5. `net/http` executes the request.
6. Results are returned to the UI **and** asynchronously persisted to SQLite for history.
