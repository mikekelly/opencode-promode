import type { PluginInput } from "@opencode-ai/plugin";
/**
 * Creates the TDD enforcer hook
 */
export declare function createTDDEnforcerHook(_pluginCtx: PluginInput): {
    /**
     * Before tool execution - track file operations
     * Note: OpenCode API provides tool name as string, args in output
     */
    "tool.execute.before": (input: {
        tool: string;
        sessionID: string;
        callID: string;
    }, output: {
        args: unknown;
    }) => Promise<void>;
    /**
     * After tool execution - add TDD reminders when appropriate
     */
    "tool.execute.after": (input: {
        tool: string;
        sessionID: string;
        callID: string;
    }, output: {
        title: string;
        output: string;
        metadata: unknown;
    }) => Promise<void>;
    /**
     * Get current TDD state for debugging/reporting
     */
    getState: () => {
        testFilesModified: string[];
        implFilesModified: string[];
        recentTestMod: boolean;
    };
    /**
     * Reset state (useful for testing)
     */
    reset: () => void;
};
//# sourceMappingURL=tdd-enforcer.d.ts.map