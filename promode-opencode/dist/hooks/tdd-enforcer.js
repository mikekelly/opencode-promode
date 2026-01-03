/**
 * TDD Enforcement Hook
 *
 * This hook encourages test-first development by:
 * 1. Tracking when test files are created/modified
 * 2. Warning when implementation files are modified without corresponding test changes
 * 3. Suggesting test-first patterns in tool output
 *
 * This is a soft enforcement - it adds reminders rather than blocking.
 * The goal is to reinforce TDD habits without breaking the workflow.
 */
// Common test file patterns
const TEST_FILE_PATTERNS = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /_test\.[jt]sx?$/,
    /_spec\.[jt]sx?$/,
    /test_.*\.[jt]sx?$/,
    /tests?\/.*\.[jt]sx?$/,
    /__tests__\/.*\.[jt]sx?$/,
];
// Implementation file patterns (not test files)
const IMPL_FILE_PATTERNS = [
    /\.tsx?$/,
    /\.jsx?$/,
    /\.py$/,
    /\.go$/,
    /\.rs$/,
    /\.rb$/,
];
// Files to ignore (config, docs, etc.)
const IGNORE_PATTERNS = [
    /\.md$/,
    /\.json$/,
    /\.ya?ml$/,
    /\.toml$/,
    /\.lock$/,
    /\.gitignore$/,
    /\.env/,
    /node_modules\//,
    /dist\//,
    /build\//,
    /\.git\//,
];
function isTestFile(path) {
    return TEST_FILE_PATTERNS.some((p) => p.test(path));
}
function isImplementationFile(path) {
    if (IGNORE_PATTERNS.some((p) => p.test(path)))
        return false;
    if (isTestFile(path))
        return false;
    return IMPL_FILE_PATTERNS.some((p) => p.test(path));
}
/**
 * Creates the TDD enforcer hook
 */
export function createTDDEnforcerHook(_pluginCtx) {
    // Track state across tool calls in this session
    const state = {
        testFilesModified: new Set(),
        implFilesModified: new Set(),
        lastTestModTime: 0,
        lastImplModTime: 0,
        pendingToolArgs: new Map(),
    };
    return {
        /**
         * Before tool execution - track file operations
         * Note: OpenCode API provides tool name as string, args in output
         */
        "tool.execute.before": async (input, output) => {
            const toolName = input.tool;
            const args = output.args;
            // Cache args for the after hook
            if (args) {
                state.pendingToolArgs.set(input.callID, args);
            }
            // Track file operations to understand TDD patterns
            if (toolName === "write" || toolName === "edit") {
                const filePath = (args?.file_path || args?.path);
                if (!filePath)
                    return;
                if (isTestFile(filePath)) {
                    state.testFilesModified.add(filePath);
                    state.lastTestModTime = Date.now();
                }
                else if (isImplementationFile(filePath)) {
                    state.implFilesModified.add(filePath);
                    state.lastImplModTime = Date.now();
                }
            }
        },
        /**
         * After tool execution - add TDD reminders when appropriate
         */
        "tool.execute.after": async (input, output) => {
            const toolName = input.tool;
            const args = state.pendingToolArgs.get(input.callID);
            // Clean up cached args
            state.pendingToolArgs.delete(input.callID);
            // Only add reminders for file write/edit operations
            if (toolName !== "write" && toolName !== "edit")
                return;
            const filePath = (args?.file_path || args?.path);
            if (!filePath)
                return;
            // Skip non-implementation files
            if (!isImplementationFile(filePath))
                return;
            // Check if we've modified test files recently (within last 2 minutes)
            const recentTestMod = Date.now() - state.lastTestModTime < 120000;
            if (!recentTestMod && state.testFilesModified.size === 0) {
                // No tests modified in this session - add a gentle reminder
                output.output += `

[TDD Reminder: No test files have been modified in this session. Consider writing a failing test first to define the expected behavior.]`;
            }
        },
        /**
         * Get current TDD state for debugging/reporting
         */
        getState: () => ({
            testFilesModified: Array.from(state.testFilesModified),
            implFilesModified: Array.from(state.implFilesModified),
            recentTestMod: Date.now() - state.lastTestModTime < 120000,
        }),
        /**
         * Reset state (useful for testing)
         */
        reset: () => {
            state.testFilesModified.clear();
            state.implFilesModified.clear();
            state.lastTestModTime = 0;
            state.lastImplModTime = 0;
            state.pendingToolArgs.clear();
        },
    };
}
//# sourceMappingURL=tdd-enforcer.js.map