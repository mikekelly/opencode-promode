import type { Plugin } from "@opencode-ai/plugin"
import { createSelfCompactTool } from "./tools/self-compact"
import { createGetContextUsageTool } from "./tools/get-context-usage"
import { promodeAgents } from "./agents"

/**
 * Promode OpenCode Plugin
 *
 * Enhances OpenCode with promode development methodology:
 * - TDD-first development
 * - Context-aware self-compaction
 * - Promode-trained subagents
 *
 * Core innovation: Agents can see their context usage and trigger
 * compaction themselves, enabling longer autonomous work sessions.
 */
export const PromodePlugin: Plugin = async (ctx) => {
  return {
    // Custom tools for context management
    tool: {
      self_compact: createSelfCompactTool(ctx),
      get_context_usage: createGetContextUsageTool(ctx),
    },

    // Inject promode context into compaction summaries
    "experimental.session.compacting": async (_input, output) => {
      output.context.push(`
PROMODE CONTEXT TO PRESERVE:
- Current task and its completion status
- TDD state: which tests exist, which are passing/failing
- Files actively being worked on
- Key decisions made during this session
- Any externalized state locations (.context/ files, TODO.md)
`)
    },

    // Register promode agents via config hook
    config: async (config) => {
      // Add promode agents to the config
      config.agent = {
        ...config.agent,
        ...promodeAgents,
      }
    },

    // Future: TDD enforcement hooks will go here
    // "tool.execute.before": async (input, output) => {
    //   // Check for test-first patterns
    // },
  }
}

export default PromodePlugin
