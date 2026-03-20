# Heapi Code Examples

Practical examples of how to interact with the Heapi API.

## 1. Executing a Request

### TypeScript (Frontend)
Use the `execute` function from the API layer.

```typescript
import { execute } from '@/api/requests';

const runRequest = async () => {
  const result = await execute(
    "req-uuid-123",
    "GET",
    "https://jsonplaceholder.typicode.com/posts/1",
    "[]", // Headers as JSON string
    "",   // Body
    "{}", // Auth as JSON string
    null  // No active environment
  );

  if (result) {
    console.log(`Status: ${result.status_code}`);
    console.log(`Body: ${result.body}`);
  }
};
```

### Go (Backend Internal)
Internal call within the `App` struct.

```go
res, err := a.Execute(
    "req-uuid-123",
    "POST",
    "https://api.example.com/data",
    `[{"key":"Content-Type","value":"application/json","enabled":true}]`,
    `{"name":"Heapi"}`,
    "{}",
    nil,
)
```

---

## 2. Managing Environments

### Create and Update
```typescript
import { createEnvironment, updateEnvironment } from '@/api/environments';

const setupEnv = async () => {
  const newEnv = await createEnvironment("Staging");
  if (newEnv) {
    await updateEnvironment(
      newEnv.ID,
      "Staging",
      JSON.stringify({ baseUrl: "https://staging.example.com" })
    );
  }
};
```

---

## 3. Importing Data

### From cURL
```typescript
import { importFromCurl } from '@/api/collections';

const handlePaste = async (curlCommand: string) => {
  const newRequest = await importFromCurl(curlCommand);
  if (newRequest) {
    console.log(`Imported: ${newRequest.name}`);
  }
};
```

---

## 4. Terminal Integration

### Start a Session
```typescript
import { startTerminalSessionWithShell } from '@/api/terminal';

const openShell = async () => {
  await startTerminalSessionWithShell(
    "my-session-id",
    "powershell.exe",
    120, // Cols
    30   // Rows
  );
};
```
