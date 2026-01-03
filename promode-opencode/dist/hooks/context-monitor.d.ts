import type { PluginInput } from "@opencode-ai/plugin";
import type { Event } from "@opencode-ai/sdk";
/**
 * Creates the context monitor hook
 */
export declare function createContextMonitorHook(_pluginCtx: PluginInput): {
    /**
     * Handle session events to track token usage
     * EventMessageUpdated.properties.info is a Message (UserMessage | AssistantMessage)
     * AssistantMessage has tokens field with input, output, cache info
     */
    event: (input: {
        event: Event;
    }) => Promise<void>;
    /**
     * After tool execution - append context status if above threshold
     */
    "tool.execute.after": (_input: {
        tool: string;
        sessionID: string;
        callID: string;
    }, output: {
        title: string;
        output: string;
        metadata: unknown;
    }) => Promise<void>;
    /**
     * Inject context preservation hints during compaction
     */
    "experimental.session.compacting": (_input: {
        sessionID: string;
    }, output: {
        context: string[];
        prompt?: string;
    }) => Promise<void>;
    /**
     * Get current context state for debugging
     */
    getState: () => {
        usage: number;
        limit: number;
        percentage: string;
        lastUpdate: string;
    };
    /**
     * Manually update usage (useful for testing or when tool fetches fresh data)
     */
    updateUsage: (usage: number, limit?: number) => void;
};
//# sourceMappingURL=context-monitor.d.ts.map