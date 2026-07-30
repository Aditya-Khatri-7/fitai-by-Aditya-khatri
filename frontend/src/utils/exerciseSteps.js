// Splits a real exercise description (from megaGymDataset, via the ML recommender's
// `desc` field mapped to `instructions`) into readable steps by sentence — the source
// data is prose, not a numbered list, so this is a formatting pass over real content
// rather than fabricated instructions.
export function toSteps(desc) {
  if (!desc) return [];
  return desc
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}
