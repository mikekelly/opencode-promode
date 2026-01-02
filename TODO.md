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
- [ ] **Context usage visibility** — How to expose token counts to agents? Custom tool or system prompt injection?

### Next Up

- [ ] Test context usage visibility — can we expose token counts to agents?

### Implementation (When Ready)

- [ ] Implement `self_compact` tool for agent-initiated compaction
- [ ] Port `promode-subagent` as OpenCode agent definition
- [ ] Port existing skills (should be ~1:1)
- [ ] Implement TDD enforcement hook
- [ ] Implement context monitor hook
- [ ] Design e2e test harness using OpenCode CLI
- [ ] Build CLI installer

### Reference

- oh-my-opencode repo: `tmp/oh-my-opencode/` (gitignored)
- OpenCode docs: https://opencode.ai/docs/
- Analysis doc: `docs/opencode-port/README.md`
- IDEAS.md: Context-aware self-compaction vision
