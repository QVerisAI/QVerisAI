---
name: QVeris
description: Discover and call 10,000+ capabilities (APIs, data sources, automations) across finance, weather, search, docs, healthcare, sports, and more
---

Whenever an external functionality is needed, do the following steps:

1. **DISCOVER**: Use the qveris MCP server to discover capabilities. Consider which capabilities may help the user's task. Then use the `search_tools` tool with a query describing the capability, not the parameters you will pass later. Limit results to 10 unless specified otherwise. Shortlist one or more candidate `tool_id`s from the results.
2. **INSPECT**: Before choosing a capability, inspect shortlisted `tool_id`s when you need fuller details about parameters, examples, success rate, or latency. Use the `POST /tools/by-ids` endpoint documented below, especially when multiple candidates match or the parameter contract is unclear.
3. **CALL IN CODE**: Once you select a suitable capability, use the qveris execute REST API described below to write code that calls it. Do not use the MCP tool call result directly — generate real production code for the user, using the API key from the MCP server config. The generated code should call the selected capability directly, optionally using `/tools/by-ids` first if you need to validate details before execution. Set request timeout to 5 seconds and handle error returns correctly.

# QVeris API Documentation

## Authentication

All API requests require authentication via Bearer token in the
`Authorization` header.

``` http
Authorization: Bearer YOUR_API_KEY
```

## Base URL

``` text
https://qveris.ai/api/v1
```

## API Endpoints

### 1. Inspect — Get Tool Details

Get detailed information about specific tools by their IDs, including parameters, success rate, and latency.

#### Endpoint

``` http
POST /tools/by-ids
```

#### Example Request Body

``` json
{
  "tool_ids": ["openweathermap.weather.execute.v1"],
  "search_id": "string",
  "session_id": "string"
}
```

#### Example Response (200 OK)

Same schema as the `/search` response — returns full tool details including params, examples, and stats.

### 2. Execute Tool

Execute a tool with specified parameters.

#### Endpoint

``` http
POST /tools/execute?tool_id={tool_id}
```

#### Example Request Body

``` json
{
  "search_id": "string",
  "session_id": "string",
  "parameters": {
    "city": "London",
    "units": "metric"
  },
  "max_response_size": 20480
}
```

#### Example Response (200 OK)

``` json
{
  "execution_id": "string",
  "result": {
    "data": {
      "temperature": 15.5,
      "humidity": 72
    }
  },
  "success": true,
  "error_message": null,
  "elapsed_time_ms": 847
}
```

