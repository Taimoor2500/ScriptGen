/**
 * Builds the per-request USER message. Everything here varies by request;
 * keeping it out of the system prompt preserves the prompt cache hit rate.
 *
 * @param {Object} p
 * @param {string} p.idea
 * @param {number} p.minutes
 * @param {number} p.targetWords
 * @param {number} p.sections
 * @param {string} p.tone
 * @returns {string}
 */
export function buildUserPrompt({ idea, minutes, targetWords, sections, tone }) {
  return [
    `Topic / idea: ${idea}`,
    `Target length: ${minutes} minute(s) — approximately ${targetWords} spoken words at ~150 wpm.`,
    `tone:${tone}`,
    `Use approximately ${sections} clearly marked sections (unless the chosen tone skill's rules override).`,
    "",
    "Write the full script now. Open with a hook, use clearly marked section headings (**Heading** on its own line) unless the tone skill says otherwise, and end with a strong closer.",
  ].join("\n");
}
