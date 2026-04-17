import { describe, it, expect } from "vitest";
import { parseSkillMd, SkillParseError } from "../lib/skills/parser.js";

describe("parseSkillMd", () => {
  it("parses frontmatter and body", () => {
    const src = [
      "---",
      "name: documentary",
      "label: Documentary",
      "version: 1",
      "hint: Narrator-led",
      "---",
      "",
      "This is the body.",
      "",
      "Second paragraph.",
    ].join("\n");
    const { frontmatter, body } = parseSkillMd(src);
    expect(frontmatter).toEqual({
      name: "documentary",
      label: "Documentary",
      version: 1,
      hint: "Narrator-led",
    });
    expect(body).toBe("This is the body.\n\nSecond paragraph.");
  });

  it("coerces booleans", () => {
    const src = [
      "---",
      "name: x",
      "enabled: true",
      "hidden: false",
      "---",
      "body here",
    ].join("\n");
    const { frontmatter } = parseSkillMd(src);
    expect(frontmatter.enabled).toBe(true);
    expect(frontmatter.hidden).toBe(false);
  });

  it("strips surrounding quotes", () => {
    const src = `---\nname: "quoted name"\n---\nbody`;
    const { frontmatter } = parseSkillMd(src);
    expect(frontmatter.name).toBe("quoted name");
  });

  it("throws when frontmatter fence is missing", () => {
    expect(() => parseSkillMd("no fence here")).toThrow(SkillParseError);
  });

  it("throws when body is empty", () => {
    const src = "---\nname: x\n---\n";
    expect(() => parseSkillMd(src)).toThrow(SkillParseError);
  });

  it("throws on malformed frontmatter line", () => {
    const src = "---\nname documentary\n---\nbody";
    expect(() => parseSkillMd(src)).toThrow(SkillParseError);
  });
});
