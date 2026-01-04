import type { Plugin } from "@opencode-ai/plugin"
import { createSelfCompactTool } from "./tools/self-compact"
import { createGetContextUsageTool } from "./tools/get-context-usage"
import { promodeAgents } from "./agents"
import { createContextMonitorHook } from "./hooks/context-monitor"

/**
 * Promode OpenCode Plugin
 *
 * Enhances OpenCode with promode development methodology:
 * - Context-aware self-compaction
 * - Promode-trained subagents
 *
 * Core innovation: Agents can see their context usage and trigger
 * compaction themselves, enabling longer autonomous work sessions.
 */
const PromodePlugin: Plugin = async (ctx) => {
  // Initialize hooks
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

    // Post-tool execution hook (context status)
    "tool.execute.after": async (input, output) => {
      await contextMonitor["tool.execute.after"](input, output)
    },

    // Inject promode context into compaction summaries
    "experimental.session.compacting": async (input, output) => {
      await contextMonitor["experimental.session.compacting"](input, output)
    },
  }
}

export default PromodePlugin
