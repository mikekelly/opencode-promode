import { tool } from "@opencode-ai/plugin"
import type { PluginInput } from "@opencode-ai/plugin"

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
export function createSelfCompactTool(pluginCtx: PluginInput) {
  return tool({
    description: `Trigger context compaction to free up context space.

IMPORTANT: Before calling this tool, you MUST:
1. Save any important working state to files (use .context/ directory or TODO.md)
2. Document the current task status and next steps
3. Note any decisions or context that would be lost

After compaction, you will receive a summary of the conversation but lose detailed context.
Only use this when context usage is high (>70%) and you have externalized important state.`,

    args: {
      confirm_externalized: tool.schema
        .boolean()
        .describe(
          "Confirm that you have saved important context to files before compacting. Set to true only after externalizing state."
        ),
      externalized_files: tool.schema
        .array(tool.schema.string())
        .optional()
        .describe(
          "List of files where you saved important context (e.g., ['.context/task-state.md', 'TODO.md'])"
        ),
      summary_hint: tool.schema
        .string()
        .optional()
        .describe(
          "Optional hint for the compaction summary - what should be preserved in the summary"
        ),
    },

    async execute(args, toolCtx): Promise<string> {
      // Safety gate: require explicit confirmation
      if (!args.confirm_externalized) {
        return JSON.stringify({
          success: false,
          error:
            "You must externalize important context to files before compacting. " +
            "Save your working state to .context/ directory or other files, then call " +
            "self_compact with confirm_externalized: true.",
          suggestions: [
            "Write current task status to .context/task-state.md",
            "Update TODO.md with progress and next steps",
            "Save any important decisions or findings to files",
          ],
        })
      }

      try {
        const sessionID = toolCtx.sessionID

        if (!sessionID) {
          return JSON.stringify({
            success: false,
            error: "Could not determine session ID for compaction",
          })
        }

        // Trigger compaction via the plugin-level client
        // The experimental.session.compacting hook will inject promode-specific context
        await pluginCtx.client.session.summarize({
          path: { id: sessionID },
        })

        const result = {
          success: true,
          message: "Context compaction initiated successfully.",
          externalized_files: args.externalized_files || [],
          next_steps: [
            "Read your externalized state files to restore working context",
            "Continue with your task using the compacted context",
            "Use get_context_usage to verify context was freed",
          ],
          hint: args.summary_hint
            ? `Summary hint provided: "${args.summary_hint}"`
            : undefined,
        }

        return JSON.stringify(result)
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Compaction failed: ${error instanceof Error ? error.message : String(error)}`,
          suggestion:
            "Check if the session is active and try again. If the problem persists, " +
            "continue working and try compaction later.",
        })
      }
    },
  })
}
