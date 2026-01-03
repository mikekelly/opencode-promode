# Test: Promode Subagent Registration

This test verifies the promode-subagent is registered and available for delegation.

## Instructions

1. Check if you can see "promode-subagent" in your available agents
2. Describe the capabilities of the promode-subagent if available

## Expected Behavior

The promode-subagent should be:
- Registered with OpenCode
- Have a description mentioning TDD, promode conventions, or task delegation
- Be available for spawning via task/background_task tools

## Test

Check your available agents and report:

1. Is promode-subagent listed? (PASS if yes, FAIL if not found)
2. Does it have a description? (PASS if description is present)
3. Does the description mention promode or TDD? (PASS if yes)

Format your response as:
- Agent Listed: PASS/FAIL
- Has Description: PASS/FAIL
- Mentions Methodology: PASS/FAIL

Overall: PASS if at least 2 of 3 checks pass, FAIL otherwise.
