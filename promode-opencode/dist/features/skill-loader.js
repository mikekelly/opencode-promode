import { existsSync, readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
/**
 * Parse YAML frontmatter from skill markdown
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match)
        return {};
    const frontmatter = match[1];
    const result = {};
    // Simple YAML parsing for name and description
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    if (nameMatch)
        result.name = nameMatch[1].trim().replace(/^["']|["']$/g, "");
    const descMatch = frontmatter.match(/^description:\s*["']?([\s\S]*?)["']?\s*(?:\n---|\n\w+:|$)/m);
    if (descMatch)
        result.description = descMatch[1].trim().replace(/^["']|["']$/g, "");
    return result;
}
/**
 * Get the path to bundled skills directory
 */
function getBundledSkillsPath() {
    // In ESM, we need to derive path from import.meta.url
    // At runtime, this file is at dist/features/skill-loader.js
    // Skills are at skills/ (sibling to dist/)
    const currentDir = dirname(fileURLToPath(import.meta.url));
    // Go up from dist/features to package root, then into skills/
    return join(currentDir, "..", "..", "skills");
}
/**
 * Discover all bundled skills
 */
export function discoverBundledSkills() {
    const skillsPath = getBundledSkillsPath();
    if (!existsSync(skillsPath)) {
        return [];
    }
    const skills = [];
    const skillDirs = readdirSync(skillsPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    for (const skillName of skillDirs) {
        const skillDir = join(skillsPath, skillName);
        const skillMdPath = join(skillDir, "SKILL.md");
        if (!existsSync(skillMdPath)) {
            continue;
        }
        const content = readFileSync(skillMdPath, "utf-8");
        const frontmatter = parseFrontmatter(content);
        skills.push({
            name: frontmatter.name || skillName,
            description: frontmatter.description || `Skill: ${skillName}`,
            path: skillDir,
            content,
        });
    }
    return skills;
}
/**
 * Get a specific skill by name
 */
export function getSkill(name) {
    const skills = discoverBundledSkills();
    return skills.find((s) => s.name === name);
}
/**
 * List all available skill names
 */
export function listSkillNames() {
    return discoverBundledSkills().map((s) => s.name);
}
//# sourceMappingURL=skill-loader.js.map