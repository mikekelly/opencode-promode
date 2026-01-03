import { tool } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"

/**
 * get_context_usage - Query current context window utilization
 *
 * Allows agents to check how much of their context window is used,
 * enabling informed decisions about when to externalize state and compact.
 *
 * Token information in OpenCode flows through message events, not a dedicated API.
 * This tool queries session messages and extracts token counts from the most
 * recent assistant message.
 */

// Default context limits by model family
const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  "claude-3-opus": 200_000,
  "claude-3-sonnet": 200_000,
  "claude-3-haiku": 200_000,
  "claude-3-5-sonnet": 200_000,
  "claude-3-5-haiku": 200_000,
  "claude-sonnet-4": 200_000,
  "claude-opus-4": 200_000,
  "gpt-4-turbo": 128_000,
  "gpt-4o": 128_000,
  "gpt-4o-mini": 128_000,
  default: 200_000, // Conservative default
}

function getContextLimit(modelID?: string): number {
  if (!modelID) return MODEL_CONTEXT_LIMITS.default

  // Match model family from ID
  for (const [family, limit] of Object.entries(MODEL_CONTEXT_LIMITS)) {
    if (family !== "default" && modelID.toLowerCase().includes(family)) {
      return limit
    }
  }

  return MODEL_CONTEXT_LIMITS.default
}

/**
 * Creates the get_context_usage tool with access to the plugin client
 */
export function createGetContextUsageTool(pluginCtx: PluginInput) {
  return tool({
    description: `Get current context window usage statistics.

Returns:
- used_tokens: Total tokens consumed so far
- limit_tokens: Maximum context window size
- percentage: Usage as percentage (e.g., "45.2%")
- remaining_tokens: Tokens still available
- status: "low" (<50%), "moderate" (50-70%), "high" (70-85%), "critical" (>85%)

Use this to decide when to externalize state and trigger self_compact.
Recommended actions by status:
- low/moderate: Continue normally
- high: Start externalizing important state to files
- critical: Externalize immediately and call self_compact`,

    args: {},

    async execute(_args, toolCtx): Promise<string> {
      try {
        const sessionID = toolCtx.sessionID

        if (!sessionID) {
          return JSON.stringify({
            success: false,
            error: "Could not determine session ID",
          })
        }

        // Query session messages to get token info
        const messagesResponse = await pluginCtx.client.session.messages({
          path: { id: sessionID },
        })

        // Handle response format
        const messages = Array.isArray(messagesResponse)
          ? messagesResponse
          : []

        // Look for token info in assistant messages (most recent first)
        interface TokenInfo {
          input?: number
          output?: number
          reasoning?: number
          cache?: { read?: number; write?: number }
        }

        let tokenInfo: TokenInfo | null = null

        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i] as {
            info?: {
              role?: string
              tokens?: TokenInfo
            }
          }
          const info = msg?.info

          if (info?.role === "assistant" && info?.tokens) {
            tokenInfo = info.tokens
            break
          }
        }

        const limit = getContextLimit() // TODO: Get from session model config

        if (!tokenInfo) {
          return JSON.stringify({
            success: true,
            used_tokens: 0,
            limit_tokens: limit,
            percentage: "0.0%",
            remaining_tokens: limit,
            status: "low",
            note: "No token usage data available yet - this is normal at conversation start",
          })
        }

        // Calculate total usage
        // Input tokens + cached reads represent context consumed
        const inputTokens = tokenInfo.input || 0
        const cacheRead = tokenInfo.cache?.read || 0
        const usedTokens = inputTokens + cacheRead

        const percentage = (usedTokens / limit) * 100
        const remaining = limit - usedTokens

        // Determine status
        let status: "low" | "moderate" | "high" | "critical"
        let recommendation: string

        if (percentage < 50) {
          status = "low"
          recommendation = "Context usage is low. Continue working normally."
        } else if (percentage < 70) {
          status = "moderate"
          recommendation =
            "Context usage is moderate. Consider planning for externalization if task is large."
        } else if (percentage < 85) {
          status = "high"
          recommendation =
            "Context usage is HIGH. Start externalizing important state to files now."
        } else {
          status = "critical"
          recommendation =
            "Context usage is CRITICAL. Externalize state immediately and call self_compact."
        }

        return JSON.stringify({
          success: true,
          used_tokens: usedTokens,
          limit_tokens: limit,
          percentage: `${percentage.toFixed(1)}%`,
          remaining_tokens: remaining,
          status,
          recommendation,
          details: {
            input_tokens: inputTokens,
            cache_read_tokens: cacheRead,
            output_tokens: tokenInfo.output || 0,
            reasoning_tokens: tokenInfo.reasoning || 0,
          },
        })
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Failed to get context usage: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    },
  })
}
