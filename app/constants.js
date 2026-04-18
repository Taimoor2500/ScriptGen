// Client-side option catalogs. Tone values must match skills/*/SKILL.md names.
// The server validates against loaded skill folders.

export const TONES = [
  { value: "dramatic", label: "Dramatic", hint: "Cinematic, emotional, high-stakes" },
  { value: "neutral", label: "Neutral", hint: "Informative and balanced" },
  { value: "uplifting", label: "Uplifting", hint: "Hopeful, positive, energetic" },
];

export const LENGTHS = [
  { value: 1, label: "1 min", words: 150 },
  { value: 3, label: "3 min", words: 450 },
  { value: 5, label: "5 min", words: 750 },
  { value: 10, label: "10 min", words: 1500 },
];

export const EXAMPLES = [
  "The life and death of Cleopatra",
  "Why octopuses might be the smartest animals",
  "How the 2008 financial crisis actually happened",
  "A beginner's guide to making sourdough bread",
];

export const DEFAULTS = {
  tone: "dramatic",
  length: 3,
};
