# Promode OpenCode Port

Evaluation of porting promode from Claude Code to OpenCode.

## Status

**Phase**: Research & Analysis

## Goals

What we want to achieve with an OpenCode port:

### 1. Custom Main Agent
Restrict the main agent to only use promode subagents (and core subagents we want to keep). In Claude Code, subagents don't inherit CLAUDE.md — OpenCode allows defining agents with full prompt control.

### 2. Context-Aware Self-Compaction
From IDEAS.md: Agents should be aware of their context usage and able to:
- See % context usage as a visible metric
- Trigger compaction themselves when appropriate
- First externalize important info to markdown files, then compact aggressively
- Subagents can independently manage their own context

### 3. Subagents Spawning Subagents
Enable hierarchical delegation where subagents can spawn their own subagents for further decomposition of work.

### 4. Async/Interruptible Subagents
Main agent can monitor subagent progress and interrupt/resume them as needed.

### 5. E2E Testing via CLI
Use OpenCode's CLI to run test prompts proving the promode configuration works as expected.

### 6. Fork vs Extend Decision
OpenCode is open source. Prefer plugins for extensibility, but fork if needed for deeper changes.

## Technical Feasibility

Based on OpenCode docs and oh-my-opencode analysis:

| Goal | Feasibility | Approach |
|------|-------------|----------|
| Custom main agent | ✅ Supported | Plugin `config` hook provides agents |
| Context visibility | ✅ Supported | Custom tool + `tool.execute.after` hook (see below) |
| Self-compaction | ✅ Supported | Plugin can expose `ctx.client.session.summarize()` as a tool |
| Subagent spawning | ✅ Supported | Set `background_task: true` in agent config (see below) |
| Async subagents | ✅ Supported | `background_task` + `background_output` tools |
| E2E testing | ✅ Supported | `opencode run` command exists |
| Plugin vs fork | ✅ Plugin first | 30+ hooks, custom tools, agents all via plugins |

### Context Usage Visibility

**Status**: ✅ **Feasible** — via hooks + custom tool (2026-01-02)

**How token info is available in OpenCode:**

1. **Message events include token metadata**: The `message.updated` event provides `info.tokens` with:
   ```typescript
   tokens: {
     input: number      // Input tokens consumed
     output: number     // Output tokens generated
     reasoning: number  // Reasoning tokens (if applicable)
     cache: { read: number; write: number }  // Cache hits/writes
   }
   ```

2. **Session messages API**: `ctx.client.session.messages({ path: { id: sessionID } })` returns all messages with their token info attached to assistant messages.

3. **No direct "get current usage" API**: OpenCode doesn't expose a simple `getContextUsage()` method. You must track token counts from message events or query session messages.

**How oh-my-opencode exposes context to agents:**

1. **`context-window-monitor` hook**: Appends context status to tool output via `tool.execute.after`:
   ```
   [Context Status: 14.0% used (140,000/1,000,000 tokens), 86.0% remaining]
   ```

2. **System reminder injection**: When usage exceeds 70%, injects a reminder telling the agent it has plenty of context remaining.

3. **`preemptive-compaction` hook**: Monitors `message.updated` events and triggers `ctx.client.session.summarize()` at 85% usage.

**Approaches for promode:**

| Approach | Pros | Cons |
|----------|------|------|
| **Hook injection** (like oh-my-opencode) | Automatic, no agent action needed | Agent can't query on-demand |
| **Custom tool** (`get_context_usage`) | Agent can check when needed | Adds tool call overhead |
| **System prompt injection** | Always visible | Stale by the time agent reads it |
| **Combination** | Best of both | More complexity |

**Recommended implementation:**

```typescript
// 1. Custom tool for on-demand queries
const getContextUsage: ToolDefinition = {
  description: "Get current context window usage percentage and token counts",
  parameters: z.object({}),
  async execute(args, toolCtx) {
    const messages = await ctx.client.session.messages({
      path: { id: toolCtx.sessionID }
    })
    const lastAssistant = messages
      .filter(m => m.info.role === "assistant")
      .pop()

    if (!lastAssistant?.info.tokens) {
      return { error: "No token info available yet" }
    }

    const tokens = lastAssistant.info.tokens
    const used = tokens.input + tokens.cache.read
    const limit = 200_000  // Claude default
    const percentage = (used / limit * 100).toFixed(1)

    return {
      used_tokens: used,
      limit_tokens: limit,
      percentage: `${percentage}%`,
      remaining_tokens: limit - used
    }
  }
}

// 2. Hook for automatic warnings (like oh-my-opencode)
const contextMonitor = {
  "tool.execute.after": async (input, output) => {
    // Append usage info when above threshold
  }
}
```

**Key insight**: Token information flows through **message events**, not a dedicated API. Track it yourself or query session messages.

### Self-Compaction Implementation

OpenCode exposes `ctx.client.session.summarize()` to plugins. A custom tool could wrap this:

```typescript
// Proposed: self_compact tool
const selfCompactTool = {
  description: "Trigger context compaction after externalizing important info to files",
  parameters: z.object({
    confirm_externalized: z.boolean().describe("Confirm important context has been saved to files"),
  }),
  async execute(params, ctx) {
    if (!params.confirm_externalized) {
      return { error: "Must externalize important context to files before compacting" }
    }
    await ctx.client.session.summarize({ ... })
    return { success: true }
  }
}
```

The `experimental.session.compacting` hook can inject promode-specific context into the summary.

### Subagent Spawning Subagents

**Status**: ❌ **Not supported** — by plugin design choice, not OpenCode limitation.

**Test Results** (2026-01-02):

We tested this using OpenCode v1.0.208 with oh-my-opencode plugin. Key findings:

1. **Main agent tools include**: `background_task`, `background_output`, `background_cancel`, `call_omo_agent`, `task`
2. **Subagent tools explicitly exclude**: `background_task: false`, `write: false`, `edit: false` (from oh-my-opencode's `explore.ts`)
3. **Verification**: Running `opencode run --agent explore` shows "explore is a subagent, not a primary agent" and falls back to main

**How oh-my-opencode restricts subagents**:

```typescript
// From src/agents/explore.ts
export const exploreAgent: AgentConfig = {
  mode: "subagent",
  tools: {
    write: false,      // Cannot create files
    edit: false,       // Cannot modify files
    background_task: false,  // Cannot spawn other agents
  },
  // ...
}
```

**Conclusion**: OpenCode's plugin architecture **can** enable subagent spawning by setting `background_task: true` in agent configs. The limitation is oh-my-opencode's design choice, not an OpenCode restriction.

**Options for promode**:
1. ✅ **Enable it**: Set `background_task: true` for promode-subagent to allow nested delegation
2. ⚠️ **Keep single-level**: Match oh-my-opencode's approach for context conservation
3. 🔧 **Conditional**: Enable only for specific "coordinator" subagents

**Recommendation**: Start with single-level (like oh-my-opencode) to prevent runaway context usage. Add nested spawning later if needed for specific workflows.

## Key Reference: oh-my-opencode

[oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) is a mature OpenCode plugin demonstrating:

- **7 custom agents** with full prompt control
- **22 lifecycle hooks** including context management
- **Claude Code compatibility layer** (dual-platform support)
- **npm distribution** with CLI installer

### What We Can Reuse

| oh-my-opencode Feature | Promode Use |
|---|---|
| Agent definition pattern | Template for promode-subagent |
| Plugin architecture | Entry point structure |
| Claude Code compat layer | Maintain backwards compatibility |
| CLI installer | Distribution model |
| `preemptive-compaction` hook | Inspiration for self-compaction |
| `compaction-context-injector` | Template for context preservation |

### What We Need Beyond oh-my-opencode

| Promode Need | oh-my-opencode Gap |
|---|---|
| Agent-initiated compaction | Only external (plugin-triggered) |
| Subagent spawning subagents | Explicitly disabled |
| TDD enforcement hooks | Not implemented |
| Promode methodology | Not their focus |

## Analysis Findings

### Agent Configuration Pattern

```typescript
import type { AgentConfig } from "@opencode-ai/sdk"

export function createPromodeSubagent(): AgentConfig {
  return {
    description: "General-purpose subagent following promode conventions...",
    mode: "subagent",
    model: "anthropic/claude-sonnet-4",
    temperature: 0.1,
    tools: { write: true, edit: true, bash: true },
    prompt: `<critical-instruction>...</critical-instruction>...`,  // Full promode prompt
  }
}
```

### Plugin Architecture

```typescript
import type { Plugin } from "@opencode-ai/plugin"

const PromodePlugin: Plugin = async (ctx) => {
  return {
    // Custom tools
    tool: { self_compact: selfCompactTool },

    // Agent definitions
    config: { agents: { "promode-subagent": promodeSubagent } },

    // Lifecycle hooks
    event: async (input) => { /* context monitoring */ },
    "tool.execute.before": async (input, output) => { /* TDD enforcement */ },

    // Compaction customization
    "experimental.session.compacting": async (input, output) => {
      output.context.push("Preserve: promode methodology, current task state...")
    },
  }
}
```

### Distribution

```bash
bunx promode-opencode install
```

Registers plugin in `~/.config/opencode/opencode.json`, writes config to `~/.config/opencode/promode.json`.

## Proposed Structure

```
promode-opencode/
├── src/
│   ├── agents/
│   │   ├── promode-subagent.ts    # Port of current subagent prompt
│   │   └── index.ts
│   ├── tools/
│   │   ├── self-compact.ts        # Agent-initiated compaction
│   │   └── index.ts
│   ├── hooks/
│   │   ├── tdd-enforcer/          # Ensure tests before implementation
│   │   ├── context-monitor/       # Expose context usage to agents
│   │   └── index.ts
│   ├── features/
│   │   └── claude-code-compat/    # Backwards compatibility
│   ├── cli/
│   │   └── install.ts
│   └── index.ts                   # Plugin entry point
├── skills/                        # Port existing skills 1:1
│   ├── managing-claude-code-meta/
│   └── managing-skills/
├── tests/
│   └── e2e/                       # CLI-driven test suite
├── package.json
└── tsconfig.json
```

## Open Questions

1. ~~**Subagent spawning**: Does OpenCode allow it? Need to test.~~ ✅ **Answered**: Yes, OpenCode allows it. oh-my-opencode disables it by choice via `background_task: false`.
2. ~~**Context usage visibility**: How to expose token counts to agents?~~ ✅ **Answered**: Custom tool + hook injection (see "Context Usage Visibility" section above).
3. **Fork threshold**: What would require forking OpenCode vs plugin extension?

## Next Steps

See `TODO.md` for tracked work items.

## References

- oh-my-opencode repo: `tmp/oh-my-opencode/` (gitignored)
- OpenCode docs: https://opencode.ai/docs/
- IDEAS.md: Context-aware self-compaction vision
