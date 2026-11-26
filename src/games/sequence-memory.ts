import { BaseGame } from "../engine/base-game";
import type { GameContext } from "../engine/types";
import { drawBackground, drawText, drawCorners } from "../engine/render";
import { clamp, easeOut, easeOutBack } from "../engine/utils";

type Phase = "show" | "input" | "reveal";

export class SequenceMemoryGame extends BaseGame {
  private sequence: number[] = [];
  private seqLength = 4;
  private phase: Phase = "show";
  private phaseTimer = 0;
  private showIdx = -1;
  private showTimer = 0;
  private inputIdx = 0;
  private flashIdx = -1;
  private flashTimer = 0;
  private colorCount = 4;
  private userCorrect = true;

  protected onInit(): void {
    this.seqLength = this.config.sequenceLength ?? 4;
    this.colorCount = 4;
    this.sequence = [];
    for (let i = 0; i < this.seqLength; i++) {
      this.sequence.push(this.randInt(0, this.colorCount - 1));
    }
    this.phase = "show";
    this.phaseTimer = 0;
    this.showIdx = -1;
    this.showTimer = 0;
    this.inputIdx = 0;
    this.flashIdx = -1;
    this.flashTimer = 0;
    this.userCorrect = true;
  }

  protected onStart(): void {}

  protected onUpdate(dt: number, _elapsed: number): void {
    this.phaseTimer += dt;
    this.flashTimer += dt;

    if (this.flashTimer > 0.4) {
      this.flashIdx = -1;
    }

    if (this.phase === "show") {
      this.showTimer += dt;
      const stepDuration = 0.6;
      if (this.showTimer >= stepDuration) {
        this.showTimer = 0;
        this.showIdx++;
        if (this.showIdx >= this.seqLength) {
          this.phase = "input";
          this.phaseTimer = 0;
        }
      }
    } else if (this.phase === "input") {
      if (this.phaseTimer >= (this.config.duration ?? 10)) {
        this.phase = "reveal";
        this.phaseTimer = 0;
      }
    }
  }

  private getColors(): string[] {
    return ["#22c55e", "#ef4444", "#3b82f6", "#eab308"];
  }

  protected onRender(ctx: GameContext): void {
    const { ctx: c, width: w, height: h, phase: gp } = ctx;
    drawBackground(c, w, h, this.phaseTimer, "#22d3ee");

    if (gp === "hook") {
      drawText(c, "SEQUENCE", w / 2, h * 0.35, { fontSize: 72, color: "#22d3ee", fontWeight: "900" });
      drawText(c, "MEMORY", w / 2, h * 0.43, { fontSize: 72, color: "#22d3ee", fontWeight: "900" });
      drawText(c, "Watch and repeat!", w / 2, h * 0.53, { fontSize: 42, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "instructions") {
      drawText(c, "Watch the sequence", w / 2, h * 0.3, { fontSize: 52, color: "#22d3ee", fontWeight: "900" });
      drawText(c, "Then repeat it back", w / 2, h * 0.4, { fontSize: 42, color: "#fff" });
      drawText(c, "in the same order!", w / 2, h * 0.48, { fontSize: 42, color: "#fff" });
      return;
    }
    if (gp === "ending") {
      drawText(c, "Did you get it?", w / 2, h * 0.35, { fontSize: 56, color: "#22d3ee", fontWeight: "900" });
      drawText(c, "Try a longer sequence!", w / 2, h * 0.45, { fontSize: 42, color: "#fff" });
      return;
    }

    if (this.phase === "show") {
      drawText(c, "WATCH!", w / 2, h * 0.12, { fontSize: 52, color: "#22d3ee", fontWeight: "900" });
    } else if (this.phase === "input") {
      drawText(c, "YOUR TURN!", w / 2, h * 0.12, { fontSize: 52, color: "#22d3ee", fontWeight: "900" });
    } else if (this.phase === "reveal") {
      drawText(c, "THE SEQUENCE", w / 2, h * 0.12, { fontSize: 48, color: "#22d3ee", fontWeight: "900" });
    }

    this.drawPads(c, w, h);

    if (this.phase === "show" || this.phase === "reveal") {
      const idx = this.phase === "show" ? this.showIdx : Math.floor(this.phaseTimer / 0.6) % this.seqLength;
      this.drawSequenceDots(c, w, h, idx);
    }

    drawCorners(c, w, h, "#22d3ee");
  }

  private drawPads(c: CanvasRenderingContext2D, w: number, h: number): void {
    const colors = this.getColors();
    const padSize = 320;
    const gap = 20;
    const totalW = padSize * 2 + gap;
    const startX = (w - totalW) / 2;
    const startY = h * 0.3;

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (padSize + gap);
      const y = startY + row * (padSize + gap);
      const isLit = (this.phase === "show" && this.showIdx >= 0 && this.showIdx < this.seqLength && this.sequence[this.showIdx] === i) ||
                    (this.flashIdx === i);
      const isReveal = this.phase === "reveal" && Math.floor(this.phaseTimer / 0.6) % this.seqLength < this.seqLength &&
                       this.sequence[Math.floor(this.phaseTimer / 0.6) % this.seqLength] === i;

      c.save();
      c.fillStyle = isLit || isReveal ? colors[i]! : `${colors[i]}33`;
      if (isLit || isReveal) {
        c.shadowColor = colors[i]!;
        c.shadowBlur = 40;
      }
      c.beginPath();
      c.roundRect(x, y, padSize, padSize, 24);
      c.fill();
      c.strokeStyle = colors[i]!;
      c.lineWidth = 3;
      c.stroke();
      c.restore();
    }
  }

  private drawSequenceDots(c: CanvasRenderingContext2D, w: number, _h: number, activeIdx: number): void {
    const dotSize = 24;
    const gap = 16;
    const totalW = this.seqLength * dotSize + (this.seqLength - 1) * gap;
    const startX = (w - totalW) / 2;
    const y = 1750;
    for (let i = 0; i < this.seqLength; i++) {
      c.save();
      c.fillStyle = i <= activeIdx ? "#22d3ee" : "rgba(255,255,255,0.2)";
      c.beginPath();
      c.arc(startX + i * (dotSize + gap), y, dotSize / 2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  protected onInput(x: number, y: number): void {
    if (this.phase !== "input") return;
    const padSize = 320;
    const gap = 20;
    const totalW = padSize * 2 + gap;
    const startX = (1080 - totalW) / 2;
    const startY = 1920 * 0.3;
    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const px = startX + col * (padSize + gap);
      const py = startY + row * (padSize + gap);
      if (x >= px && x <= px + padSize && y >= py && y <= py + padSize) {
        this.flashIdx = i;
        this.flashTimer = 0;
        if (this.sequence[this.inputIdx] === i) {
          this.inputIdx++;
          if (this.inputIdx >= this.seqLength) {
            this.phase = "reveal";
            this.phaseTimer = 0;
          }
        } else {
          this.userCorrect = false;
          this.phase = "reveal";
          this.phaseTimer = 0;
        }
        break;
      }
    }
  }
}
