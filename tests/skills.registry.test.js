import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSkillsFromDir } from "../lib/skills/registry.js";
import { SkillParseError } from "../lib/skills/parser.js";

let tmpRoot;

function writeSkill(dir, name, extra = {}) {
  const skillDir = join(dir, name);
  mkdirSync(skillDir, { recursive: true });
  const frontmatter = {
    name,
    label: extra.label ?? name,
    hint: extra.hint ?? "a hint",
    version: extra.version ?? 1,
    ...extra,
  };
  const frontmatterLines = Object.entries(frontmatter).map(
    ([k, v]) => `${k}: ${v}`
  );
  const body = extra.body ?? "body content.";
  const src = ["---", ...frontmatterLines, "---", "", body].join("\n");
  writeFileSync(join(skillDir, "SKILL.md"), src);
}

describe("loadSkillsFromDir", () => {
  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), "skillreg-"));
  });
  afterEach(() => {
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("loads multiple skills", () => {
    writeSkill(tmpRoot, "alpha");
    writeSkill(tmpRoot, "beta", { label: "Beta!", version: 2 });
    const reg = loadSkillsFromDir(tmpRoot);
    expect(reg.size).toBe(2);
    expect(reg.get("alpha").label).toBe("alpha");
    expect(reg.get("beta").version).toBe(2);
    expect(reg.get("beta").label).toBe("Beta!");
  });

  it("throws if directory name and frontmatter name disagree", () => {
    const dir = join(tmpRoot, "alpha");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "SKILL.md"),
      "---\nname: bogus\nlabel: x\nhint: x\nversion: 1\n---\nbody"
    );
    expect(() => loadSkillsFromDir(tmpRoot)).toThrow(SkillParseError);
  });

  it("throws on missing required field", () => {
    const dir = join(tmpRoot, "alpha");
    mkdirSync(dir, { recursive: true });
    // missing hint
    writeFileSync(
      join(dir, "SKILL.md"),
      "---\nname: alpha\nlabel: A\nversion: 1\n---\nbody"
    );
    expect(() => loadSkillsFromDir(tmpRoot)).toThrow(SkillParseError);
  });

  it("skips directories without SKILL.md", () => {
    mkdirSync(join(tmpRoot, "scratch"), { recursive: true });
    writeSkill(tmpRoot, "alpha");
    const reg = loadSkillsFromDir(tmpRoot);
    expect(reg.size).toBe(1);
    expect(reg.has("alpha")).toBe(true);
    expect(reg.has("scratch")).toBe(false);
  });

  it("throws when no skills are found", () => {
    expect(() => loadSkillsFromDir(tmpRoot)).toThrow(/No skills found/);
  });
});
