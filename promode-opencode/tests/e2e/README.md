# E2E Test Harness

End-to-end tests for promode-opencode plugin using OpenCode CLI.

## Prerequisites

1. OpenCode CLI installed (`opencode` command available)
2. promode-opencode plugin installed (`bunx promode-opencode install`)
3. Valid API credentials configured

## Test Structure

Tests use the `opencode run` command to execute prompts and verify plugin behavior.

```
tests/e2e/
├── README.md           # This file
├── run-tests.sh        # Main test runner
├── prompts/            # Test prompt files
│   ├── context-usage.md
│   ├── self-compact.md
│   ├── tdd-reminder.md
│   └── subagent-delegation.md
└── fixtures/           # Test fixtures (sample projects)
    └── simple-project/
```

## Running Tests

```bash
# Run all e2e tests
./tests/e2e/run-tests.sh

# Run specific test
./tests/e2e/run-tests.sh context-usage

# Run with verbose output
./tests/e2e/run-tests.sh --verbose
```

## Test Cases

### 1. Context Usage Tool (`context-usage.md`)

Verifies `get_context_usage` tool is available and returns expected fields.

**Expected behavior:**
- Tool is registered and callable
- Returns `used_tokens`, `limit_tokens`, `percentage`, `status`
- Status is one of: low, moderate, high, critical

### 2. Self-Compact Tool (`self-compact.md`)

Verifies `self_compact` tool requires confirmation before compacting.

**Expected behavior:**
- Returns error if `confirm_externalized: false`
- Suggests externalizing state first
- Proceeds with compaction if `confirm_externalized: true`

### 3. TDD Reminder Hook (`tdd-reminder.md`)

Verifies TDD enforcement hook adds reminders when editing implementation files.

**Expected behavior:**
- No reminder when editing test files first
- Reminder appended when editing implementation without tests

### 4. Subagent Delegation (`subagent-delegation.md`)

Verifies promode-subagent is available and follows methodology.

**Expected behavior:**
- Agent is registered with name "promode-subagent"
- Agent has correct tools enabled (write, edit, bash)
- Agent prompt includes promode methodology

## Writing New Tests

Each test is a markdown file in `prompts/` containing:
1. A prompt for the agent to execute
2. Expected outcomes documented in comments

```markdown
<!-- Test: feature-name -->
<!-- Expected: description of expected behavior -->

Your prompt here asking the agent to do something testable.

Report the results in a structured format:
- Success criteria 1: [PASS/FAIL]
- Success criteria 2: [PASS/FAIL]
```

## Integration with CI

Tests can be run in CI by:
1. Setting up OpenCode with test credentials
2. Installing the plugin
3. Running the test harness
4. Parsing output for PASS/FAIL results

Example GitHub Actions step:
```yaml
- name: Run e2e tests
  run: ./tests/e2e/run-tests.sh
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```
