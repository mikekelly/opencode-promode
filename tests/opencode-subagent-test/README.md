# OpenCode Subagent Spawning Test

This directory contains tests for whether OpenCode allows subagents to spawn their own subagents.

## Test Approach

1. Start OpenCode with a prompt that asks the primary agent to delegate to a subagent
2. That subagent's task will be to delegate to another subagent
3. Observe whether the nested delegation works

## Running the Test

```bash
cd /Users/mike/conductor/workspaces/opencode-promode/little-rock
opencode run "Use the @explore agent to find files, and have that agent delegate part of its work to another agent"
```

## Expected Outcomes

- **Success**: The explore agent can spawn another agent (e.g., `@general`)
- **Failure**: The explore agent cannot spawn other agents, returns an error
- **Partial**: The explore agent has a limited tool set that doesn't include agent spawning

## Findings (2026-01-02)

**Result**: Subagents **cannot** spawn other subagents — but this is a **plugin design choice**, not an OpenCode limitation.

### Test 1: Tool Inventory
```bash
opencode run --model anthropic/claude-sonnet-4-0 "List all the tools you have access to"
```
**Main agent tools include**: `background_task`, `background_output`, `background_cancel`, `call_omo_agent`, `task`

### Test 2: Subagent Tool Restrictions
```bash
opencode run --agent explore ...
```
**Output**: "agent explore is a subagent, not a primary agent. Falling back to default agent"

### Test 3: oh-my-opencode Source Analysis
From `src/agents/explore.ts`:
```typescript
tools: {
  write: false,
  edit: false,
  background_task: false,  // <-- Explicitly disabled
}
```

### Conclusion

OpenCode's plugin architecture **supports** subagent spawning via the `background_task` tool. The oh-my-opencode plugin intentionally disables this for subagents to:
- Prevent runaway context usage
- Maintain clear delegation hierarchy
- Control costs

**For promode**: We can enable `background_task: true` on promode-subagent if we want nested delegation. Recommend starting single-level like oh-my-opencode.
