import { z } from "zod";
import { validToneNames } from "../config/tones.js";
import { validLengthMinutes } from "../config/lengths.js";
import { ValidationError } from "../errors.js";

/**
 * Request schema for POST /api/generate. Kept thin and focused — any
 * cross-field validation that depends on runtime-loaded data (like the
 * skill registry) gets composed in `buildGenerateRequestSchema`.
 */
export function buildGenerateRequestSchema() {
  const tones = validToneNames();
  const lengths = validLengthMinutes();

  return z.object({
    prompt: z
      .string({ required_error: "Please provide a content idea." })
      .trim()
      .min(1, "Please provide a content idea.")
      .max(2000, "Idea is too long. Please keep it under 2000 characters."),
    tone: z
      .string()
      .refine((v) => tones.includes(v), { message: "Invalid tone." }),
    length: z
      .union([z.number(), z.string()])
      .transform((v) => Number(v))
      .refine(
        (n) => lengths.includes(n),
        { message: `Invalid length. Choose ${lengths.join(", ")} minutes.` }
      ),
  });
}

/**
 * Parses and validates a request body. Throws ValidationError with the first
 * error message on failure — the HTTP adapter maps that to a 400 response.
 *
 * @param {unknown} body
 */
export function parseGenerateRequest(body) {
  const schema = buildGenerateRequestSchema();
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.errors[0];
    throw new ValidationError(first?.message || "Invalid request.");
  }
  return result.data;
}
