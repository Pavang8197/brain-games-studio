import { BaseGame } from "../engine/base-game";
import type { GameContext } from "../engine/types";
import { drawBackground, drawText, drawCorners, drawProgressBar } from "../engine/render";
import { clamp, easeOut, easeOutBack } from "../engine/utils";

type Phase = "play" | "reveal";

export class OddOneOutGame extends BaseGame {
  private grid: { color: string; shape: string; size: number; odd: boolean }[] = [];
  private gridSize = 3;
  private totalCount = 9;
  private oddIndex = 0;
  private phase: Phase = "play";
  private phaseTimer = 0;
  private playDuration = 6;
  private selected: number | null = null;
  private revealTimer = 0;
  private oddColor: string = "";
  private baseColor: string = "";

  protected onInit(): void {
    this.gridSize = this.config.gridSize ?? 3;
    this.totalCount = this.gridSize * this.gridSize;
    this.phase = "play";
    this.phaseTimer = 0;
    this.selected = null;
    this.revealTimer = 0;
    this.playDuration = this.config.duration ?? 6;

    const palette = [
      { base: "#ef4444", odd: "#dc2626" },
      { base: "#22c55e", odd: "#16a34a" },
      { base: "#3b82f6", odd: "#2563eb" },
      { base: "#eab308", odd: "#ca8a04" },
      { base: "#a855f7", odd: "#9333ea" },
    ];
    const chosen = this.pick(palette);
    this.baseColor = chosen.base;
    this.oddColor = chosen.odd;

    this.oddIndex = this.randInt(0, this.totalCount - 1);
    const shapes = ["circle", "square", "triangle", "diamond"];
    const shape = this.pick(shapes);

    this.grid = [];
    for (let i = 0; i < this.totalCount; i++) {
      this.grid.push({
        color: i === this.oddIndex ? this.oddColor : this.baseColor,
        shape,
        size: i === this.oddIndex ? 0.88 : 1,
        odd: i === this.oddIndex,
      });
    }
  }

  protected onStart(): void {}

  protected onUpdate(dt: number, _elapsed: number): void {
    this.phaseTimer += dt;
    if (this.phase === "play") {
      if (this.phaseTimer >= this.playDuration) {
        this.phase = "reveal";
        this.phaseTimer = 0;
        this.revealTimer = 0;
      }
    }
  }

  protected onRender(ctx: GameContext): void {
    const { ctx: c, width: w, height: h, phase: gp } = ctx;
    drawBackground(c, w, h, this.phaseTimer, "#fbbf24");

    if (gp === "hook") {
      drawText(c, "ODD ONE OUT", w / 2, h * 0.35, { fontSize: 64, color: "#fbbf24", fontWeight: "900" });
      drawText(c, "Can you spot it?", w / 2, h * 0.45, { fontSize: 44, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "instructions") {
      drawText(c, "Find the one", w / 2, h * 0.3, { fontSize: 52, color: "#fbbf24", fontWeight: "900" });
      drawText(c, "that's different", w / 2, h * 0.38, { fontSize: 42, color: "#fff" });
      drawText(c, "Hurry — time is short!", w / 2, h * 0.46, { fontSize: 38, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "ending") {
      drawText(c, "Did you find it?", w / 2, h * 0.35, { fontSize: 56, color: "#fbbf24", fontWeight: "900" });
      drawText(c, "Comment your time!", w / 2, h * 0.45, { fontSize: 42, color: "#fff" });
      return;
    }

    if (this.phase === "play" && gp !== "reveal") {
      const remaining = Math.max(0, this.playDuration - this.phaseTimer);
      drawText(c, "FIND THE ODD ONE!", w / 2, h * 0.12, { fontSize: 48, color: "#fbbf24", fontWeight: "900" });
      drawText(c, `${remaining.toFixed(1)}s`, w / 2, h * 0.18, { fontSize: 56, color: "#fff", fontWeight: "900" });
      drawProgressBar(c, w, h * 0.22, remaining / this.playDuration, "#fbbf24");
    }

    this.drawShapes(c, w, h);

    if (this.phase === "reveal" || gp === "reveal") {
      const t = clamp(this.phaseTimer / 0.5, 0, 1);
      c.save();
      c.globalAlpha = clamp(t * 2, 0, 1);
      drawText(c, "HERE IT IS!", w / 2, h * 0.85, { fontSize: 56, color: "#fbbf24", fontWeight: "900" });
      c.restore();
    }

    drawCorners(c, w, h, "#fbbf24");
  }

  private drawShapes(c: CanvasRenderingContext2D, w: number, h: number): void {
    const gridW = 660;
    const cellSize = gridW / this.gridSize;
    const startX = (w - gridW) / 2;
    const startY = h * 0.3;

    for (let i = 0; i < this.totalCount; i++) {
      const item = this.grid[i]!;
      const col = i % this.gridSize;
      const row = Math.floor(i / this.gridSize);
      const cx = startX + col * cellSize + cellSize / 2;
      const cy = startY + row * cellSize + cellSize / 2;
      const baseSize = cellSize * 0.35;
      const sz = baseSize * item.size;

      const isHighlight = this.phase === "reveal" && item.odd;

      c.save();
      c.translate(cx, cy);

      if (isHighlight) {
        const pulse = 1 + 0.15 * Math.sin(this.phaseTimer * 8);
        c.scale(pulse, pulse);
        c.shadowColor = "#fbbf24";
        c.shadowBlur = 40;
      }

      c.fillStyle = item.color;
      this.drawShape(c, item.shape, sz);

      if (isHighlight) {
        c.strokeStyle = "#fbbf24";
        c.lineWidth = 5;
        c.beginPath();
        c.arc(0, 0, sz * 1.3, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    }
  }

  private drawShape(c: CanvasRenderingContext2D, shape: string, sz: number): void {
    c.beginPath();
    switch (shape) {
      case "circle":
        c.arc(0, 0, sz, 0, Math.PI * 2);
        break;
      case "square":
        c.roundRect(-sz, -sz, sz * 2, sz * 2, 8);
        break;
      case "triangle":
        c.moveTo(0, -sz);
        c.lineTo(sz, sz);
        c.lineTo(-sz, sz);
        c.closePath();
        break;
      case "diamond":
        c.moveTo(0, -sz);
        c.lineTo(sz, 0);
        c.lineTo(0, sz);
        c.lineTo(-sz, 0);
        c.closePath();
        break;
    }
    c.fill();
  }

  protected onInput(x: number, y: number): void {
    if (this.phase !== "play") return;
    const gridW = 660;
    const cellSize = gridW / this.gridSize;
    const startX = (1080 - gridW) / 2;
    const startY = 1920 * 0.3;
    const col = Math.floor((x - startX) / cellSize);
    const row = Math.floor((y - startY) / cellSize);
    if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
      const idx = row * this.gridSize + col;
      this.selected = idx;
      this.phase = "reveal";
      this.phaseTimer = 0;
    }
  }
}
