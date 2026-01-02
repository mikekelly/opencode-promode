<overview>
Hooks allow plugins to intercept and modify OpenCode's lifecycle events. This reference covers available hooks, patterns, and best practices.
</overview>

<available_hooks>
## Available Hooks

| Hook | Purpose | Blocking |
|------|---------|----------|
| `event` | Session lifecycle events | No |
| `tool.execute.before` | Modify tool args before execution | Yes |
| `tool.execute.after` | Process results after execution | Yes |
| `chat.message` | Intercept user messages | Yes |
| `experimental.chat.messages.transform` | Transform message history | Yes |
| `experimental.session.compacting` | Inject context into summaries | Yes |
</available_hooks>

<event_hook>
## Event Hook

Handles session lifecycle events:

```typescript
event: async (input) => {
  const { event } = input
  const props = event.properties as Record<string, unknown> | undefined

  switch (event.type) {
    case "session.created":
      const sessionInfo = props?.info as { id?: string; parentID?: string }
      if (!sessionInfo?.parentID) {
        // This is a main session, not a subagent
        setMainSession(sessionInfo?.id)
      }
      break

    case "session.deleted":
      const deletedSession = props?.info as { id?: string }
      // Cleanup resources for this session
      break

    case "session.error":
      const sessionID = props?.sessionID as string | undefined
      const error = props?.error
      // Handle recoverable errors
      if (isRecoverableError(error)) {
        await recoverSession(sessionID)
      }
      break
  }
}
```
</event_hook>

<tool_execute_before>
## tool.execute.before Hook

Modify tool arguments before execution:

```typescript
"tool.execute.before": async (input, output) => {
  // input.tool: Tool name being executed
  // input.sessionID: Session ID
  // output.args: Tool arguments (mutable)

  // Example: Prevent subagents from spawning sub-subagents
  if (input.tool === "task") {
    const args = output.args as Record<string, unknown>
    args.tools = {
      ...args.tools,
      background_task: false,
    }
  }

  // Example: Inject environment variables into bash
  if (input.tool === "bash") {
    const args = output.args as { command?: string }
    args.command = `export MY_VAR=value && ${args.command}`
  }
}
```
</tool_execute_before>

<tool_execute_after>
## tool.execute.after Hook

Process tool results after execution:

```typescript
"tool.execute.after": async (input, output) => {
  // input.tool: Tool name that was executed
  // output.result: Tool result (mutable)

  // Example: Truncate large outputs
  if (typeof output.result === "string" && output.result.length > 10000) {
    output.result = output.result.slice(0, 10000) + "\n[truncated]"
  }

  // Example: Track context usage
  if (input.tool === "read") {
    const chars = output.result?.length ?? 0
    trackContextUsage(chars)
  }

  // Example: Detect empty task responses
  if (input.tool === "task") {
    if (!output.result || output.result.trim() === "") {
      output.result = "[Warning: Agent returned empty response]"
    }
  }
}
```
</tool_execute_after>

<chat_message_hook>
## chat.message Hook

Intercept and modify user messages:

```typescript
"chat.message": async (input, output) => {
  // input.sessionID: Session ID
  // output.parts: Message parts (mutable array)

  const parts = output.parts as Array<{ type: string; text?: string }>
  const text = parts
    .filter(p => p.type === "text" && p.text)
    .map(p => p.text)
    .join("\n")
    .trim()

  // Example: Detect special commands
  if (text.startsWith("/my-command")) {
    // Handle custom command
    await handleMyCommand(text, input.sessionID)
  }

  // Example: Inject context based on keywords
  if (text.includes("auth") && !text.includes("AUTH_CONTEXT_LOADED")) {
    parts.push({
      type: "text",
      text: "\n[System: Loading auth context...]\n" + AUTH_CONTEXT,
    })
  }
}
```
</chat_message_hook>

<compaction_hook>
## experimental.session.compacting Hook

Inject context into summaries during compaction:

```typescript
"experimental.session.compacting": async (input, output) => {
  // output.context: Array of strings to include in summary

  // Preserve important state
  output.context.push("Current task: Implementing auth flow")
  output.context.push("Files modified: src/auth.ts, src/middleware.ts")

  // Preserve methodology reminders
  output.context.push("TDD methodology in effect - tests first")
}
```
</compaction_hook>

<hook_patterns>
## Common Hook Patterns

**Context Window Monitoring:**
```typescript
function createContextWindowMonitor(ctx) {
  let totalChars = 0

  return {
    "tool.execute.after": async (input, output) => {
      if (typeof output.result === "string") {
        totalChars += output.result.length
      }

      // Warn when approaching limits
      if (totalChars > 100000) {
        await ctx.client.session.prompt({
          path: { id: input.sessionID },
          body: { parts: [{ type: "text", text: "[Context usage high]" }] },
          query: { directory: ctx.directory },
        })
      }
    },
  }
}
```

**Session Recovery:**
```typescript
function createSessionRecovery(ctx) {
  const isRecoverableError = (error) =>
    error?.message?.includes("context_length_exceeded")

  return {
    event: async (input) => {
      if (input.event.type === "session.error") {
        const error = input.event.properties?.error
        if (isRecoverableError(error)) {
          // Trigger compaction
          await ctx.client.session.summarize({ /* options */ })
        }
      }
    },
  }
}
```

**Preemptive Compaction:**
```typescript
function createPreemptiveCompaction(ctx, options) {
  return {
    event: async (input) => {
      // Monitor token usage
      const usage = extractTokenUsage(input)
      const limit = options.getModelLimit(usage.model)

      // Compact before hitting limits
      if (usage.tokens > limit * 0.8) {
        await ctx.client.session.summarize({ /* options */ })
      }
    },
  }
}
```
</hook_patterns>

<composing_hooks>
## Composing Multiple Hooks

```typescript
const MyPlugin: Plugin = async (ctx) => {
  // Create individual hook handlers
  const contextMonitor = createContextMonitorHook(ctx)
  const sessionRecovery = createSessionRecoveryHook(ctx)
  const toolTruncator = createToolTruncatorHook(ctx)

  return {
    // Compose event handlers (all run)
    event: async (input) => {
      await contextMonitor?.event(input)
      await sessionRecovery?.event(input)
    },

    // Compose tool hooks (all run in order)
    "tool.execute.before": async (input, output) => {
      await toolTruncator?.["tool.execute.before"]?.(input, output)
    },

    "tool.execute.after": async (input, output) => {
      await toolTruncator?.["tool.execute.after"]?.(input, output)
      await contextMonitor?.["tool.execute.after"]?.(input, output)
    },
  }
}
```
</composing_hooks>

<avoid_infinite_loops>
## Avoiding Infinite Loops

Hooks that trigger actions can cause loops:

```typescript
// DANGEROUS: This could loop forever
"tool.execute.after": async (input, output) => {
  // Sending a prompt triggers more tool calls, which trigger this hook...
  await ctx.client.session.prompt({ /* ... */ })
}

// SAFE: Track state to prevent re-entry
const processing = new Set<string>()

"tool.execute.after": async (input, output) => {
  if (processing.has(input.sessionID)) return
  processing.add(input.sessionID)

  try {
    await ctx.client.session.prompt({ /* ... */ })
  } finally {
    processing.delete(input.sessionID)
  }
}
```
</avoid_infinite_loops>

<checklist>
## Hook Development Checklist

- [ ] Hook handles errors gracefully
- [ ] No infinite loops possible
- [ ] State tracked per-session when needed
- [ ] Async operations don't block unnecessarily
- [ ] Hook can be disabled via config
- [ ] Null check before calling optional hooks
</checklist>
