# ScriptGen

Generate ready-to-record video scripts from a single idea. Pick a **tone** (voice style from disk-backed skills) and a target length — Claude writes a tight, hook-first script scaled to that length.

Built with Next.js (App Router) + Tailwind CSS + the Anthropic SDK. Tone skills load from disk at boot; adding a new tone is dropping a folder with a `SKILL.md` and matching it in `app/constants.js`.

---

## Architecture

```
app/
  api/generate/route.js      ← thin HTTP adapter (~80 lines)
  components/                ← Header, IdeaInput, OptionGrid, ScriptCard, …
  hooks/useScriptGenerator.js
  page.js                    ← thin orchestrator
lib/
  skills/                    ← parser.js, registry.js
  config/                    ← lengths.js, tones.js
  validation/                ← zod request schema
  prompt/                    ← system.js, user.js
  anthropic/                 ← client.js (singleton), generate.js (domain)
  rate-limit/                ← in-memory (swappable for Redis)
  errors.js                  ← typed AppError hierarchy
  logger.js                  ← structured JSON logs
skills/                      ← tone skills (one folder per tone)
  dramatic/SKILL.md
  neutral/SKILL.md
  uplifting/SKILL.md
tests/                       ← vitest unit tests
```

**Design choices:**

- **Tone skills on disk.** Each tone is a folder with YAML frontmatter (`name`, `label`, `hint`, `version`) plus a prompt body. Loaded once at boot, validated (directory name must match frontmatter `name`), cached in a module-level singleton.
- **Prompt caching.** The stable system prompt enumerates every tone skill; the chosen tone is passed in the user message only. That keeps the cache key stable, so Anthropic's `cache_control: ephemeral` delivers ~90% input-token savings on cache hits.
- **Model tiering.** 1 & 3 min scripts → `claude-haiku-4-5`. 5 & 10 min → `claude-sonnet-4-5`. Force one model via `ANTHROPIC_MODEL`.
- **Typed errors.** `ValidationError` → 400, `RateLimitError` → 429 with `Retry-After`, `ConfigError` → 500, `UpstreamError` → 502. The HTTP adapter is the only thing that knows about status codes.
- **Per-request correlation.** Every request gets a UUID that's echoed in the response header (`X-Request-Id`) and tagged onto every log line from that request.
- **Pluggable rate limiter.** In-memory today; the public interface (`check`, `enforce`) is identical to what a Redis implementation would expose, so you swap the module and move on.

---

## Run it locally

Requires Node 18.17+.

```bash
npm install
cp .env.local.example .env.local         # then paste your Anthropic key
npm run dev                              # http://localhost:3000
```

Run the tests:

```bash
npm test
```

---

## Deploy to Vercel (free)

Vercel's Hobby tier is free and works perfectly for this app.

### Option A — one-click deploy

1. Push this repo to your GitHub account:

   ```bash
   git add .
   git commit -m "Production-grade ScriptGen"
   git push -u origin main
   ```
2. Import at [vercel.com/new](https://vercel.com/new), paste your `ANTHROPIC_API_KEY`, click Deploy.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTaimoor2500%2FScriptGen&env=ANTHROPIC_API_KEY&envDescription=Your%20Anthropic%20API%20key%20(keep%20it%20secret).&envLink=https%3A%2F%2Fconsole.anthropic.com%2F&project-name=scriptgen&repository-name=scriptgen)

---

## Adding a new tone skill

Drop a folder in `skills/` with a `SKILL.md` that looks like:

```markdown
---
name: explainer
label: Explainer
hint: Short, teachable moments
version: 1
---

Your prompt guidance here. Keep it under 30 lines. Use bullet-free prose.
Describe voice, pacing, what to open on, what to avoid.
```

Then add the matching entry to `app/constants.js` (`TONES`) so the UI shows it. The server registry picks it up on the next boot, validation follows the loaded skills, and the system prompt rebuilds to include it.

---

## Configuration

| Variable                | Required | Default                                     | Purpose                                 |
| ----------------------- | -------- | ------------------------------------------- | --------------------------------------- |
| `ANTHROPIC_API_KEY`     | Yes      | —                                           | Your Anthropic API key                  |
| `ANTHROPIC_MODEL`       | No       | Haiku for 1–3 min, Sonnet for 5–10 min      | Force a specific model                  |
| `RATE_LIMIT_MAX`        | No       | `10`                                        | Max requests per IP per window          |
| `RATE_LIMIT_WINDOW_MS`  | No       | `3600000` (1h)                              | Rate-limit window in ms                 |
| `LOG_LEVEL`             | No       | `info`                                      | `debug` / `info` / `warn` / `error`     |

---

## License

MIT.
