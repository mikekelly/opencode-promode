import type { PluginInput } from "@opencode-ai/plugin";
/**
 * Creates the get_context_usage tool with access to the plugin client
 */
export declare function createGetContextUsageTool(pluginCtx: PluginInput): {
    description: string;
    args: {};
    execute(args: Record<string, never>, context: import("@opencode-ai/plugin").ToolContext): Promise<string>;
};
//# sourceMappingURL=get-context-usage.d.ts.map