import { BaseGame } from "../engine/base-game";
import type { GameContext } from "../engine/types";
import { drawBackground, drawText, drawCorners, drawProgressBar } from "../engine/render";
import { clamp, shuffle } from "../engine/utils";

type Phase = "play" | "reveal";

export class SchulteGridGame extends BaseGame {
  private grid: number[] = [];
  private gridSize = 5;
  private nextNumber = 1;
  private phase: Phase = "play";
  private phaseTimer = 0;
  private playDuration = 15;
  private foundNumbers: Set<number> = new Set();
  private highlightCell = -1;
  private highlightTimer = 0;

  protected onInit(): void {
    this.gridSize = this.config.gridSize ?? 5;
    this.phase = "play";
    this.phaseTimer = 0;
    this.nextNumber = 1;
    this.foundNumbers = new Set();
    this.highlightCell = -1;
    this.highlightTimer = 0;
    this.playDuration = this.config.duration ?? 15;

    const total = this.gridSize * this.gridSize;
    this.grid = shuffle(this.range(total).map((i) => i + 1));
  }

  protected onStart(): void {}

  protected onUpdate(dt: number, _elapsed: number): void {
    this.phaseTimer += dt;
    this.highlightTimer += dt;
    if (this.highlightTimer > 0.3) {
      this.highlightCell = -1;
    }
    if (this.phase === "play") {
      if (this.phaseTimer >= this.playDuration || this.nextNumber > this.gridSize * this.gridSize) {
        this.phase = "reveal";
        this.phaseTimer = 0;
      }
    }
  }

  protected onRender(ctx: GameContext): void {
    const { ctx: c, width: w, height: h, phase: gp } = ctx;
    drawBackground(c, w, h, this.phaseTimer, "#22c55e");

    if (gp === "hook") {
      drawText(c, "SCHULTE GRID", w / 2, h * 0.35, { fontSize: 64, color: "#22c55e", fontWeight: "900" });
      drawText(c, "Tap 1 to N in order!", w / 2, h * 0.45, { fontSize: 44, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "instructions") {
      drawText(c, "Find numbers", w / 2, h * 0.3, { fontSize: 52, color: "#22c55e", fontWeight: "900" });
      drawText(c, "1 to " + this.gridSize * this.gridSize, w / 2, h * 0.38, { fontSize: 48, color: "#fff" });
      drawText(c, "as fast as you can!", w / 2, h * 0.46, { fontSize: 42, color: "#fff" });
      return;
    }
    if (gp === "ending") {
      drawText(c, "How fast were you?", w / 2, h * 0.35, { fontSize: 52, color: "#22c55e", fontWeight: "900" });
      drawText(c, "Comment your time!", w / 2, h * 0.45, { fontSize: 42, color: "#fff" });
      return;
    }

    if (this.phase === "play") {
      const remaining = Math.max(0, this.playDuration - this.phaseTimer);
      drawText(c, `Find: ${this.nextNumber}`, w / 2, h * 0.1, { fontSize: 56, color: "#22c55e", fontWeight: "900" });
      drawText(c, `${remaining.toFixed(1)}s`, w / 2, h * 0.16, { fontSize: 40, color: "#fff", fontWeight: "900" });
      drawProgressBar(c, w, h * 0.2, remaining / this.playDuration, "#22c55e");
    }

    this.drawGrid(c, w, h);

    if (this.phase === "reveal" || gp === "reveal") {
      drawText(c, `Next was: ${this.nextNumber}`, w / 2, h * 0.88, { fontSize: 48, color: "#22c55e", fontWeight: "900" });
    }

    drawCorners(c, w, h, "#22c55e");
  }

  private drawGrid(c: CanvasRenderingContext2D, w: number, h: number): void {
    const gridW = 720;
    const cellSize = gridW / this.gridSize;
    const startX = (w - gridW) / 2;
    const startY = h * 0.27;
    const fontSize = cellSize * 0.4;

    for (let i = 0; i < this.grid.length; i++) {
      const num = this.grid[i]!;
      const col = i % this.gridSize;
      const row = Math.floor(i / this.gridSize);
      const x = startX + col * cellSize;
      const y = startY + row * cellSize;
      const found = this.foundNumbers.has(num);
      const isHighlight = this.highlightCell === i;

      c.save();
      c.fillStyle = found ? "rgba(34, 197, 94, 0.25)" : "rgba(255,255,255,0.08)";
      if (isHighlight) {
        c.fillStyle = "rgba(34, 197, 94, 0.5)";
        c.shadowColor = "#22c55e";
        c.shadowBlur = 30;
      }
      c.beginPath();
      c.roundRect(x + 4, y + 4, cellSize - 8, cellSize - 8, 12);
      c.fill();
      c.strokeStyle = found ? "rgba(34, 197, 94, 0.4)" : "rgba(255,255,255,0.15)";
      c.lineWidth = 2;
      c.stroke();

      c.fillStyle = found ? "rgba(255,255,255,0.3)" : "#ffffff";
      c.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(String(num), x + cellSize / 2, y + cellSize / 2);
      c.restore();
    }
  }

  protected onInput(x: number, y: number): void {
    if (this.phase !== "play") return;
    const gridW = 720;
    const cellSize = gridW / this.gridSize;
    const startX = (1080 - gridW) / 2;
    const startY = 1920 * 0.27;
    const col = Math.floor((x - startX) / cellSize);
    const row = Math.floor((y - startY) / cellSize);
    if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
      const idx = row * this.gridSize + col;
      const num = this.grid[idx]!;
      if (num === this.nextNumber) {
        this.foundNumbers.add(num);
        this.nextNumber++;
        this.highlightCell = idx;
        this.highlightTimer = 0;
      }
    }
  }
}
