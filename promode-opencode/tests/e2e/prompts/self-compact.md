# Test: Self-Compact Tool Safety Gate

This test verifies the `self_compact` tool requires confirmation before proceeding.

## Instructions

1. Call `self_compact` with `confirm_externalized: false`
2. Verify it returns an error requiring externalization first
3. Do NOT actually compact (this is just testing the safety gate)

## Expected Behavior

When called with `confirm_externalized: false`, the tool should:
- Return `success: false`
- Provide an error message about externalizing context first
- Include suggestions for what to externalize

## Test

Please call the `self_compact` tool with `confirm_externalized: false` and report:

1. Was the tool available? (PASS if yes, FAIL if not found)
2. Did it reject the request? (PASS if success: false)
3. Did it provide guidance? (PASS if error message includes externalization instructions)

Format your response as:
- Tool Available: PASS/FAIL
- Rejected Without Confirmation: PASS/FAIL
- Provided Guidance: PASS/FAIL

Overall: PASS if all checks pass, FAIL otherwise.
