import type { Plugin } from "@opencode-ai/plugin"
import { createSelfCompactTool } from "./tools/self-compact"
import { createGetContextUsageTool } from "./tools/get-context-usage"
import { promodeAgents } from "./agents"
import { createTDDEnforcerHook } from "./hooks/tdd-enforcer"
import { createContextMonitorHook } from "./hooks/context-monitor"

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
const PromodePlugin: Plugin = async (ctx) => {
  // Initialize hooks
  const tddEnforcer = createTDDEnforcerHook(ctx)
  const contextMonitor = createContextMonitorHook(ctx)

  return {
    // Custom tools for context management
    tool: {
      self_compact: createSelfCompactTool(ctx),
      get_context_usage: createGetContextUsageTool(ctx),
    },

    // Register promode agents via config hook
    config: async (config) => {
      // Add promode agents to the config
      config.agent = {
        ...config.agent,
        ...promodeAgents,
      }
    },

    // Handle session events (context tracking)
    event: async (input) => {
      await contextMonitor.event(input)
    },

    // Pre-tool execution hook (TDD tracking)
    "tool.execute.before": async (input, output) => {
      await tddEnforcer["tool.execute.before"](input, output)
    },

    // Post-tool execution hook (TDD reminders + context status)
    "tool.execute.after": async (input, output) => {
      await tddEnforcer["tool.execute.after"](input, output)
      await contextMonitor["tool.execute.after"](input, output)
    },

    // Inject promode context into compaction summaries
    "experimental.session.compacting": async (input, output) => {
      await contextMonitor["experimental.session.compacting"](input, output)
    },
  }
}

export default PromodePlugin
