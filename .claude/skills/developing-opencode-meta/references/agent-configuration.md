<overview>
Agents are configured AI assistants in OpenCode. Each agent has a prompt, model, tool access, and mode. This reference covers agent definition patterns and prompt design.
</overview>

<agent_config_type>
## AgentConfig Type

```typescript
import type { AgentConfig } from "@opencode-ai/sdk"

const myAgent: AgentConfig = {
  // Required
  description: "Shown in delegation UI and tool descriptions",
  mode: "subagent",  // "primary" or "subagent"
  model: "anthropic/claude-sonnet-4",
  prompt: "Full agent system prompt...",

  // Optional
  temperature: 0.1,
  maxTokens: 64000,
  color: "#00CED1",  // UI color for this agent
  tools: {
    write: true,
    edit: true,
    bash: true,
    background_task: false,
  },

  // Model-specific options
  thinking: { type: "enabled", budgetTokens: 32000 },  // Claude
  reasoningEffort: "medium",  // GPT
}
```
</agent_config_type>

<agent_modes>
## Agent Modes

| Mode | Purpose | When to Use |
|------|---------|-------------|
| `primary` | Main conversation agent | Replacing the default main agent |
| `subagent` | Delegated task executor | Specialized agents for specific domains |

**Primary agents:**
- Handle the main conversation with the user
- Can delegate to subagents
- Have full tool access by default

**Subagents:**
- Spawned by primary agent or other subagents
- Focused on specific tasks
- Often have restricted tool access
</agent_modes>

<tool_access>
## Tool Access Control

Control which tools an agent can use:

```typescript
tools: {
  // File operations
  write: true,          // Create new files
  edit: true,           // Modify existing files
  read: true,           // Read files (usually always true)

  // Execution
  bash: true,           // Run shell commands
  background_task: false, // Spawn subagents (CAREFUL!)

  // Custom tools
  my_custom_tool: true,
}
```

**Preventing runaway delegation:**
```typescript
// In tool.execute.before hook
if (input.tool === "task") {
  const args = output.args as Record<string, unknown>
  args.tools = {
    ...args.tools,
    background_task: false,  // Subagents can't spawn sub-subagents
  }
}
```
</tool_access>

<model_configuration>
## Model Configuration

**Anthropic Claude:**
```typescript
{
  model: "anthropic/claude-opus-4-5",
  thinking: { type: "enabled", budgetTokens: 32000 },
}
```

**OpenAI GPT:**
```typescript
{
  model: "openai/gpt-4",
  reasoningEffort: "medium",  // "low" | "medium" | "high"
}
```

**Helper for model detection:**
```typescript
function isGptModel(model: string): boolean {
  return model.startsWith("openai/") || model.startsWith("github-copilot/gpt-")
}

function createAgent(model: string): AgentConfig {
  const base = { /* common config */ }

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "medium" }
  }
  return { ...base, thinking: { type: "enabled", budgetTokens: 32000 } }
}
```
</model_configuration>

<prompt_design>
## Prompt Design Patterns

**Structured sections:**
```typescript
const prompt = `<Role>
You are a specialized agent for [domain].
</Role>

<Behavior_Instructions>
## Phase 1 - Assessment
[Instructions for initial analysis]

## Phase 2 - Execution
[Instructions for taking action]
</Behavior_Instructions>

<Constraints>
- NEVER do X
- ALWAYS verify Y before Z
</Constraints>

<Output_Format>
[Required output structure]
</Output_Format>`
```

**Dynamic prompt building:**
```typescript
function buildAgentPrompt(
  availableAgents: Agent[],
  availableTools: Tool[],
): string {
  const sections = [
    ROLE_SECTION,
    buildToolSection(availableTools),
    buildDelegationSection(availableAgents),
    CONSTRAINTS_SECTION,
  ]
  return sections.join("\n\n")
}
```
</prompt_design>

<agent_metadata>
## Agent Metadata for Dynamic Prompts

When building dynamic prompts (e.g., a main agent that knows about available subagents), use metadata:

```typescript
interface AgentPromptMetadata {
  category: "exploration" | "specialist" | "advisor" | "utility"
  cost: "FREE" | "CHEAP" | "EXPENSIVE"
  triggers: Array<{ domain: string; trigger: string }>
  useWhen?: string[]
  avoidWhen?: string[]
  keyTrigger?: string
  promptAlias?: string
}

const EXPLORE_METADATA: AgentPromptMetadata = {
  category: "exploration",
  cost: "FREE",
  promptAlias: "Explore",
  keyTrigger: "2+ modules involved → fire `explore` background",
  triggers: [
    { domain: "Explore", trigger: "Find existing codebase structure" },
  ],
  useWhen: [
    "Multiple search angles needed",
    "Unfamiliar module structure",
  ],
  avoidWhen: [
    "Known file location",
    "Single keyword suffices",
  ],
}
```
</agent_metadata>

<agent_factory>
## Agent Factory Pattern

Create configurable agents with factory functions:

```typescript
const DEFAULT_MODEL = "anthropic/claude-sonnet-4"

export function createExploreAgent(model: string = DEFAULT_MODEL): AgentConfig {
  return {
    description: "Codebase search specialist...",
    mode: "subagent",
    model,
    temperature: 0.1,
    tools: { write: false, edit: false, background_task: false },
    prompt: EXPLORE_PROMPT,
  }
}

// Register in plugin
export default async (ctx) => ({
  config: {
    agents: {
      explore: createExploreAgent(),
      "explore-opus": createExploreAgent("anthropic/claude-opus-4-5"),
    },
  },
})
```
</agent_factory>

<read_only_agents>
## Read-Only Agents

For exploration and research agents that shouldn't modify files:

```typescript
const researchAgent: AgentConfig = {
  description: "Research agent - read-only access",
  mode: "subagent",
  model: "anthropic/claude-sonnet-4",
  tools: {
    write: false,       // No file creation
    edit: false,        // No file modification
    bash: true,         // Can run commands (for git, etc.)
    background_task: false,
  },
  prompt: `You are a research specialist.

## Constraints
- **Read-only**: You cannot create, modify, or delete files
- Report findings as message text only
- Never attempt file writes`,
}
```
</read_only_agents>

<checklist>
## Agent Development Checklist

- [ ] Clear description for delegation UI
- [ ] Appropriate mode (primary vs subagent)
- [ ] Tool access restricted appropriately
- [ ] Model-specific options (thinking vs reasoningEffort)
- [ ] Prompt has clear structure and constraints
- [ ] Factory function allows model customization
- [ ] Metadata defined for dynamic prompt building
</checklist>
