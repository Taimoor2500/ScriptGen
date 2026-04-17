import { describe, it, expect } from "vitest";
import { buildStableSystemPrompt } from "../lib/prompt/system.js";
import { buildUserPrompt } from "../lib/prompt/user.js";
import { listSkills } from "../lib/skills/registry.js";

describe("buildStableSystemPrompt", () => {
  it("includes every tone skill body", () => {
    const prompt = buildStableSystemPrompt();
    for (const s of listSkills()) {
      expect(prompt).toContain(`tone:${s.name}`);
      expect(prompt).toContain(s.body.split("\n")[0]); // first line at least
    }
  });

  it("includes all tone names", () => {
    const prompt = buildStableSystemPrompt();
    for (const t of ["dramatic", "neutral", "uplifting"]) {
      expect(prompt).toContain(`tone:${t}`);
    }
  });

  it("is deterministic across calls (required for prompt caching)", () => {
    expect(buildStableSystemPrompt()).toBe(buildStableSystemPrompt());
  });
});

describe("buildUserPrompt", () => {
  it("renders all fields", () => {
    const text = buildUserPrompt({
      idea: "Cleopatra",
      minutes: 3,
      targetWords: 450,
      sections: 3,
      tone: "dramatic",
    });
    expect(text).toContain("Cleopatra");
    expect(text).toContain("tone:dramatic");
    expect(text).toContain("450 spoken words");
    expect(text).not.toContain("skill:");
  });
});
