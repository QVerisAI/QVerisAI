# Configuration Guide for Claude Code

This guide explains how to configure Skills and MCP servers in Claude Code for both Mac and Windows, covering both user-level and project-level configurations.

## Prerequisites

- Node.js installed (for running MCP servers)
- Claude Code installed
- QVeris API key (get one from [https://qveris.ai](https://qveris.ai))

## Configuration Levels

1. **User-level**: Applies to all projects for the current user
2. **Project-level**: Applies only to a specific project

## 1. User-Level Configuration

### 1.1 User-Level MCP Configuration

Use Claude CLI to configure MCP servers at the user level. The recommended approach is using the CLI command.

**For QVeris (stdio server with npx):**

**Mac:**
```bash
claude mcp add qveris --transport stdio --scope user --env QVERIS_API_KEY=your-api-key-here -- npx -y @qverisai/mcp
```

**Windows (Command Prompt):**
```cmd
claude mcp add qveris --transport stdio --scope user --env QVERIS_API_KEY=your-api-key-here -- cmd /c npx -y @qverisai/mcp
```

**Important Notes:**
- All options (`--transport`, `--env`, `--scope`) must come **before** the server name
- The `--` (double dash) separates the server name from the command and arguments
- On Windows, stdio servers using `npx` require the `cmd /c` wrapper to ensure proper execution
- Replace `your-api-key-here` with your actual QVeris API key

**Managing MCP Servers:**

```bash
# List all configured servers
claude mcp list

# Get details for a specific server
claude mcp get qveris

# Remove a server
claude mcp remove qveris
```

**User-Level Config File Location:**

User-level MCP configuration is stored in:
- **Mac:** `~/.claude.json`
- **Windows:** `%USERPROFILE%\.claude.json`

You can manually edit this file if needed, but using the CLI is recommended.

### 1.2 User-Level Skills Configuration

User-level skills are stored in your home directory and are available to all projects.

**Location:**

**Mac:**
```
~/.claude/skills/
```

**Windows:**
```
%USERPROFILE%\.claude\skills\
```

**Setup Steps:**

1. **Copy the skills directory from this repository**:
   
   Navigate to where you cloned or downloaded this repository, then run the command below. This will create the destination directory (if needed) and copy the files.
   
   **Mac:**
   ```bash
   mkdir -p ~/.claude/skills && cp -R /path/to/QVerisAI/skills/* ~/.claude/skills/
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   xcopy /E /I /Y "C:\path\to\QVerisAI\skills\*" "%USERPROFILE%\.claude\skills\"
   ```
   
   Replace `/path/to/QVerisAI` (Mac) or `C:\path\to\QVerisAI` (Windows) with the actual path to this repository.

2. **Verify the structure**:
   
   Your skills directory should look like:
   ```
   ~/.claude/skills/
   └── qveris/
       └── SKILL.md
   ```

## 2. Project-Level Configuration

### 2.1 Project-Level MCP Configuration

Create a `.mcp.json` file (note the leading dot) in your project root directory.

**Location:**
```
<project-root>/.mcp.json
```

**Example project structure:**
```
my-project/
├── .mcp.json
├── src/
└── ...
```

**Configuration:**

Create or edit `.mcp.json` in your project root with the following content:

```json
{
  "mcpServers": {
    "qveris": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@qverisai/mcp"],
      "env": {
        "QVERIS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**For Windows, use the `cmd /c` wrapper:**

```json
{
  "mcpServers": {
    "qveris": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@qverisai/mcp"],
      "env": {
        "QVERIS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Environment Variable Expansion:**

You can use environment variable expansion in `.mcp.json`:

```json
{
  "mcpServers": {
    "qveris": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@qverisai/mcp"],
      "env": {
        "QVERIS_API_KEY": "${QVERIS_API_KEY}"
      }
    }
  }
}
```

Supported syntax:
- `${VAR}`: Expands to the value of the environment variable `VAR`
- `${VAR:-default}`: Expands to `VAR` if defined; otherwise, uses `default`

**Important:**
- Project-level MCP configuration (`.mcp.json`) takes precedence over user-level configuration
- Replace `"your-api-key-here"` with your actual QVeris API key
- You can use environment variables or a `.env` file for sensitive keys
- Restart Claude Code after making changes
- For security, Claude Code requires approval before using project-level MCP servers

### 2.2 Project-Level Skills Configuration

Project-level skills are stored in a `.claude/skills/` directory (note the leading dot) within your project.

**Location:**
```
<project-root>/.claude/skills/
```

**Example project structure:**
```
my-project/
├── .claude/
│   └── skills/
│       └── qveris/
│           └── SKILL.md
├── src/
└── ...
```

**Setup Steps:**

1. **Copy the skills directory from this repository**:
   
   Navigate to your project root, then run the command below. This will create the destination directory (if needed) and copy the files.
   
   **Mac:**
   ```bash
   mkdir -p .claude/skills && cp -R /path/to/QVerisAI/skills/* .claude/skills/
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   xcopy /E /I /Y "C:\path\to\QVerisAI\skills\*" ".claude\skills\"
   ```
   
   Replace `/path/to/QVerisAI` (Mac) or `C:\path\to\QVerisAI` (Windows) with the actual path to this repository.

2. **Verify the structure**:
   
   Your project skills directory should look like:
   ```
   .claude/skills/
   └── qveris/
       └── SKILL.md
   ```

**Note**: Project-level skills are typically checked into version control to share with your team.

## 5. Verification

After configuration, restart Claude Code. You can verify the setup by:

1. **Check MCP servers**: Use `/mcp` command in Claude Code to see connected servers
2. **List servers via CLI**: Run `claude mcp list` to see all configured servers
3. **Test tool discovery**: Ask Claude to search for tools using QVeris in a chat session
4. **Verify skills**: Check that skills are being applied in responses

## 6. Start Using

Once you've configured, you can use it in Claude Code by referencing it with `@.claude\skills\qveris\` (Windows) or `@.claude/skills/qveris/` (Mac/Linux).

**Example:**

> Write a python script that prints the current bitcoin price using @.claude/skills/qveris/

**Result:**

```bash
$ python bitcoin_price.py
Fetching current Bitcoin price...

💰 Current Bitcoin Price: $89,901.00 USD
```

## 7. Troubleshooting

### MCP Server Not Connecting

**Check Node.js installation:**
```bash
node --version
npm --version
```

**Test MCP server manually:**
```bash
npx -y @qverisai/mcp
```

**Verify API key:**
- Ensure your API key is correctly set in the configuration
- Check that there are no extra quotes or spaces around the key
- Verify the configuration file location (user-level vs project-level)

**Windows-specific issues:**
- Ensure you're using `cmd /c` wrapper for stdio servers with `npx` on Windows
- Check that the command path is correct

**Check server status:**
- Use `/mcp` command in Claude Code to see server connection status
- Use `claude mcp get <server-name>` to see detailed configuration

### Path Issues on Windows

If you encounter path issues:
- Use forward slashes `/` or escaped backslashes `\\` in JSON
- Avoid spaces in directory names if possible

- Use quotes around paths with spaces in command line
