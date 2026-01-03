import type { PluginInput } from "@opencode-ai/plugin";
/**
 * self_compact - Agent-initiated context compaction
 *
 * This is the core innovation of promode: allowing agents to trigger their own
 * context compaction when they recognize they're running low on context space.
 *
 * The workflow:
 * 1. Agent notices context usage is high (via get_context_usage tool or hook warnings)
 * 2. Agent externalizes important state to files (.context/, TODO.md, etc.)
 * 3. Agent calls self_compact with confirmation that state was externalized
 * 4. Plugin triggers session.summarize() to compact the context
 * 5. Agent continues with fresh context, reading externalized state as needed
 *
 * The confirm_externalized parameter is a safety gate - it forces the agent to
 * acknowledge that important context has been saved before compaction destroys it.
 */
/**
 * Creates the self_compact tool with access to the plugin client
 */
export declare function createSelfCompactTool(pluginCtx: PluginInput): {
    description: string;
    args: {
        confirm_externalized: import("zod").ZodBoolean;
        externalized_files: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
        summary_hint: import("zod").ZodOptional<import("zod").ZodString>;
    };
    execute(args: {
        confirm_externalized: boolean;
        externalized_files?: string[] | undefined;
        summary_hint?: string | undefined;
    }, context: import("@opencode-ai/plugin").ToolContext): Promise<string>;
};
//# sourceMappingURL=self-compact.d.ts.map