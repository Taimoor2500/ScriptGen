# ScriptGen

A minimal web app that turns a content idea into a ready-to-record video script.

- Pick an idea (e.g. _"The life and death of Cleopatra"_)
- Choose a tone: **Dramatic**, **Neutral**, or **Uplifting**
- Choose a target length: **1, 3, 5, or 10 minutes**
- Claude writes a tight, hook-first script scaled to that length

Built with Next.js (App Router) + Tailwind CSS + the Anthropic SDK. Your API key stays server-side.

---

## Run it locally

**Requirements:** Node 18.17+ and an Anthropic API key ([get one here](https://console.anthropic.com/)).

```bash
# 1. Install dependencies
npm install

# 2. Add your API key
cp .env.local.example .env.local
# then edit .env.local and paste your key

# 3. Start the dev server
npm run dev
```

Open http://localhost:3000 and generate away.

---

## Deploy to Vercel (free)

Vercel's Hobby tier is free and works perfectly for this app.

### Option A — one-click deploy

1. Push this repo to your GitHub account (it's already linked to `Taimoor2500/ScriptGen`):

   ```bash
   git add .
   git commit -m "Initial ScriptGen app"
   git push -u origin main
   ```

2. Click the button below (or go to [vercel.com/new](https://vercel.com/new) and import the repo):

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTaimoor2500%2FScriptGen&env=ANTHROPIC_API_KEY&envDescription=Your%20Anthropic%20API%20key%20(keep%20it%20secret).&envLink=https%3A%2F%2Fconsole.anthropic.com%2F&project-name=scriptgen&repository-name=scriptgen)

3. When prompted, paste your `ANTHROPIC_API_KEY` as an environment variable and click **Deploy**. About 60 seconds later you'll have a public URL like `https://scriptgen-xxxx.vercel.app`.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel            # first deploy (follow the prompts)
vercel env add ANTHROPIC_API_KEY   # set the key for Production
vercel --prod     # publish to production
```

That's it — the URL Vercel prints is the one to test.

---

## How it works

```
app/
├── page.js                 # The UI (client component)
├── layout.js               # Root layout + global styles
├── globals.css             # Tailwind + a little polish
└── api/
    └── generate/
        └── route.js        # Serverless POST endpoint that calls Claude
```

The frontend collects `{ prompt, tone, length }`, POSTs it to `/api/generate`, and renders the returned script.

The server route builds a length- and tone-aware system prompt, sends one `messages.create` call to Claude (default model: `claude-sonnet-4-5`), and returns the generated script along with a word count. The target word count scales with the chosen length (≈150 spoken words per minute).

---

## Configuration

| Variable             | Required | Default               | Purpose                                 |
| -------------------- | -------- | --------------------- | --------------------------------------- |
| `ANTHROPIC_API_KEY`  | Yes      | —                     | Your Anthropic API key                  |
| `ANTHROPIC_MODEL`    | No       | `claude-sonnet-4-5`   | Override the Claude model if you want   |

---

## Common issues

- **"Server is missing ANTHROPIC_API_KEY"** — you forgot to set the env var. Set it in `.env.local` locally or in Vercel → Project Settings → Environment Variables.
- **401 from Anthropic** — your API key is invalid or expired.
- **529 / rate-limited** — try again in a moment, or switch to a lower-traffic model.

---

## License

MIT.
