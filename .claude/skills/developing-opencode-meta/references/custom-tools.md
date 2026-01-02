<overview>
Custom tools extend agent capabilities in OpenCode. This reference covers tool definition with Zod schemas, execution patterns, and best practices.
</overview>

<tool_structure>
## Tool Structure

```typescript
import { z } from "zod"

const myTool = {
  // Description shown to agents (affects when they use the tool)
  description: "What this tool does and when to use it",

  // Parameter schema using Zod
  parameters: z.object({
    required_param: z.string().describe("What this parameter is for"),
    optional_param: z.boolean().optional().describe("Optional flag"),
  }),

  // Execution function
  async execute(params, ctx) {
    // params: Validated parameters
    // ctx: Plugin context

    // Tool logic here
    return { result: "output" }
  },
}
```
</tool_structure>

<zod_schemas>
## Zod Schema Patterns

**Basic types:**
```typescript
z.string()                          // String
z.number()                          // Number
z.boolean()                         // Boolean
z.array(z.string())                 // Array of strings
z.object({ key: z.string() })       // Object with typed keys
```

**With descriptions (critical for agent understanding):**
```typescript
z.object({
  path: z.string().describe("Absolute file path to read"),
  lines: z.number().optional().describe("Max lines to return"),
  format: z.enum(["json", "text"]).describe("Output format"),
})
```

**Complex schemas:**
```typescript
z.object({
  files: z.array(z.object({
    path: z.string().describe("File path"),
    content: z.string().describe("File content"),
  })).describe("Files to create"),

  options: z.object({
    overwrite: z.boolean().default(false).describe("Overwrite existing"),
    backup: z.boolean().default(true).describe("Create backup first"),
  }).optional().describe("Creation options"),
})
```
</zod_schemas>

<tool_examples>
## Example Tools

**File search tool:**
```typescript
const searchFiles = {
  description: "Search for files matching a pattern. Use for finding files by name or extension.",
  parameters: z.object({
    pattern: z.string().describe("Glob pattern (e.g., '**/*.ts')"),
    cwd: z.string().optional().describe("Directory to search in"),
  }),
  async execute(params, ctx) {
    const { pattern, cwd = ctx.directory } = params
    const files = await glob(pattern, { cwd })
    return { files, count: files.length }
  },
}
```

**Context compaction tool:**
```typescript
const selfCompact = {
  description: "Trigger context compaction. Use when context is getting large. MUST externalize important info to files first.",
  parameters: z.object({
    confirm_externalized: z.boolean().describe("Confirm important context has been saved to files"),
  }),
  async execute(params, ctx) {
    if (!params.confirm_externalized) {
      return { error: "Must externalize important context before compacting" }
    }
    await ctx.client.session.summarize({ /* options */ })
    return { success: true, message: "Context compacted" }
  },
}
```

**Background agent tool:**
```typescript
const callAgent = {
  description: "Spawn a background agent for specialized work. Returns task_id for later retrieval.",
  parameters: z.object({
    agent: z.enum(["explore", "librarian", "frontend"]).describe("Agent to spawn"),
    prompt: z.string().describe("Task for the agent"),
  }),
  async execute(params, ctx) {
    const taskId = await backgroundManager.spawn(params.agent, params.prompt)
    return { task_id: taskId, message: `Started ${params.agent} agent` }
  },
}
```

**Image analysis tool:**
```typescript
const lookAt = {
  description: "Analyze an image using vision. Use for screenshots, diagrams, or visual content.",
  parameters: z.object({
    path: z.string().describe("Path to image file"),
    question: z.string().optional().describe("Specific question about the image"),
  }),
  async execute(params, ctx) {
    const image = await readFile(params.path)
    const analysis = await analyzeImage(image, params.question)
    return { analysis }
  },
}
```
</tool_examples>

<error_handling>
## Error Handling

Return structured errors agents can understand:

```typescript
async execute(params, ctx) {
  try {
    const result = await riskyOperation(params)
    return { success: true, result }
  } catch (error) {
    // Structured error response
    return {
      success: false,
      error: error.message,
      suggestion: "Try using a different approach",
    }
  }
}
```

**Validation in execute:**
```typescript
async execute(params, ctx) {
  // Additional validation beyond Zod
  if (!existsSync(params.path)) {
    return { error: `File not found: ${params.path}` }
  }

  // Proceed with valid input
  return { result: await readFile(params.path) }
}
```
</error_handling>

<tool_context>
## Tool Context

The `ctx` parameter provides access to plugin capabilities:

```typescript
async execute(params, ctx) {
  // Current directory
  const cwd = ctx.directory

  // Session operations
  await ctx.client.session.summarize({ /* options */ })

  // Access to other plugin state (if you pass it in)
  const state = ctx.pluginState

  return { /* result */ }
}
```
</tool_context>

<registering_tools>
## Registering Tools

Tools are registered in the plugin return object:

```typescript
const MyPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      // Tool names should be snake_case
      search_files: searchFiles,
      self_compact: selfCompact,
      call_agent: callAgent,
      look_at: lookAt,

      // Tools can share state via closure
      get_status: createStatusTool(sharedState),
    },
  }
}
```
</registering_tools>

<tool_access_control>
## Tool Access Control

Control which agents can use tools:

```typescript
// In agent definition
const myAgent: AgentConfig = {
  tools: {
    search_files: true,      // Can use
    self_compact: false,     // Cannot use
    call_agent: true,
  },
}

// In tool.execute.before hook
"tool.execute.before": async (input, output) => {
  // Conditionally block tool usage
  if (input.tool === "self_compact" && !isMainSession(input.sessionID)) {
    output.args = { error: "Only main agent can compact" }
  }
}
```
</tool_access_control>

<best_practices>
## Best Practices

**1. Clear descriptions:**
```typescript
// GOOD: Explains when to use
description: "Search codebase for patterns. Use when looking for implementations, not for known file locations."

// BAD: Too vague
description: "Search files"
```

**2. Descriptive parameter names:**
```typescript
// GOOD: Self-documenting
z.object({
  glob_pattern: z.string().describe("Glob pattern like '**/*.ts'"),
  max_results: z.number().optional().describe("Limit results (default: 100)"),
})

// BAD: Unclear
z.object({
  p: z.string(),
  n: z.number().optional(),
})
```

**3. Return structured data:**
```typescript
// GOOD: Structured for programmatic use
return {
  files: ["a.ts", "b.ts"],
  count: 2,
  truncated: false,
}

// BAD: Unstructured string
return "Found 2 files: a.ts, b.ts"
```

**4. Idempotent when possible:**
```typescript
// GOOD: Safe to retry
async execute(params, ctx) {
  if (existsSync(params.path)) {
    return { exists: true, message: "Already exists" }
  }
  await writeFile(params.path, params.content)
  return { created: true }
}
```
</best_practices>

<checklist>
## Tool Development Checklist

- [ ] Clear description explaining when to use
- [ ] All parameters have `.describe()` calls
- [ ] Error cases return structured errors
- [ ] Tool is idempotent if possible
- [ ] Tool name is snake_case
- [ ] Large outputs are truncated
- [ ] No side effects beyond stated purpose
</checklist>
