import type { GameConfig, GameInstance, GameResult, GameContext } from "./types";
import { clamp, randInt, randFloat, pick, shuffle, range } from "./utils";

export abstract class BaseGame implements GameInstance {
  protected config: GameConfig;
  protected elapsed = 0;
  protected phaseElapsed = 0;
  protected started = false;
  protected destroyed = false;
  protected result: GameResult | null = null;
  protected rng: () => number;

  constructor(config: GameConfig) {
    this.config = config;
    this.rng = Math.random;
  }

  init(): void {
    this.elapsed = 0;
    this.phaseElapsed = 0;
    this.started = false;
    this.destroyed = false;
    this.result = null;
    this.onInit();
  }

  start(): void {
    this.started = true;
    this.onStart();
  }

  update(dt: number, elapsed: number): void {
    this.elapsed = elapsed;
    this.phaseElapsed += dt;
    this.onUpdate(dt, elapsed);
  }

  render(ctx: GameContext): void {
    this.onRender(ctx);
  }

  handleInput(x: number, y: number): void {
    this.onInput(x, y);
  }

  getResult(): GameResult {
    if (this.result) return this.result;
    return { correct: false, score: 0, maxScore: 1, answerLabel: "N/A" };
  }

  destroy(): void {
    this.destroyed = true;
    this.onDestroy();
  }

  protected setResult(result: GameResult): void {
    this.result = result;
  }

  protected abstract onInit(): void;
  protected abstract onStart(): void;
  protected abstract onUpdate(dt: number, elapsed: number): void;
  protected abstract onRender(ctx: GameContext): void;
  protected onInput(x: number, y: number): void { void x; void y; }
  protected onDestroy(): void {}

  protected randInt(min: number, max: number): number {
    return randInt(min, max);
  }
  protected randFloat(min: number, max: number): number {
    return randFloat(min, max);
  }
  protected pick<T>(arr: T[]): T {
    return pick(arr);
  }
  protected shuffle<T>(arr: T[]): T[] {
    return shuffle(arr);
  }
  protected range(n: number): number[] {
    return range(n);
  }
  protected clamp(v: number, min: number, max: number): number {
    return clamp(v, min, max);
  }
}
