import type { AgentConfig } from "@opencode-ai/sdk"
import { promodeSubagent, createPromodeSubagent } from "./promode-subagent"

export { promodeSubagent, createPromodeSubagent }

/**
 * All built-in promode agents
 */
export const promodeAgents: Record<string, AgentConfig> = {
  "promode-subagent": promodeSubagent,
}
