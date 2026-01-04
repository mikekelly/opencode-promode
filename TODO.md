# TODO

## OpenCode Port Evaluation

### Completed

- [x] Analyze oh-my-opencode structure (cloned to `tmp/oh-my-opencode`)
  - [x] Agent configuration patterns
  - [x] Plugin architecture
  - [x] Distribution approach
  - [x] Claude Code compatibility layer
- [x] Document goals and feasibility (see `docs/opencode-port/README.md`)
- [x] Test subagent spawning in OpenCode (2026-01-02)
  - [x] Verified OpenCode v1.0.208 installed with oh-my-opencode plugin
  - [x] Confirmed main agent has `background_task`, `call_omo_agent`, `task` tools
  - [x] Found oh-my-opencode explicitly disables `background_task: false` for subagents
  - [x] **Conclusion**: OpenCode supports it; oh-my-opencode disables by design choice

### Open Questions (Need Testing)

- [x] ~~**Subagent spawning subagents** — Does OpenCode allow it?~~ **Answered**: Yes, plugin can enable via `background_task: true`
- [x] ~~**Context usage visibility** — How to expose token counts to agents?~~ **Answered**: Custom tool + hook injection (2026-01-02)
  - Token info available via `message.updated` event (`info.tokens`) and `ctx.client.session.messages()` API
  - oh-my-opencode uses `tool.execute.after` hook to append usage to tool output
  - Recommend: custom `get_context_usage` tool + automatic hook injection at thresholds

### Implementation

- [x] Implement `self_compact` tool for agent-initiated compaction (2026-01-02)
  - Created `promode-opencode/src/tools/self-compact.ts`
  - Safety gate requires `confirm_externalized: true` before compacting
  - Calls `ctx.client.session.summarize()` to trigger compaction
- [x] Implement `get_context_usage` tool (2026-01-02)
  - Created `promode-opencode/src/tools/get-context-usage.ts`
  - Queries session messages for token info
  - Returns status: low/moderate/high/critical with recommendations
- [x] Create plugin entry point with compaction hook (2026-01-02)
  - `experimental.session.compacting` injects promode context preservation hints
- [x] Port `promode-subagent` as OpenCode agent definition (2026-01-03)
  - Created `promode-opencode/src/agents/promode-subagent.ts`
  - Full promode methodology prompt (TDD, behavioural authority, escalation rules)
  - Registered via plugin `config` hook in `src/index.ts`
- [x] Port existing skills to OpenCode format (2026-01-03)
  - Copied skills to `promode-opencode/skills/` (managing-claude-code-meta, managing-skills)
  - Created skill loader at `src/features/skill-loader.ts`
  - Skills bundled with npm package for distribution
- [x] ~~Implement TDD enforcement hook~~ **Removed** (2026-01-04)
  - Was too flaky — hard-coded file patterns don't generalize across languages/projects
  - TDD enforcement better handled via agent prompts, not deterministic hooks
- [x] Implement context monitor hook (2026-01-03)
  - Created `promode-opencode/src/hooks/context-monitor.ts`
  - Tracks token usage from `message.updated` events
  - Appends context status to tool outputs when usage > 50%
  - Thresholds: MODERATE (50-70%), HIGH (70-85%), CRITICAL (>85%)
- [x] Design e2e test harness using OpenCode CLI (2026-01-03)
  - Created `tests/e2e/` with test runner and prompt files
  - Tests: context-usage, self-compact, subagent-check
  - Runs via `./tests/e2e/run-tests.sh`
- [x] Build CLI installer (2026-01-03)
  - Created `promode-opencode/src/cli/install.ts`
  - Commands: install, uninstall, status, help
  - Registers plugin in `~/.config/opencode/opencode.json`
  - Creates promode config at `~/.config/opencode/promode.json`

### Reference

- oh-my-opencode repo: `tmp/oh-my-opencode/` (gitignored)
- OpenCode docs: https://opencode.ai/docs/
- Analysis doc: `docs/opencode-port/README.md`
- IDEAS.md: Context-aware self-compaction vision
