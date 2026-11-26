export type GameCategory = "memory" | "visual" | "reaction" | "logic";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type GamePhase =
  | "idle"
  | "hook"
  | "instructions"
  | "preview"
  | "playing"
  | "thinking"
  | "reveal"
  | "ending"
  | "complete";

export interface DifficultyConfig {
  label: string;
  description: string;
}

export interface GameConfig {
  difficulty: Difficulty;
  duration: number;
  cupCount?: number;
  shuffleCount?: number;
  shuffleSpeed?: number;
  revealTime?: number;
  thinkTime?: number;
  gridSize?: number;
  sequenceLength?: number;
  targetCount?: number;
}

export interface GameResult {
  correct: boolean;
  score: number;
  maxScore: number;
  answerLabel: string;
  userAnswer?: string;
  details?: Record<string, string | number>;
}

export interface VideoTimingConfig {
  hookText: string;
  hookDuration: number;
  instructionsText: string;
  instructionsDuration: number;
  gameplayDuration: number;
  thinkDuration: number;
  revealDuration: number;
  endingText: string;
  endingDuration: number;
  showScore: boolean;
  backgroundMusic: boolean;
}

export interface GameContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  timestamp: number;
  phase: GamePhase;
  difficulty: Difficulty;
  config: GameConfig;
  audio: AudioEngineInterface;
}

export interface AudioEngineInterface {
  playSound(type: SoundType, volume?: number): void;
  setMasterVolume(v: number): void;
  setSfxVolume(v: number): void;
  setMusicVolume(v: number): void;
  setMuted(m: boolean): void;
  startMusic(): void;
  stopMusic(): void;
}

export type SoundType =
  | "click"
  | "correct"
  | "wrong"
  | "tick"
  | "countdown"
  | "reveal"
  | "victory"
  | "shuffle"
  | "pop"
  | "whoosh"
  | "suspense"
  | "start"
  | "end";

export interface BrainGame {
  id: string;
  name: string;
  category: GameCategory;
  description: string;
  icon: string;
  difficultyConfigs: Record<Difficulty, DifficultyConfig>;
  defaultTiming: Partial<VideoTimingConfig>;
  hookTexts: string[];
  instructionsText: string;
  endingTexts: string[];

  createInstance(config: GameConfig): GameInstance;
}

export interface GameInstance {
  init(): void;
  start(): void;
  update(dt: number, elapsed: number): void;
  render(ctx: GameContext): void;
  handleInput(x: number, y: number): void;
  getResult(): GameResult;
  destroy(): void;
}

export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard", "expert"];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
};

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  memory: "Memory",
  visual: "Visual Attention",
  reaction: "Reaction",
  logic: "Logic",
};

export const CATEGORY_COLORS: Record<GameCategory, string> = {
  memory: "oklch(0.72 0.18 200)",
  visual: "oklch(0.75 0.22 60)",
  reaction: "oklch(0.65 0.22 25)",
  logic: "oklch(0.55 0.2 160)",
};
