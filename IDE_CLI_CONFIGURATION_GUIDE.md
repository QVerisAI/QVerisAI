# IDE and CLI Configuration Guide

QVeris has integration in various IDEs and CLI coding tools. They can ease the development of applications using QVeris's APIs and tools by setting up QVeris MCP and skill/rule automatically.

## GUI IDEs

For GUI IDEs, follow the instructions at [https://qveris.ai/plugins](https://qveris.ai/plugins) to install the plugins.

## CLI Coding Tools

For CLI coding tools, follow the instructions at the following corresponding pages.

## Automated Setup with Coding Agents

You can also tell your coding agents to set it up for you. Simply provide them with the configuration guide URL and your API key:

```
Configure this for me <THE_URL_TO_CONFIGURATION_GUIDE>. The API key is <YOUR_API_KEY>
```

Intelligent models like Claude Sonnet 4.5 could finish the setup and resolve the issues automatically.

### Example

For Claude Code:
```
Configure this for me https://github.com/QVerisAI/QVerisAI/blob/main/CLAUDE_CODE_CONFIGURATION_GUIDE.md. The API key is sk-xxxxxxxxxxxxx
```

For OpenCode:
```
Configure this for me https://github.com/QVerisAI/QVerisAI/blob/main/OPENCODE_CONFIGURATION_GUIDE.md. The API key is sk-xxxxxxxxxxxxx
```
