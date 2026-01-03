/**
 * Context Monitor Hook
 *
 * Monitors context usage and injects warnings when usage exceeds thresholds.
 * This helps agents be aware of their context limits and take action before
 * hitting them.
 *
 * Thresholds:
 * - 50%: Moderate - continue normally
 * - 70%: High - start thinking about externalization
 * - 85%: Critical - externalize and compact soon
 *
 * The hook appends context status to tool outputs when above 50%.
 */
// Default context limits by model family
const MODEL_CONTEXT_LIMITS = {
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
    default: 200_000,
};
/**
 * Creates the context monitor hook
 */
export function createContextMonitorHook(_pluginCtx) {
    const state = {
        lastKnownUsage: 0,
        lastKnownLimit: MODEL_CONTEXT_LIMITS.default,
        lastUpdateTime: 0,
    };
    return {
        /**
         * Handle session events to track token usage
         * EventMessageUpdated.properties.info is a Message (UserMessage | AssistantMessage)
         * AssistantMessage has tokens field with input, output, cache info
         */
        event: async (input) => {
            const { event } = input;
            // Update token counts from message events
            if (event.type === "message.updated") {
                const info = event.properties?.info;
                // Only AssistantMessage has tokens (role === "assistant")
                if (info && info.role === "assistant" && "tokens" in info && info.tokens) {
                    const tokens = info.tokens;
                    const inputTokens = tokens.input || 0;
                    const cacheRead = tokens.cache?.read || 0;
                    state.lastKnownUsage = inputTokens + cacheRead;
                    state.lastUpdateTime = Date.now();
                }
            }
        },
        /**
         * After tool execution - append context status if above threshold
         */
        "tool.execute.after": async (_input, output) => {
            // Skip if we don't have recent usage data
            if (Date.now() - state.lastUpdateTime > 60000)
                return;
            const usage = state.lastKnownUsage;
            const limit = state.lastKnownLimit;
            const percentage = (usage / limit) * 100;
            // Only show status when above 50%
            if (percentage < 50)
                return;
            let status;
            let recommendation;
            if (percentage < 70) {
                status = "MODERATE";
                recommendation = "Continue normally. Consider organizing your work.";
            }
            else if (percentage < 85) {
                status = "HIGH";
                recommendation =
                    "Start externalizing important context to files (.context/, TODO.md). " +
                        "Consider calling get_context_usage for detailed info.";
            }
            else {
                status = "CRITICAL";
                recommendation =
                    "Externalize state NOW and call self_compact. Risk of hitting context limit.";
            }
            const remaining = limit - usage;
            const remainingK = Math.round(remaining / 1000);
            output.output += `

[Context ${status}: ${percentage.toFixed(1)}% used, ~${remainingK}k tokens remaining. ${recommendation}]`;
        },
        /**
         * Inject context preservation hints during compaction
         */
        "experimental.session.compacting": async (_input, output) => {
            output.context.push(`
PROMODE CONTEXT TO PRESERVE:
- Current task and completion status
- TDD state: which tests exist, which pass/fail
- Files being actively worked on
- Key decisions made during this session
- Externalized state locations (.context/, TODO.md)
- Any blocking issues or escalation needs
`);
        },
        /**
         * Get current context state for debugging
         */
        getState: () => ({
            usage: state.lastKnownUsage,
            limit: state.lastKnownLimit,
            percentage: ((state.lastKnownUsage / state.lastKnownLimit) * 100).toFixed(1),
            lastUpdate: new Date(state.lastUpdateTime).toISOString(),
        }),
        /**
         * Manually update usage (useful for testing or when tool fetches fresh data)
         */
        updateUsage: (usage, limit) => {
            state.lastKnownUsage = usage;
            if (limit)
                state.lastKnownLimit = limit;
            state.lastUpdateTime = Date.now();
        },
    };
}
//# sourceMappingURL=context-monitor.js.map