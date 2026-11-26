import { BaseGame } from "../engine/base-game";
import type { GameContext } from "../engine/types";
import { drawBackground, drawText, drawCorners, drawProgressBar } from "../engine/render";
import { easeOut, easeOutBack, clamp } from "../engine/utils";

interface Cell {
  active: boolean;
  lit: boolean;
  litTime: number;
}

type Phase = "memorize" | "hide" | "recall" | "reveal";

export class MemoryMatrixGame extends BaseGame {
  private grid: Cell[][] = [];
  private gridSize = 3;
  private activeCount = 4;
  private phase: Phase = "memorize";
  private phaseTimer = 0;
  private memorizeTime = 3;
  private selectedCells: number[] = [];
  private correctCells: number[] = [];
  private resultShown = false;

  protected onInit(): void {
    this.gridSize = this.config.gridSize ?? 3;
    this.activeCount = this.config.targetCount ?? 4;
    this.phase = "memorize";
    this.phaseTimer = 0;
    this.memorizeTime = 3;
    this.selectedCells = [];
    this.correctCells = [];
    this.resultShown = false;

    this.grid = [];
    for (let r = 0; r < this.gridSize; r++) {
      const row: Cell[] = [];
      for (let col = 0; col < this.gridSize; col++) {
        row.push({ active: false, lit: false, litTime: 0 });
      }
      this.grid.push(row);
    }

    const total = this.gridSize * this.gridSize;
    const indices = this.shuffle(this.range(total)).slice(0, this.activeCount);
    this.correctCells = indices;
    for (const idx of indices) {
      const r = Math.floor(idx / this.gridSize);
      const c = idx % this.gridSize;
      this.grid[r]![c]!.active = true;
      this.grid[r]![c]!.lit = true;
    }
  }

  protected onStart(): void {}

  protected onUpdate(dt: number, _elapsed: number): void {
    this.phaseTimer += dt;

    switch (this.phase) {
      case "memorize":
        if (this.phaseTimer >= this.memorizeTime) {
          this.phase = "hide";
          this.phaseTimer = 0;
          for (const row of this.grid) {
            for (const cell of row) {
              cell.lit = false;
            }
          }
        }
        break;
      case "hide":
        if (this.phaseTimer >= 0.5) {
          this.phase = "recall";
          this.phaseTimer = 0;
        }
        break;
      case "recall":
        if (this.phaseTimer >= (this.config.duration ?? 8)) {
          this.phase = "reveal";
          this.phaseTimer = 0;
          this.resultShown = true;
        }
        break;
      case "reveal":
        for (const row of this.grid) {
          for (const cell of row) {
            if (cell.active) cell.lit = true;
          }
        }
        break;
    }
  }

  protected onRender(ctx: GameContext): void {
    const { ctx: c, width: w, height: h, phase: gp } = ctx;
    drawBackground(c, w, h, this.phaseTimer, "#22d3ee");

    if (gp === "hook") {
      drawText(c, "MEMORY MATRIX", w / 2, h * 0.35, { fontSize: 72, color: "#22d3ee", fontWeight: "900" });
      drawText(c, "Memorize the pattern!", w / 2, h * 0.45, { fontSize: 44, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "instructions") {
      drawText(c, "Memorize", w / 2, h * 0.3, { fontSize: 56, color: "#22d3ee", fontWeight: "900" });
      drawText(c, "the lit cells", w / 2, h * 0.38, { fontSize: 42, color: "#fff" });
      drawText(c, "Then find them all!", w / 2, h * 0.46, { fontSize: 42, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "ending") {
      drawText(c, "Did you get it?", w / 2, h * 0.35, { fontSize: 56, color: "#22d3ee", fontWeight: "900" });
      drawText(c, "Comment your score!", w / 2, h * 0.45, { fontSize: 42, color: "#fff" });
      return;
    }

    if (gp === "thinking") {
      drawText(c, "Where were they?", w / 2, h * 0.12, { fontSize: 52, color: "#22d3ee", fontWeight: "900" });
    }

    if (this.phase === "memorize") {
      const remaining = Math.max(0, this.memorizeTime - this.phaseTimer);
      drawText(c, "MEMORIZE!", w / 2, h * 0.12, { fontSize: 52, color: "#22d3ee", fontWeight: "900" });
      drawProgressBar(c, w, h * 0.17, remaining / this.memorizeTime, "#22d3ee");
    } else if (this.phase === "recall" && gp !== "reveal") {
      drawText(c, "Tap the cells!", w / 2, h * 0.12, { fontSize: 44, color: "#fff", fontWeight: "bold" });
    }

    this.drawGrid(c, w, h);

    if (this.phase === "reveal" || gp === "reveal") {
      const t = clamp(this.phaseTimer / 0.5, 0, 1);
      c.save();
      c.globalAlpha = clamp(t * 2, 0, 1);
      drawText(c, "ANSWER", w / 2, h * 0.85, { fontSize: 56, color: "#22d3ee", fontWeight: "900" });
      c.restore();
    }

    drawCorners(c, w, h, "#22d3ee");
  }

  private drawGrid(c: CanvasRenderingContext2D, w: number, h: number): void {
    const gridW = 600;
    const cellSize = gridW / this.gridSize;
    const gap = 12;
    const startX = (w - gridW) / 2;
    const startY = h * 0.3;

    for (let r = 0; r < this.gridSize; r++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cell = this.grid[r]![col]!;
        const x = startX + col * cellSize + gap / 2;
        const y = startY + r * cellSize + gap / 2;
        const sz = cellSize - gap;

        c.save();
        if (cell.lit) {
          const pulse = 0.8 + 0.2 * Math.sin(this.phaseTimer * 5);
          c.fillStyle = `rgba(34, 211, 238, ${pulse})`;
          c.shadowColor = "#22d3ee";
          c.shadowBlur = 30;
        } else {
          c.fillStyle = "rgba(255,255,255,0.08)";
        }
        c.beginPath();
        const rad = 16;
        c.roundRect(x, y, sz, sz, rad);
        c.fill();
        c.strokeStyle = cell.lit ? "#22d3ee" : "rgba(255,255,255,0.15)";
        c.lineWidth = 2;
        c.stroke();
        c.restore();
      }
    }
  }

  protected onInput(x: number, y: number): void {
    if (this.phase !== "recall") return;
    const gridW = 600;
    const cellSize = gridW / this.gridSize;
    const startX = (1080 - gridW) / 2;
    const startY = 1920 * 0.3;
    const col = Math.floor((x - startX) / cellSize);
    const r = Math.floor((y - startY) / cellSize);
    if (r >= 0 && r < this.gridSize && col >= 0 && col < this.gridSize) {
      const idx = r * this.gridSize + col;
      if (!this.selectedCells.includes(idx)) {
        this.selectedCells.push(idx);
        this.grid[r]![col]!.lit = true;
      }
    }
  }
}
