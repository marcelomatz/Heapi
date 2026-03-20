# Heapi Developer Guide

Welcome to the Heapi developer documentation. This guide provides a starting point for anyone looking to understand, contribute to, or integrate with the Heapi project.

## Project Structure

- **`app.go`**: Core Wails application logic and exposed API.
- **`internal/`**: Backend business logic, database management, and service layers.
- **`frontend/`**: React/TypeScript application.
- **`frontend/src/api/`**: TypeScript wrappers for the Wails backend.
- **`docs/`**: Detailed documentation (that's where you are!).

## Key Documentation

1.  **[Architecture Overview](./architecture_overview.md)**: Understand how the different layers (Go, Wails, React) connect.
2.  **[API Reference](./api_reference.md)**: Explore the list of all functions available to the frontend.
3.  **[Data Models](./data_models.md)**: Learn about the core structures like Collections, Requests, and Environments.
4.  **[Code Examples](./examples.md)**: See common tasks implemented in Go and TypeScript.

## Getting Started

### Prerequisites
- [Go](https://go.dev/dl/) 1.21+
- [Node.js](https://nodejs.org/) 18+
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

### Running in Development
```bash
wails dev
```

### Building for Production
```bash
wails build
```

## Contribution Workflow
1.  **Backend Changes:** Update `app.go` or `internal/`. Wails will automatically update TypeScript bindings on the next `wails dev` or `wails generate`.
2.  **Frontend Changes:** Update React components in `frontend/src/`. Use the typed API wrappers in `frontend/src/api/`.
3.  **API Changes:** If you add a new exposed function in Go, remember to update the corresponding wrapper in `frontend/src/api/` to ensure type safety.
