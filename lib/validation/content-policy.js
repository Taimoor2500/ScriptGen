import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";
import { ValidationError } from "../errors.js";

/**
 * Phrases where a substring might look like a blocked word but the idea is
 * legitimate (education, place names, etc.). Matched spans skip blacklist hits.
 */
const PHRASE_WHITELIST = [

  "middlesex",
  "sussex",
  "essex",
];

function createMatcher() {
  const built = englishDataset.build();
  return new RegExpMatcher({
    ...built,
    whitelistedTerms: [...(built.whitelistedTerms ?? []), ...PHRASE_WHITELIST],
    ...englishRecommendedTransformers,
  });
}

const matcher = createMatcher();

/**
 * Blocks profanity, slurs, and common abusive terms (English `cuss`-based
 * dataset via obscenity). Throws ValidationError with code `content_policy`.
 *
 * @param {string} prompt  Already trimmed / schema-validated.
 */
export function assertPromptContentAllowed(prompt) {
  if (matcher.hasMatch(prompt)) {
    throw new ValidationError(
      "That kind of language isn't allowed. Please rephrase your idea.",
      "content_policy"
    );
  }
}
