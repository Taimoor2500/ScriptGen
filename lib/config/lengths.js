/**
 * Video-length presets. Word counts assume ~150 spoken words per minute,
 * which is a widely-used baseline for narration pacing.
 */

/**
 * @typedef {Object} LengthPreset
 * @property {number} minutes
 * @property {string} label
 * @property {number} words     Target word count (±10%).
 * @property {number} sections  Suggested number of sections in the script.
 */

/** @type {LengthPreset[]} */
export const LENGTHS = [
  { minutes: 1, label: "1 min", words: 150, sections: 2 },
  { minutes: 3, label: "3 min", words: 450, sections: 3 },
  { minutes: 5, label: "5 min", words: 750, sections: 4 },
  { minutes: 10, label: "10 min", words: 1500, sections: 5 },
];

const BY_MINUTES = new Map(LENGTHS.map((l) => [l.minutes, l]));

export function getLength(minutes) {
  return BY_MINUTES.get(Number(minutes)) || null;
}

export function validLengthMinutes() {
  return LENGTHS.map((l) => l.minutes);
}
