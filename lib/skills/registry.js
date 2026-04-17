import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseSkillMd, SkillParseError } from "./parser.js";

/**
 * @typedef {Object} Skill
 * @property {string} name       Stable machine identifier (matches directory name).
 * @property {string} label      Human-readable name for the UI.
 * @property {string} hint       One-line UI subtitle.
 * @property {number} version    Skill revision.
 * @property {string} body       The prompt guidance loaded from SKILL.md body.
 */

const REQUIRED_FIELDS = ["name", "label", "hint", "version"];

/**
 * Loads all skills from disk. Call once at module init; results are cached.
 *
 * Skills live in `<rootDir>/<skill-name>/SKILL.md` where `<skill-name>` must
 * equal the `name:` field in the frontmatter. We validate this invariant so
 * directory and manifest never drift.
 *
 * @param {string} rootDir  Absolute path to the skills directory.
 * @returns {Map<string, Skill>}
 */
export function loadSkillsFromDir(rootDir) {
  /** @type {Map<string, Skill>} */
  const byName = new Map();

  let entries;
  try {
    entries = readdirSync(rootDir);
  } catch (err) {
    throw new Error(`Failed to read skills directory ${rootDir}: ${err.message}`);
  }

  for (const entry of entries) {
    const dir = join(rootDir, entry);
    let stat;
    try {
      stat = statSync(dir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;

    const filePath = join(dir, "SKILL.md");
    let source;
    try {
      source = readFileSync(filePath, "utf8");
    } catch {
      // Directory without SKILL.md is silently skipped (allows scratch folders).
      continue;
    }

    const { frontmatter, body } = parseSkillMd(source, { file: filePath });

    for (const field of REQUIRED_FIELDS) {
      if (frontmatter[field] === undefined || frontmatter[field] === "") {
        throw new SkillParseError(
          `missing required frontmatter field "${field}"`,
          { file: filePath }
        );
      }
    }
    if (frontmatter.name !== entry) {
      throw new SkillParseError(
        `frontmatter name "${frontmatter.name}" must match directory name "${entry}"`,
        { file: filePath }
      );
    }

    // Skills with `hidden: true` in frontmatter are validated but not exposed.
    // Use this to retire a skill without deleting its directory (handy for
    // rollback, auditing, or when filesystem deletion isn't available).
    if (frontmatter.hidden === true) continue;

    const skill = {
      name: String(frontmatter.name),
      label: String(frontmatter.label),
      hint: String(frontmatter.hint),
      version: Number(frontmatter.version),
      body,
    };
    byName.set(skill.name, skill);
  }

  if (byName.size === 0) {
    throw new Error(`No skills found in ${rootDir}`);
  }
  return byName;
}

/**
 * Module-level singleton built lazily on first access.
 * @type {Map<string, Skill> | null}
 */
let _registry = null;

export function getSkillRegistry() {
  if (_registry) return _registry;
  const rootDir = join(process.cwd(), "skills");
  _registry = loadSkillsFromDir(rootDir);
  return _registry;
}

export function listSkills() {
  return Array.from(getSkillRegistry().values());
}

export function getSkill(name) {
  return getSkillRegistry().get(name) || null;
}

export function hasSkill(name) {
  return getSkillRegistry().has(name);
}

/** Test-only — lets tests inject a fixture directory. */
export function _resetForTests() {
  _registry = null;
}
