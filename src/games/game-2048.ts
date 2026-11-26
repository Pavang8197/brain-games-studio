import { BaseGame } from "../engine/base-game";
import type { GameContext } from "../engine/types";
import { drawBackground, drawText, drawCorners, drawProgressBar } from "../engine/render";
import { clamp } from "../engine/utils";

type Phase = "play" | "reveal";

const GRID_SIZE = 4;
type Cell = { value: number; merged: boolean; isNew: boolean };

export class Game2048 extends BaseGame {
  private grid: Cell[][] = [];
  private phase: Phase = "play";
  private phaseTimer = 0;
  private playDuration = 20;
  private score = 0;
  private bestTile = 0;
  private moved = false;
  private animTimer = 0;
  private targetScore = 0;

  protected onInit(): void {
    this.phase = "play";
    this.phaseTimer = 0;
    this.score = 0;
    this.bestTile = 0;
    this.playDuration = this.config.duration ?? 20;
    this.animTimer = 0;

    this.grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push({ value: 0, merged: false, isNew: false });
      }
      this.grid.push(row);
    }
    this.spawnTile();
    this.spawnTile();
    this.targetScore = this.config.difficulty === "easy" ? 64 : this.config.difficulty === "medium" ? 128 : this.config.difficulty === "hard" ? 256 : 512;
  }

  protected onStart(): void {}

  private spawnTile(): void {
    const empty: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r]![c]!.value === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return;
    const [r, c] = this.pick(empty);
    this.grid[r]![c]!.value = Math.random() < 0.9 ? 2 : 4;
    this.grid[r]![c]!.isNew = true;
  }

  private move(dir: "up" | "down" | "left" | "right"): boolean {
    let moved = false;
    for (const row of this.grid) {
      for (const cell of row) {
        cell.merged = false;
        cell.isNew = false;
      }
    }

    const traverse = (cb: (r: number, c: number) => void) => {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          cb(r, c);
        }
      }
    };

    const getLine = (idx: number): Cell[] => {
      const line: Cell[] = [];
      if (dir === "left") for (let c = 0; c < GRID_SIZE; c++) line.push(this.grid[idx]![c]!);
      else if (dir === "right") for (let c = GRID_SIZE - 1; c >= 0; c--) line.push(this.grid[idx]![c]!);
      else if (dir === "up") for (let r = 0; r < GRID_SIZE; r++) line.push(this.grid[r]![idx]!);
      else for (let r = GRID_SIZE - 1; r >= 0; r--) line.push(this.grid[r]![idx]!);
      return line;
    };

    const setCell = (lineIdx: number, pos: number, cell: Cell) => {
      if (dir === "left") this.grid[lineIdx]![pos] = cell;
      else if (dir === "right") this.grid[lineIdx]![GRID_SIZE - 1 - pos] = cell;
      else if (dir === "up") this.grid[pos]![lineIdx] = cell;
      else this.grid[GRID_SIZE - 1 - pos]![lineIdx] = cell;
    };

    for (let i = 0; i < GRID_SIZE; i++) {
      const line = getLine(i);
      const compacted = line.filter((c) => c.value !== 0);
      const result: Cell[] = [];
      for (let j = 0; j < compacted.length; j++) {
        if (j < compacted.length - 1 && compacted[j]!.value === compacted[j + 1]!.value && !compacted[j]!.merged) {
          const newVal = compacted[j]!.value * 2;
          result.push({ value: newVal, merged: true, isNew: false });
          this.score += newVal;
          if (newVal > this.bestTile) this.bestTile = newVal;
          compacted[j + 1]!.merged = true;
          moved = true;
        } else if (!compacted[j]!.merged) {
          result.push(compacted[j]!);
        }
      }
      while (result.length < GRID_SIZE) {
        result.push({ value: 0, merged: false, isNew: false });
      }
      for (let j = 0; j < GRID_SIZE; j++) {
        if (getLine(i)[j]!.value !== result[j]!.value) moved = true;
        setCell(i, j, result[j]!);
      }
    }

    if (moved) {
      this.spawnTile();
      this.animTimer = 0;
    }
    return moved;
  }

  protected onUpdate(dt: number, _elapsed: number): void {
    this.phaseTimer += dt;
    this.animTimer += dt;

    if (this.phase === "play") {
      if (this.phaseTimer >= this.playDuration || this.isGameOver() || this.bestTile >= this.targetScore) {
        this.phase = "reveal";
        this.phaseTimer = 0;
      } else {
        // auto-play: make a random move every 1.5s
        if (Math.floor(this.phaseTimer * 2) % 3 === 0 && this.animTimer > 0.8) {
          const dirs = ["up", "down", "left", "right"] as const;
          const dir = this.pick(dirs);
          this.move(dir);
        }
      }
    }
  }

  private isGameOver(): boolean {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r]![c]!.value === 0) return false;
        if (c < GRID_SIZE - 1 && this.grid[r]![c]!.value === this.grid[r]![c + 1]!.value) return false;
        if (r < GRID_SIZE - 1 && this.grid[r]![c]!.value === this.grid[r + 1]![c]!.value) return false;
      }
    }
    return true;
  }

  protected onRender(ctx: GameContext): void {
    const { ctx: c, width: w, height: h, phase: gp } = ctx;
    drawBackground(c, w, h, this.phaseTimer, "#fbbf24");

    if (gp === "hook") {
      drawText(c, "2048 CHALLENGE", w / 2, h * 0.35, { fontSize: 60, color: "#fbbf24", fontWeight: "900" });
      drawText(c, "Reach the target!", w / 2, h * 0.45, { fontSize: 44, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "instructions") {
      drawText(c, "Merge tiles", w / 2, h * 0.3, { fontSize: 52, color: "#fbbf24", fontWeight: "900" });
      drawText(c, `Reach ${this.targetScore}!`, w / 2, h * 0.4, { fontSize: 48, color: "#fff", fontWeight: "bold" });
      drawText(c, "Combine same numbers", w / 2, h * 0.48, { fontSize: 36, color: "#fff" });
      return;
    }
    if (gp === "ending") {
      drawText(c, `Score: ${this.score}`, w / 2, h * 0.3, { fontSize: 56, color: "#fbbf24", fontWeight: "900" });
      drawText(c, `Best tile: ${this.bestTile}`, w / 2, h * 0.4, { fontSize: 44, color: "#fff" });
      drawText(c, "Can you beat it?", w / 2, h * 0.5, { fontSize: 42, color: "#fff" });
      return;
    }

    if (this.phase === "play") {
      const remaining = Math.max(0, this.playDuration - this.phaseTimer);
      drawText(c, `SCORE: ${this.score}`, w / 2, h * 0.08, { fontSize: 44, color: "#fbbf24", fontWeight: "900" });
      drawText(c, `Target: ${this.targetScore}`, w / 2, h * 0.14, { fontSize: 32, color: "#fff" });
      drawProgressBar(c, w, h * 0.18, remaining / this.playDuration, "#fbbf24");
    }

    this.drawGrid(c, w, h);

    if (this.phase === "reveal" || gp === "reveal") {
      drawText(c, `FINAL SCORE: ${this.score}`, w / 2, h * 0.85, { fontSize: 48, color: "#fbbf24", fontWeight: "900" });
    }

    drawCorners(c, w, h, "#fbbf24");
  }

  private getTileColor(val: number): string {
    const colors: Record<number, string> = {
      2: "#e7c5a3", 4: "#e6b88c", 8: "#e6976d", 16: "#e87a52",
      32: "#e85d3a", 64: "#e84028", 128: "#f5cf63", 256: "#f3c341",
      512: "#f0b828", 1024: "#edab10", 2048: "#edab10",
    };
    return colors[val] ?? "#edab10";
  }

  private drawGrid(c: CanvasRenderingContext2D, w: number, h: number): void {
    const gridW = 720;
    const cellSize = gridW / GRID_SIZE;
    const gap = 12;
    const startX = (w - gridW) / 2;
    const startY = h * 0.25;

    c.save();
    c.fillStyle = "rgba(0,0,0,0.3)";
    c.beginPath();
    c.roundRect(startX - 10, startY - 10, gridW + 20, gridW + 20, 16);
    c.fill();
    c.restore();

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = this.grid[r]![col]!;
        const x = startX + col * cellSize + gap / 2;
        const y = startY + r * cellSize + gap / 2;
        const sz = cellSize - gap;

        c.save();
        if (cell.value === 0) {
          c.fillStyle = "rgba(255,255,255,0.05)";
        } else {
          c.fillStyle = this.getTileColor(cell.value);
          if (cell.merged) {
            c.shadowColor = this.getTileColor(cell.value);
            c.shadowBlur = 20;
          }
          const scale = cell.isNew ? clamp(this.animTimer / 0.2, 0, 1) : 1;
          const cx = x + sz / 2;
          const cy = y + sz / 2;
          c.translate(cx, cy);
          c.scale(scale, scale);
          c.translate(-cx, -cy);
        }
        c.beginPath();
        c.roundRect(x, y, sz, sz, 10);
        c.fill();

        if (cell.value > 0) {
          c.fillStyle = cell.value > 4 ? "#fff" : "#5a3a1a";
          c.font = `bold ${cell.value >= 1024 ? 36 : cell.value >= 128 ? 44 : 52}px Inter, system-ui, sans-serif`;
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText(String(cell.value), x + sz / 2, y + sz / 2);
        }
        c.restore();
      }
    }
  }

  protected onInput(x: number, y: number): void {
    void x; void y;
  }
}
