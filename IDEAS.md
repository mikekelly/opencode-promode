# Ideas

## Context-Aware Self-Compaction

**Problem**: Agents don't know how much context they've consumed, so they can't make informed decisions about when to compact or what information to preserve.

**Proposal**:

1. **Expose % context usage** to agents (both main and subagents) as a visible metric
2. **Allow agents to self-compact**: Give agents the ability to trigger compaction themselves when they determine it's appropriate
3. **Modify compaction process** to be more intentional:
   - Before compacting, the model ensures relevant information has been captured in markdown documentation (TODOs, notes, summaries)
   - The agent can then compact more aggressively, knowing it can progressively disclose the relevant information by reference later
4. **Benefits**:
   - Agents can proactively manage context instead of hitting limits unexpectedly
   - Important context survives compaction because it's been externalized to files
   - More efficient use of context window through informed trade-offs
   - Subagents can independently manage their own context without needing to escalate
