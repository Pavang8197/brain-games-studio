import type { BrainGame, Difficulty, DifficultyConfig, GameCategory } from "./types";

export function makeDifficultyConfigs(
  base: Record<Difficulty, { label: string; description: string }>
): Record<Difficulty, DifficultyConfig> {
  return base;
}

export function categoryColor(cat: GameCategory): string {
  const colors: Record<GameCategory, string> = {
    memory: "#22d3ee",
    visual: "#fbbf24",
    reaction: "#ef4444",
    logic: "#22c55e",
  };
  return colors[cat];
}

export const HOOK_TEMPLATES = {
  memory: [
    "Only 1% Can Remember This!",
    "Can You Track It?",
    "Don't Blink!",
    "Memory Master Challenge!",
  ],
  visual: [
    "Can You Spot It?",
    "Find the Odd One!",
    "You Have 5 Seconds!",
    "Eagle Eye Test!",
  ],
  reaction: [
    "How Fast Are You?",
    "Don't Tap Red!",
    "React in Time!",
    "Speed Challenge!",
  ],
  logic: [
    "Only Geniuses Solve This!",
    "Can You Find the Pattern?",
    "Think Fast!",
    "Logic Master Challenge!",
  ],
};
