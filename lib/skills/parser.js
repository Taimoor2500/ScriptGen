/**
 * Tiny, zero-dependency YAML-frontmatter parser for SKILL.md files.
 *
 * Accepts the leading block delimited by `---` lines at the top of the file.
 * Supported frontmatter value types: strings, numbers, booleans (true/false).
 * Nested maps/lists are intentionally unsupported — SKILL.md frontmatter
 * should stay flat. Throws SkillParseError on malformed input.
 */

export class SkillParseError extends Error {
  constructor(message, { file } = {}) {
    super(file ? `${file}: ${message}` : message);
    this.name = "SkillParseError";
    this.file = file;
  }
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * @param {string} source  Full file contents.
 * @param {{ file?: string }} [opts]
 * @returns {{ frontmatter: Record<string, string|number|boolean>, body: string }}
 */
export function parseSkillMd(source, opts = {}) {
  const { file } = opts;
  const match = source.match(FRONTMATTER_RE);
  if (!match) {
    throw new SkillParseError(
      "missing frontmatter block — expected `---` fence at top of file",
      { file }
    );
  }

  const [, rawFrontmatter, rawBody] = match;
  const frontmatter = parseFrontmatterBlock(rawFrontmatter, file);
  const body = rawBody.trim();

  if (!body) {
    throw new SkillParseError("body is empty", { file });
  }
  return { frontmatter, body };
}

function parseFrontmatterBlock(raw, file) {
  /** @type {Record<string, string|number|boolean>} */
  const out = {};
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // skip blank lines and comments
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) {
      throw new SkillParseError(
        `malformed frontmatter line (${i + 1}): "${line}"`,
        { file }
      );
    }
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (!key) {
      throw new SkillParseError(
        `empty key on line ${i + 1}: "${line}"`,
        { file }
      );
    }
    // strip inline comments starting with ` #`
    const commentIdx = value.indexOf(" #");
    if (commentIdx !== -1) value = value.slice(0, commentIdx).trim();
    // strip matching quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = coerce(value);
  }
  return out;
}

function coerce(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !isNaN(Number(value))) return Number(value);
  return value;
}
