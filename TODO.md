# TODO

## OpenCode Port Evaluation

### Completed

- [x] Analyze oh-my-opencode structure (cloned to `tmp/oh-my-opencode`)
  - [x] Agent configuration patterns
  - [x] Plugin architecture
  - [x] Distribution approach
  - [x] Claude Code compatibility layer
- [x] Document goals and feasibility (see `docs/opencode-port/README.md`)
### Open Questions (Need Testing)

- [ ] **Subagent spawning subagents** — Does OpenCode allow it? oh-my-opencode disables it, but may just be a choice
- [ ] **Context usage visibility** — How to expose token counts to agents? Custom tool or system prompt injection?

### Next Up

- [ ] Test subagent spawning in OpenCode (install opencode, try it)

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
