/**
 * Skill Loader for promode-opencode
 *
 * Skills are markdown files that provide domain-specific knowledge to agents.
 * This module discovers skills bundled with the plugin and makes them available.
 *
 * In OpenCode, skills can be loaded from:
 * 1. Bundled skills (shipped with this plugin in skills/ directory)
 * 2. User skills (~/.config/opencode/skills/ or ~/.claude/skills/)
 * 3. Project skills (.opencode/skills/ or .claude/skills/)
 *
 * This loader focuses on bundled skills. User/project skills are handled by
 * OpenCode's native skill discovery or Claude Code compatibility layer.
 */
export interface Skill {
    name: string;
    description: string;
    path: string;
    content: string;
}
/**
 * Discover all bundled skills
 */
export declare function discoverBundledSkills(): Skill[];
/**
 * Get a specific skill by name
 */
export declare function getSkill(name: string): Skill | undefined;
/**
 * List all available skill names
 */
export declare function listSkillNames(): string[];
//# sourceMappingURL=skill-loader.d.ts.map