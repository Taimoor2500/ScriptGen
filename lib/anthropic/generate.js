import { getAnthropicClient } from "./client.js";
import { buildStableSystemPrompt } from "../prompt/system.js";
import { buildUserPrompt } from "../prompt/user.js";
import { getLength } from "../config/lengths.js";
import { getSkill } from "../skills/registry.js";
import { UpstreamError } from "../errors.js";
import { logger } from "../logger.js";

/**
 * Selects a model based on target video length. Short scripts don't need
 * Sonnet's ceiling; sending them to Haiku drops per-request cost ~5×.
 * Set ANTHROPIC_MODEL to force a single model for all requests.
 *
 * @param {number} minutes
 * @returns {string}
 */
export function selectModel(minutes) {
  const forced = process.env.ANTHROPIC_MODEL;
  if (forced) return forced;
  return minutes <= 3 ? "claude-haiku-4-5" : "claude-sonnet-4-5";
}

/**
 * Generates a single video script. Pure domain logic — no HTTP, no req/res.
 *
 * @param {Object} p
 * @param {string} p.prompt
 * @param {string} p.tone       Must match a tone skill under /skills (e.g. dramatic).
 * @param {number} p.length   minutes
 * @param {{ requestId?: string }} [ctx]
 * @returns {Promise<{
 *   script: string,
 *   wordCount: number,
 *   targetWords: number,
 *   minutes: number,
 *   tone: string,
 *   model: string,
 *   usage: { input: number|null, output: number|null, cacheRead: number, cacheWrite: number },
 * }>}
 */
export async function generateScript({ prompt, tone, length }, ctx = {}) {
  const lengthCfg = getLength(length);
  // Validation already guarantees lengthCfg exists; defensive assert.
  if (!lengthCfg) throw new Error(`Unknown length: ${length}`);
  const skillObj = getSkill(tone);
  if (!skillObj) throw new Error(`Unknown tone skill: ${tone}`);

  const { words: targetWords, sections, minutes } = lengthCfg;
  const model = selectModel(minutes);
  const log = logger.child({ request_id: ctx.requestId, model, tone, minutes });

  const systemText = buildStableSystemPrompt();
  const userText = buildUserPrompt({
    idea: prompt.trim(),
    minutes,
    targetWords,
    sections,
    tone,
  });

  // ~2.5 output tokens per target word, plus headroom for headings/markdown.
  const maxTokens = Math.min(8000, Math.ceil(targetWords * 2.5) + 400);

  log.info("anthropic.request", { max_tokens: maxTokens });

  const client = getAnthropicClient();
  let response;
  try {
    response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature: 0.8,
      // Block-form system prompt with cache_control so Anthropic caches the
      // stable prefix (~5 min TTL). Cache hits cost ~10% of normal input tokens.
      system: [
        {
          type: "text",
          text: systemText,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userText }],
    });
  } catch (err) {
    log.error("anthropic.failed", { status: err?.status, msg: err?.message });
    // Map SDK errors to our typed error.
    const status = err?.status || 502;
    const message =
      err?.error?.error?.message ||
      err?.message ||
      "Failed to generate script.";
    throw new UpstreamError(message, status);
  }

  const script = (response.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!script) {
    throw new UpstreamError("Claude returned an empty response. Try again.");
  }

  const wordCount = script.split(/\s+/).filter(Boolean).length;
  const usage = response.usage || {};

  log.info("anthropic.ok", {
    word_count: wordCount,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cache_read: usage.cache_read_input_tokens,
    cache_write: usage.cache_creation_input_tokens,
  });

  return {
    script,
    wordCount,
    targetWords,
    minutes,
    tone,
    model,
    usage: {
      input: usage.input_tokens ?? null,
      output: usage.output_tokens ?? null,
      cacheRead: usage.cache_read_input_tokens ?? 0,
      cacheWrite: usage.cache_creation_input_tokens ?? 0,
    },
  };
}
