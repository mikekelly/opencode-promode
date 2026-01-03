import type { AgentConfig } from "@opencode-ai/sdk";
/**
 * Promode Subagent
 *
 * A general-purpose subagent that follows promode conventions including:
 * - TDD-first development
 * - Progressive disclosure
 * - Context conservation
 * - Behavioural authority hierarchy
 *
 * This mirrors the Claude Code promode-subagent, adapted for OpenCode.
 */
export declare function createPromodeSubagent(model?: string): AgentConfig;
export declare const promodeSubagent: AgentConfig;
//# sourceMappingURL=promode-subagent.d.ts.map