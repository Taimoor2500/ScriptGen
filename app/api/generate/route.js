import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60; // allow up to 60s on Vercel for longer scripts

// Approx 150 words per spoken minute for video narration.
const LENGTH_MAP = {
  1: { words: 150, sections: 2 },
  3: { words: 450, sections: 3 },
  5: { words: 750, sections: 4 },
  10: { words: 1500, sections: 5 },
};

const TONE_GUIDE = {
  dramatic:
    "Dramatic and cinematic. Use vivid imagery, emotional stakes, rising tension, and punchy sentence rhythm. Think documentary-style narration with a pulse. Lean into foreshadowing and evocative verbs. Avoid melodrama.",
  neutral:
    "Neutral, informative, and balanced — like a well-crafted explainer. Clear, even-toned narration that respects the viewer's intelligence. No sensationalism. Prioritize clarity and accuracy over flourish.",
  uplifting:
    "Uplifting, hopeful, and energizing. Warm voice, forward momentum, human-centered language. Celebrate ingenuity, resilience, and possibility. Avoid saccharine or cliché phrasing.",
};

function systemPrompt({ tone, minutes, targetWords, sections }) {
  const toneGuide = TONE_GUIDE[tone] || TONE_GUIDE.neutral;
  return [
    "You are ScriptGen, an expert video scriptwriter.",
    "Your job is to write a ready-to-record voiceover script that a creator can read straight into a mic.",
    "",
    `TARGET LENGTH: A ${minutes}-minute video, which is approximately ${targetWords} spoken words at ~150 wpm. Hit that word count within ±10%. Do not pad; do not cut short.`,
    "",
    `TONE: ${toneGuide}`,
    "",
    "STRUCTURE RULES:",
    `- Start with a strong HOOK (1–2 sentences) that earns the viewer's next 10 seconds.`,
    `- Use ${sections} clearly marked sections with short bolded section headings written as **Heading** on their own line.`,
    "- End with a memorable CLOSER that gives the viewer a takeaway, question, or call to reflect.",
    "- Write for the ear, not the page: short sentences, active voice, concrete nouns. Avoid corporate filler.",
    "- No stage directions, no bracketed visual cues, no timestamps — just the spoken words.",
    "- No preamble like 'Here's your script'. Start directly with the hook.",
    "",
    "OUTPUT FORMAT:",
    "Plain text only. Use blank lines between paragraphs. Section headings appear as **Heading** on their own line followed by a blank line.",
  ].join("\n");
}

function userPrompt({ idea, minutes, targetWords }) {
  return [
    `Topic / idea: ${idea}`,
    "",
    `Write the full ${minutes}-minute script now (~${targetWords} words). Remember: open with a hook, use clearly marked section headings, end with a strong closer.`,
  ].join("\n");
}

export async function POST(req) {
  try {
    const { prompt, tone, length } = await req.json();

    // Validation
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Please provide a content idea." },
        { status: 400 }
      );
    }
    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Idea is too long. Please keep it under 2000 characters." },
        { status: 400 }
      );
    }
    if (!["dramatic", "neutral", "uplifting"].includes(tone)) {
      return NextResponse.json({ error: "Invalid tone." }, { status: 400 });
    }
    const minutes = Number(length);
    if (!LENGTH_MAP[minutes]) {
      return NextResponse.json(
        { error: "Invalid length. Choose 1, 3, 5, or 10 minutes." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing ANTHROPIC_API_KEY. Set it in your environment." },
        { status: 500 }
      );
    }

    const { words: targetWords, sections } = LENGTH_MAP[minutes];
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

    const client = new Anthropic({ apiKey });

    // Token budget: ~1.5 tokens per word is plenty of headroom.
    const maxTokens = Math.min(8000, Math.ceil(targetWords * 2.5) + 400);

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature: 0.8,
      system: systemPrompt({ tone, minutes, targetWords, sections }),
      messages: [
        {
          role: "user",
          content: userPrompt({ idea: prompt.trim(), minutes, targetWords }),
        },
      ],
    });

    const script = (response.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!script) {
      return NextResponse.json(
        { error: "Claude returned an empty response. Try again." },
        { status: 502 }
      );
    }

    const wordCount = script.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      script,
      wordCount,
      targetWords,
      minutes,
      tone,
      model,
    });
  } catch (err) {
    console.error("[/api/generate]", err);
    const status = err?.status || 500;
    const message =
      err?.error?.error?.message ||
      err?.message ||
      "Failed to generate script.";
    return NextResponse.json({ error: message }, { status });
  }
}
