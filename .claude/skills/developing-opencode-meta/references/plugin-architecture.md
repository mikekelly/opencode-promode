<overview>
OpenCode plugins are TypeScript functions that extend the AI assistant with custom agents, tools, hooks, and configuration. This reference covers plugin structure, entry points, and distribution.
</overview>

<plugin_structure>
## Basic Plugin Structure

```typescript
import type { Plugin } from "@opencode-ai/plugin"

const MyPlugin: Plugin = async (ctx) => {
  // ctx provides:
  // - ctx.client: OpenCode client for session operations
  // - ctx.directory: Current working directory

  return {
    // Custom tools agents can use
    tool: {
      my_tool: myToolDefinition,
    },

    // Agent definitions
    config: {
      agents: {
        "my-agent": myAgentConfig,
      },
    },

    // Lifecycle event handler
    event: async (input) => {
      const { event } = input
      // Handle session.created, session.deleted, session.error, etc.
    },

    // Pre-execution hook
    "tool.execute.before": async (input, output) => {
      // Modify tool arguments before execution
    },

    // Post-execution hook
    "tool.execute.after": async (input, output) => {
      // Process tool results after execution
    },

    // Message interception
    "chat.message": async (input, output) => {
      // Intercept and modify user messages
    },

    // Compaction customization (experimental)
    "experimental.session.compacting": async (input, output) => {
      // Inject context into summary
      output.context.push("Important context to preserve...")
    },
  }
}

export default MyPlugin
```
</plugin_structure>

<critical_export_rule>
## CRITICAL: Export Rules

OpenCode treats ALL exports from index.ts as plugin instances and calls them.

```typescript
// CORRECT: Single default export
export default MyPlugin

// WRONG: Additional exports will be called as plugins!
export default MyPlugin
export function helperFunction() {} // OpenCode will try to call this as a plugin!
export const someConfig = {} // This too!
```

**Solution**: Keep helpers in separate files, only export the plugin from index.ts.

```
src/
├── index.ts         # ONLY default export
├── agents/          # Agent definitions
├── tools/           # Tool definitions
├── hooks/           # Hook implementations
└── shared/          # Internal helpers (NOT exported from index)
```
</critical_export_rule>

<plugin_context>
## Plugin Context (`ctx`)

The context object provides access to OpenCode internals:

```typescript
const MyPlugin: Plugin = async (ctx) => {
  // Current working directory
  const cwd = ctx.directory

  // Session operations
  await ctx.client.session.summarize({ /* options */ })

  // Session prompting (for recovery scenarios)
  await ctx.client.session.prompt({
    path: { id: sessionID },
    body: { parts: [{ type: "text", text: "continue" }] },
    query: { directory: ctx.directory },
  })

  return { /* plugin config */ }
}
```
</plugin_context>

<configuration_loading>
## Plugin Configuration

Plugins can load user configuration from a dedicated JSON file:

```typescript
import { loadPluginConfig } from "./plugin-config"

const MyPlugin: Plugin = async (ctx) => {
  const config = loadPluginConfig(ctx.directory, ctx)

  // Use config to enable/disable features
  const disabledHooks = new Set(config.disabled_hooks ?? [])
  const isHookEnabled = (name: string) => !disabledHooks.has(name)

  return {
    event: isHookEnabled("my-hook")
      ? createMyHook(ctx)
      : null,
  }
}
```

Configuration typically stored at `~/.config/opencode/my-plugin.json`.
</configuration_loading>

<composing_hooks>
## Composing Multiple Hooks

Plugins often combine multiple hook implementations:

```typescript
const MyPlugin: Plugin = async (ctx) => {
  // Create hook instances
  const contextMonitor = createContextMonitorHook(ctx)
  const sessionRecovery = createSessionRecoveryHook(ctx)
  const toolTruncator = createToolTruncatorHook(ctx)

  return {
    // Compose event handlers
    event: async (input) => {
      await contextMonitor?.event(input)
      await sessionRecovery?.event(input)
    },

    // Compose tool hooks
    "tool.execute.after": async (input, output) => {
      await toolTruncator?.["tool.execute.after"](input, output)
      await contextMonitor?.["tool.execute.after"](input, output)
    },
  }
}
```
</composing_hooks>

<distribution>
## Distribution via npm

Plugins are distributed as npm packages with CLI installers:

```typescript
// src/cli/install.ts
#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const OPENCODE_CONFIG = join(homedir(), ".config/opencode/opencode.json")

function install() {
  // Read existing config
  const config = existsSync(OPENCODE_CONFIG)
    ? JSON.parse(readFileSync(OPENCODE_CONFIG, "utf-8"))
    : {}

  // Add plugin
  config.plugins = config.plugins ?? []
  if (!config.plugins.includes("my-opencode-plugin")) {
    config.plugins.push("my-opencode-plugin")
  }

  // Write config
  writeFileSync(OPENCODE_CONFIG, JSON.stringify(config, null, 2))
  console.log("Installed my-opencode-plugin")
}

install()
```

**package.json:**
```json
{
  "name": "my-opencode-plugin",
  "bin": {
    "my-opencode-plugin": "./dist/cli/install.js"
  },
  "exports": {
    ".": "./dist/index.js"
  }
}
```

**Installation:**
```bash
bunx my-opencode-plugin install
```
</distribution>

<claude_code_compatibility>
## Claude Code Compatibility

Plugins can support both OpenCode and Claude Code:

```typescript
// Detect environment
const isClaudeCode = !ctx.client // Claude Code doesn't provide client

// Conditional features
if (!isClaudeCode) {
  // OpenCode-specific features using ctx.client
}

// Load Claude Code configs
import { discoverUserClaudeSkills, discoverProjectClaudeSkills } from "./features/claude-code-skill-loader"

const claudeSkills = [
  ...discoverUserClaudeSkills(),    // ~/.claude/skills/
  ...discoverProjectClaudeSkills(), // .claude/skills/
]
```
</claude_code_compatibility>

<checklist>
## Plugin Development Checklist

Before publishing:
- [ ] Single default export from index.ts
- [ ] No non-plugin exports from index.ts
- [ ] Plugin config file documented
- [ ] CLI installer works (`bunx package-name install`)
- [ ] Hooks don't cause infinite loops
- [ ] Error handling in all hooks
- [ ] TypeScript types exported for consumers
</checklist>
