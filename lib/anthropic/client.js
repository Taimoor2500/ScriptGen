import Anthropic from "@anthropic-ai/sdk";
import { ConfigError } from "../errors.js";

/** @type {Anthropic | null} */
let _client = null;

/**
 * Returns a lazily-initialized singleton Anthropic client. Throws a ConfigError
 * if the API key is missing — callers should let this propagate so the HTTP
 * adapter returns a clean 500.
 */
export function getAnthropicClient() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ConfigError(
      "Server is missing ANTHROPIC_API_KEY. Set it in your environment.",
      "missing_api_key"
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

/** Test-only reset. */
export function _resetForTests() {
  _client = null;
}
