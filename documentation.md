# Qveris Documentation

## What is Qveris

**Qveris** is a **tool search + tool execution** layer for LLM agents. It lets your agent:

- **Search** for live tools (APIs, data sources, automations) using natural language.
- **Execute** any discovered tool by passing the required parameters.

Qveris works well in agent loops (tool discovery → tool execution → feed results back to the model) and supports multiple integration styles.

---

## Quick start

There are three ways to use Qveris.

### Use Qveris MCP anywhere MCP is supported

If your client supports **Model Context Protocol (MCP)**, you can add the official Qveris MCP server and immediately get:

- `search_tools`
- `execute_tool`

**Configure (Cursor / any MCP client)**

```json
{
  "mcpServers": {
    "qveris": {
      "command": "npx",
      "args": ["@qverisai/sdk"],
      "env": {
        "QVERIS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Try it**

> “Find me a weather tool and get the current weather in Tokyo”

The assistant will:

- call `search_tools` with a capability query (e.g. “weather”)
- pick a tool from results
- call `execute_tool` with the tool id + parameters

---

### Use the Qveris Python SDK

Get it from [github](https://github.com/QverisAI/sdk-python) and install:

```bash
pip install qveris
```

Set environment variables:

- `QVERIS_API_KEY` (from [Qveris](https://qveris.ai))
- `OPENAI_API_KEY` (or your OpenAI-compatible provider key)
- `OPENAI_BASE_URL` (optional; for OpenAI-compatible providers)

Minimal streaming example:

```python
import asyncio
from qveris import Agent, Message

async def main():
    agent = Agent()
    messages = [Message(role="user", content="Find a weather tool and check New York weather.")]
    async for event in agent.run(messages):
        if event.type == "content" and event.content:
            print(event.content, end="", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
```

---

### Directly call the Qveris REST API

**Base URL**

`https://qveris.ai/api/v1`

**Authentication**

Send your API key in the `Authorization` header:

```text
Authorization: Bearer YOUR_API_KEY
```

#### 1) Search tools

`POST /search`

**cURL**

```bash
curl -sS -X POST "https://qveris.ai/api/v1/search" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"weather forecast API\",\"limit\":10}"
```

You’ll get a `search_id` and a list of tools (each with `tool_id`, params schema, examples, etc.).

**Python**

```python
import os
import requests

API_KEY = os.environ["QVERIS_API_KEY"]

resp = requests.post(
    "https://qveris.ai/api/v1/search",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    json={"query": "weather forecast API", "limit": 10},
    timeout=30,
)
resp.raise_for_status()
data = resp.json()
print(data["search_id"])
print(data["results"][0]["tool_id"] if data.get("results") else None)
```

**TypeScript**

```typescript
const apiKey = process.env.QVERIS_API_KEY!;

const resp = await fetch("https://qveris.ai/api/v1/search", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: "weather forecast API", limit: 10 }),
});

if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
const data = await resp.json();
console.log(data.search_id);
console.log(data.results?.[0]?.tool_id);
```

#### 2) Execute a tool

`POST /tools/execute?tool_id={tool_id}`

**cURL** (execute the tool returned by search)

```bash
curl -sS -X POST "https://qveris.ai/api/v1/tools/execute?tool_id=openweathermap_current_weather" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"search_id\":\"YOUR_SEARCH_ID\",\"parameters\":{\"city\":\"London\",\"units\":\"metric\"},\"max_response_size\":20480}"
```

If tool output exceeds `max_response_size`, the response includes `truncated_content` plus a temporary `full_content_file_url`.

**Python**

```python
import os
import requests

API_KEY = os.environ["QVERIS_API_KEY"]

tool_id = "openweathermap_current_weather"  # from search results
search_id = "YOUR_SEARCH_ID"  # from /search response

resp = requests.post(
    f"https://qveris.ai/api/v1/tools/execute?tool_id={tool_id}",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "search_id": search_id,
        "parameters": {"city": "London", "units": "metric"},
        "max_response_size": 20480,
    },
    timeout=60,
)
resp.raise_for_status()
print(resp.json())
```

**TypeScript**

```typescript
const apiKey = process.env.QVERIS_API_KEY!;

const toolId = "openweathermap_current_weather"; // from search results
const searchId = "YOUR_SEARCH_ID"; // from /search response

const resp = await fetch(
  `https://qveris.ai/api/v1/tools/execute?tool_id=${encodeURIComponent(toolId)}`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      search_id: searchId,
      parameters: { city: "London", units: "metric" },
      max_response_size: 20480,
    }),
  }
);

if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
const data = await resp.json();
console.log(data);
```

---

### How to get an API key

1. Go to [Qveris](https://qveris.ai)
2. Sign in / create an account
3. Create an API key
4. Use it as:
   - `QVERIS_API_KEY` env var (MCP / Python SDK), or
   - `Authorization: Bearer ...` header (REST API)

---

### Recommended system prompt

Use this (copy/paste) in your assistant’s system prompt when enabling Qveris tools:

```text
You are a helpful assistant that can dynamically search and execute tools to help the user. First think about what kind of tools might be useful to accomplish the user's task. Then use the search_tools tool with query describing the capability of the tool, not what params you want to pass to the tool later. Then call suitable searched tool(s) using the execute_tool tool, passing parameters to the searched tool through params_to_tool. If tool has weighted_success_rate and avg_execution_time (in seconds), consider them when selecting which tool to call. You could reference the examples given if any for each tool. You could call make multiple tool calls in a single response.
```


