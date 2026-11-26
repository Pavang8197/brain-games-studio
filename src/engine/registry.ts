import type { BrainGame, Difficulty, GameCategory, GameConfig, VideoTimingConfig } from "./types";
import { DIFFICULTY_ORDER } from "./types";
import { FindTheBallGame } from "./games/find-the-ball";
import { MemoryMatrixGame } from "./games/memory-matrix";
import { SequenceMemoryGame } from "./games/sequence-memory";
import { OddOneOutGame } from "./games/odd-one-out";
import { SchulteGridGame } from "./games/schulte-grid";
import { StroopGame } from "./games/stroop";
import { ReactionTimeGame } from "./games/reaction-time";
import { NumberPatternGame } from "./games/number-pattern";
import { Game2048 } from "./games/game-2048";

export const GAMES: BrainGame[] = [
  {
    id: "find-the-ball",
    name: "Find the Ball",
    category: "memory" as GameCategory,
    description: "Follow the cup shuffles and find where the ball is hidden.",
    icon: "CupSoda",
    difficultyConfigs: {
      easy: { label: "3 Cups", description: "3 cups, 5 shuffles" },
      medium: { label: "4 Cups", description: "4 cups, 8 shuffles" },
      hard: { label: "5 Cups", description: "5 cups, 12 shuffles" },
      expert: { label: "6 Cups", description: "6 cups, 18 shuffles" },
    },
    defaultTiming: {
      hookDuration: 2,
      instructionsDuration: 3,
      gameplayDuration: 10,
      thinkDuration: 3,
      revealDuration: 3,
      endingDuration: 3,
    },
    hookTexts: ["Only 1% Can Track This!", "Follow the Ball!", "Don't Lose It!"],
    instructionsText: "Watch the ball, track the cups!",
    endingTexts: ["Did you get it right?", "Comment your guess!", "Try Level 2!"],
    createInstance(config: GameConfig) {
      const diffMap: Record<Difficulty, { cupCount: number; shuffleCount: number; shuffleSpeed: number }> = {
        easy: { cupCount: 3, shuffleCount: 5, shuffleSpeed: 0.5 },
        medium: { cupCount: 4, shuffleCount: 8, shuffleSpeed: 0.7 },
        hard: { cupCount: 5, shuffleCount: 12, shuffleSpeed: 0.9 },
        expert: { cupCount: 6, shuffleCount: 18, shuffleSpeed: 1.2 },
      };
      const d = diffMap[config.difficulty];
      return new FindTheBallGame({
        ...config,
        cupCount: config.cupCount ?? d.cupCount,
        shuffleCount: config.shuffleCount ?? d.shuffleCount,
        shuffleSpeed: config.shuffleSpeed ?? d.shuffleSpeed,
        revealTime: config.revealTime ?? 2,
        thinkTime: config.thinkTime ?? 3,
      });
    },
  },
  {
    id: "memory-matrix",
    name: "Memory Matrix",
    category: "memory" as GameCategory,
    description: "Memorize the lit cells, then recall them after they disappear.",
    icon: "Grid3x3",
    difficultyConfigs: {
      easy: { label: "3x3", description: "3x3 grid, 4 cells" },
      medium: { label: "4x4", description: "4x4 grid, 6 cells" },
      hard: { label: "5x5", description: "5x5 grid, 8 cells" },
      expert: { label: "6x6", description: "6x6 grid, 12 cells" },
    },
    defaultTiming: {
      hookDuration: 2,
      instructionsDuration: 3,
      gameplayDuration: 12,
      thinkDuration: 2,
      revealDuration: 3,
      endingDuration: 3,
    },
    hookTexts: ["Only 1% Can Remember This!", "Memory Master!"],
    instructionsText: "Memorize the lit cells!",
    endingTexts: ["Did you get it?", "Comment your score!"],
    createInstance(config: GameConfig) {
      const diffMap: Record<Difficulty, { gridSize: number; targetCount: number }> = {
        easy: { gridSize: 3, targetCount: 4 },
        medium: { gridSize: 4, targetCount: 6 },
        hard: { gridSize: 5, targetCount: 8 },
        expert: { gridSize: 6, targetCount: 12 },
      };
      const d = diffMap[config.difficulty];
      return new MemoryMatrixGame({
        ...config,
        gridSize: config.gridSize ?? d.gridSize,
        targetCount: config.targetCount ?? d.targetCount,
      });
    },
  },
  {
    id: "sequence-memory",
    name: "Sequence Memory",
    category: "memory" as GameCategory,
    description: "Watch the color sequence light up, then repeat it back in order.",
    icon: "ListOrdered",
    difficultyConfigs: {
      easy: { label: "4 Steps", description: "4-color sequence" },
      medium: { label: "6 Steps", description: "6-color sequence" },
      hard: { label: "8 Steps", description: "8-color sequence" },
      expert: { label: "12 Steps", description: "12-color sequence" },
    },
    defaultTiming: {
      hookDuration: 2,
      instructionsDuration: 3,
      gameplayDuration: 12,
      thinkDuration: 2,
      revealDuration: 4,
      endingDuration: 3,
    },
    hookTexts: ["Can You Repeat It?", "Memory Sequence!"],
    instructionsText: "Watch and repeat the sequence!",
    endingTexts: ["Did you get it?", "Try a longer one!"],
    createInstance(config: GameConfig) {
      const diffMap: Record<Difficulty, { sequenceLength: number }> = {
        easy: { sequenceLength: 4 },
        medium: { sequenceLength: 6 },
        hard: { sequenceLength: 8 },
        expert: { sequenceLength: 12 },
      };
      const d = diffMap[config.difficulty];
      return new SequenceMemoryGame({
        ...config,
        sequenceLength: config.sequenceLength ?? d.sequenceLength,
      });
    },
  },
  {
    id: "odd-one-out",
    name: "Odd One Out",
    category: "visual" as GameCategory,
    description: "Spot the one shape that's slightly different from the rest.",
    icon: "Eye",
    difficultyConfigs: {
      easy: { label: "3x3", description: "9 shapes, easy spot" },
      medium: { label: "4x4", description: "16 shapes, medium" },
      hard: { label: "5x5", description: "25 shapes, hard" },
      expert: { label: "6x6", description: "36 shapes, expert" },
    },
    defaultTiming: {
      hookDuration: 2,
      instructionsDuration: 3,
      gameplayDuration: 6,
      thinkDuration: 2,
      revealDuration: 3,
      endingDuration: 3,
    },
    hookTexts: ["Can You Spot It?", "Find the Odd One!", "Eagle Eye Test!"],
    instructionsText: "Find the shape that's different!",
    endingTexts: ["Did you find it?", "Comment your time!"],
    createInstance(config: GameConfig) {
      const diffMap: Record<Difficulty, { gridSize: number }> = {
        easy: { gridSize: 3 },
        medium: { gridSize: 4 },
        hard: { gridSize: 5 },
        expert: { gridSize: 6 },
      };
      const d = diffMap[config.difficulty];
      return new OddOneOutGame({
        ...config,
        gridSize: config.gridSize ?? d.gridSize,
      });
    },
  },
  {
    id: "schulte-grid",
    name: "Schulte Grid",
    category: "visual" as GameCategory,
    description: "Tap numbers 1 to N in order as fast as you can.",
    icon: "Hash",
    difficultyConfigs: {
      easy: { label: "3x3", description: "1 to 9" },
      medium: { label: "4x4", description: "1 to 16" },
      hard: { label: "5x5", description: "1 to 25" },
      expert: { label: "6x6", description: "1 to 36" },
    },
    defaultTiming: {
      hookDuration: 2,
      instructionsDuration: 3,
      gameplayDuration: 15,
      thinkDuration: 1,
      revealDuration: 3,
      endingDuration: 3,
    },
    hookTexts: ["How Fast Are You?", "Speed Test!", "Find Them All!"],
    instructionsText: "Tap numbers 1 to N in order!",
    endingTexts: ["How fast were you?", "Comment your time!"],
    createInstance(config: GameConfig) {
      const diffMap: Record<Difficulty, { gridSize: number }> = {
        easy: { gridSize: 3 },
        medium: { gridSize: 4 },
        hard: { gridSize: 5 },
        expert: { gridSize: 6 },
      };
      const d = diffMap[config.difficulty];
      return new SchulteGridGame({
        ...config,
        gridSize: config.gridSize ?? d.gridSize,
      });
    },
  },
  {
    id: "stroop",
    name: "Stroop Challenge",
    category: "visual" as GameCategory,
    description: "Tap the color of the word — not what the word says!",
    icon: "Palette",
    difficultyConfigs: {
      easy: { label: "3 Rounds", description: "3 rounds, 10s each" },
      medium: { label: "4 Rounds", description: "4 rounds, 8s each" },
      hard: { label: "5 Rounds", description: "5 rounds, 6s each" },
      expert: { label: "6 Rounds", description: "6 rounds, 5s each" },
    },
    defaultTiming: {
      hookDuration: 2,
      instructionsDuration: 4,
      gameplayDuration: 12,
      thinkDuration: 1,
      revealDuration: 3,
      endingDuration: 3,
    },
    hookTexts: ["Don't Read the Word!", "Color Confusion!", "Brain Twist!"],
    instructionsText: "Tap the COLOR, not the word!",
    endingTexts: ["Did you get it?", "Comment your score!"],
    createInstance(config: GameConfig) {
      return new StroopGame(config);
    },
  },
  {
    id: "reaction-time",
    name: "Reaction Time",
    category: "reaction" as GameCategory,
    description: "Wait for green, then tap as fast as you can. 3 attempts!",
    icon: "Zap",
    difficultyConfigs: {
      easy: { label: "3 Tries", description: "3 attempts, slow waits" },
      medium: { label: "3 Tries", description: "3 attempts, medium" },
      hard: { label: "5 Tries", description: "5 attempts, fast" },
      expert: { label: "5 Tries", description: "5 attempts, very fast" },
    },
    defaultTiming: {
      hookDuration: 2,
      instructionsDuration: 3,
      gameplayDuration: 12,
      thinkDuration: 1,
      revealDuration: 4,
      endingDuration: 3,
    },
    hookTexts: ["How Fast Are You?", "React Now!", "Speed Test!"],
    instructionsText: "Wait for GREEN, then tap!",
    endingTexts: ["How fast are you?", "Comment your time!"],
    createInstance(config: GameConfig) {
      return new ReactionTimeGame(config);
    },
  },
  {
    id: "number-pattern",
    name: "Number Pattern",
    category: "logic" as GameCategory,
    description: "Find the pattern and predict the next number in the sequence.",
    icon: "Sigma",
    difficultyConfigs: {
      easy: { label: "Simple", description: "Basic arithmetic" },
      medium: { label: "Medium", description: "Mixed patterns" },
      hard: { label: "Hard", description: "Complex patterns" },
      expert: { label: "Expert", description: "Advanced patterns" },
    },
    defaultTiming: {
      hookDuration: 2,
      instructionsDuration: 3,
      gameplayDuration: 8,
      thinkDuration: 2,
      revealDuration: 4,
      endingDuration: 3,
    },
    hookTexts: ["Only Geniuses Solve This!", "Find the Pattern!", "What Comes Next?"],
    instructionsText: "Find the next number!",
    endingTexts: ["Did you solve it?", "Comment your answer!"],
    createInstance(config: GameConfig) {
      return new NumberPatternGame(config);
    },
  },
  {
    id: "2048",
    name: "2048 Challenge",
    category: "logic" as GameCategory,
    description: "Merge tiles to reach the target number before time runs out.",
    icon: "Combine",
    difficultyConfigs: {
      easy: { label: "Target 64", description: "Reach 64" },
      medium: { label: "Target 128", description: "Reach 128" },
      hard: { label: "Target 256", description: "Reach 256" },
      expert: { label: "Target 512", description: "Reach 512" },
    },
    defaultTiming: {
      hookDuration: 2,
      instructionsDuration: 3,
      gameplayDuration: 20,
      thinkDuration: 1,
      revealDuration: 4,
      endingDuration: 3,
    },
    hookTexts: ["Can You Reach It?", "Merge to Win!", "2048 Challenge!"],
    instructionsText: "Merge tiles to reach the target!",
    endingTexts: ["Did you reach it?", "Comment your score!"],
    createInstance(config: GameConfig) {
      return new Game2048(config);
    },
  },
];

export function getGameById(id: string): BrainGame | undefined {
  return GAMES.find((g) => g.id === id);
}

export function getGamesByCategory(cat: GameCategory): BrainGame[] {
  return GAMES.filter((g) => g.category === cat);
}

export function getDefaultTiming(game: BrainGame): VideoTimingConfig {
  return {
    hookText: game.hookTexts[0] ?? "Can You Solve This?",
    hookDuration: 2,
    instructionsText: game.instructionsText,
    instructionsDuration: 3,
    gameplayDuration: 10,
    thinkDuration: 3,
    revealDuration: 3,
    endingText: game.endingTexts[0] ?? "Did You Get It Right?",
    endingDuration: 3,
    showScore: false,
    backgroundMusic: true,
    ...game.defaultTiming,
  };
}

export { DIFFICULTY_ORDER };
