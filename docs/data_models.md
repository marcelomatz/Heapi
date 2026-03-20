# Heapi Data Models

Documentation of the primary data structures used in Heapi.

## Collection
Groups multiple requests together. Persisted as individual `.yaml` files in the `collections/` directory.

| Field | Type | Description |
| :--- | :--- | :--- |
| `ID` | `string` | Unique UUID. |
| `name` | `string` | Display name. |
| `description`| `string` | Optional description. |
| `requests` | `Request[]`| List of requests in this collection. |

## Request
Represents a single HTTP call. Configuration is stored in YAML, while response metadata is persisted in the SQLite database (`heapi.db`) for performance.

| Field | Type | Description |
| :--- | :--- | :--- |
| `ID` | `string` | Unique UUID. |
| `name` | `string` | Display name. |
| `method` | `string` | HTTP Method (GET, POST, etc.). |
| `url` | `string` | Target URL (supports `{{var}}` syntax). |
| `headers` | `string` | JSON string of key-value pairs. |
| `body` | `string` | Request body content. |
| `last_response`| `string` | Body of the last successful execution. |
| `last_status` | `number` | HTTP status code of the last execution. |

## Environment
Stores variables for substitution in request URLs, headers, and bodies.

| Field | Type | Description |
| :--- | :--- | :--- |
| `ID` | `string` | Unique UUID. |
| `name` | `string` | Environment name (e.g., "Production"). |
| `variables` | `string` | JSON string of variable mappings. |
