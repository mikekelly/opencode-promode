# Test: Context Usage Tool

This test verifies the `get_context_usage` tool is registered and working.

## Instructions

1. Call the `get_context_usage` tool
2. Verify the response contains expected fields

## Expected Behavior

The tool should return a JSON object with:
- `success`: boolean
- `used_tokens`: number
- `limit_tokens`: number
- `percentage`: string (e.g., "0.0%")
- `status`: one of "low", "moderate", "high", "critical"

## Test

Please call the `get_context_usage` tool and report:

1. Was the tool available? (PASS if yes, FAIL if not found)
2. Did it return a valid response? (PASS if valid JSON with expected fields)
3. Is the status field valid? (PASS if one of: low, moderate, high, critical)

Format your response as:
- Tool Available: PASS/FAIL
- Valid Response: PASS/FAIL
- Valid Status: PASS/FAIL

Overall: PASS if all checks pass, FAIL otherwise.
