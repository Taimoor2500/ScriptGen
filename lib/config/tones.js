import { listSkills } from "../skills/registry.js";

/**
 * Valid tone names match the tone skill folders under /skills (each has SKILL.md).
 */
export function validToneNames() {
  return listSkills().map((s) => s.name);
}
