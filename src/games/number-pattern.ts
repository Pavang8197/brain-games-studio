import { BaseGame } from "../engine/base-game";
import type { GameContext } from "../engine/types";
import { drawBackground, drawText, drawCorners, drawProgressBar } from "../engine/render";
import { clamp } from "../engine/utils";

type Phase = "play" | "reveal";

type PatternType = "arithmetic" | "geometric" | "square" | "fibonacci" | "mixed";

export class NumberPatternGame extends BaseGame {
  private sequence: number[] = [];
  private answer: number = 0;
  private options: number[] = [];
  private phase: Phase = "play";
  private phaseTimer = 0;
  private playDuration = 8;
  private selectedOption: number | null = null;
  private patternType: PatternType = "arithmetic";
  private patternLabel = "";

  protected onInit(): void {
    this.phase = "play";
    this.phaseTimer = 0;
    this.selectedOption = null;
    this.playDuration = this.config.duration ?? 8;
    this.generatePattern();
  }

  protected onStart(): void {}

  private generatePattern(): void {
    const types: PatternType[] = ["arithmetic", "geometric", "square", "fibonacci", "mixed"];
    this.patternType = this.pick(types);
    const diff = this.config.difficulty;
    const baseLen = diff === "easy" ? 4 : diff === "medium" ? 4 : diff === "hard" ? 5 : 5;

    switch (this.patternType) {
      case "arithmetic": {
        const step = this.randInt(2, diff === "expert" ? 13 : 9);
        const start = this.randInt(1, 20);
        this.sequence = this.range(baseLen).map((i) => start + i * step);
        this.answer = start + baseLen * step;
        this.patternLabel = "Addition pattern";
        break;
      }
      case "geometric": {
        const ratio = this.pick([2, 3]);
        const start = this.randInt(1, 4);
        this.sequence = this.range(baseLen).map((i) => start * Math.pow(ratio, i));
        this.answer = start * Math.pow(ratio, baseLen);
        this.patternLabel = "Multiplication pattern";
        break;
      }
      case "square": {
        const start = this.randInt(1, 4);
        this.sequence = this.range(baseLen).map((i) => Math.pow(start + i, 2));
        this.answer = Math.pow(start + baseLen, 2);
        this.patternLabel = "Perfect squares";
        break;
      }
      case "fibonacci": {
        let a = this.randInt(1, 3);
        let b = a + this.randInt(1, 4);
        this.sequence = [a, b];
        for (let i = 2; i < baseLen; i++) {
          [a, b] = [b, a + b];
          this.sequence.push(b);
        }
        this.answer = b + a;
        this.patternLabel = "Sum of previous two";
        break;
      }
      case "mixed": {
        const step = this.randInt(3, 11);
        const mult = this.pick([2, 3]);
        const start = this.randInt(1, 6);
        this.sequence = this.range(baseLen).map((i) => {
          const v = start + i * step;
          return v + (i % 2 === 0 ? 0 : mult);
        });
        const nextVal = start + baseLen * step;
        this.answer = nextVal + (baseLen % 2 === 0 ? 0 : mult);
        this.patternLabel = "Alternating pattern";
        break;
      }
    }

    const wrongs = new Set<number>();
    while (wrongs.size < 3) {
      const delta = this.randInt(-10, 10);
      const w = this.answer + delta;
      if (w !== this.answer && w > 0) wrongs.add(w);
    }
    this.options = this.shuffle([this.answer, ...wrongs]);
  }

  protected onUpdate(dt: number, _elapsed: number): void {
    this.phaseTimer += dt;
    if (this.phase === "play" && this.phaseTimer >= this.playDuration) {
      this.phase = "reveal";
      this.phaseTimer = 0;
    }
  }

  protected onRender(ctx: GameContext): void {
    const { ctx: c, width: w, height: h, phase: gp } = ctx;
    drawBackground(c, w, h, this.phaseTimer, "#22c55e");

    if (gp === "hook") {
      drawText(c, "NUMBER PATTERN", w / 2, h * 0.35, { fontSize: 60, color: "#22c55e", fontWeight: "900" });
      drawText(c, "What comes next?", w / 2, h * 0.45, { fontSize: 44, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "instructions") {
      drawText(c, "Find the pattern", w / 2, h * 0.3, { fontSize: 52, color: "#22c55e", fontWeight: "900" });
      drawText(c, "What's the next number?", w / 2, h * 0.4, { fontSize: 42, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "ending") {
      drawText(c, "Did you solve it?", w / 2, h * 0.35, { fontSize: 56, color: "#22c55e", fontWeight: "900" });
      drawText(c, "Comment your answer!", w / 2, h * 0.45, { fontSize: 42, color: "#fff" });
      return;
    }

    if (this.phase === "play") {
      const remaining = Math.max(0, this.playDuration - this.phaseTimer);
      drawText(c, "WHAT COMES NEXT?", w / 2, h * 0.1, { fontSize: 48, color: "#22c55e", fontWeight: "900" });
      drawProgressBar(c, w, h * 0.14, remaining / this.playDuration, "#22c55e");
    }

    this.drawSequence(c, w, h);

    if (this.phase === "play") {
      this.drawOptions(c, w, h);
    }

    if (this.phase === "reveal" || gp === "reveal") {
      const t = clamp(this.phaseTimer / 0.5, 0, 1);
      c.save();
      c.globalAlpha = clamp(t * 2, 0, 1);
      drawText(c, `ANSWER: ${this.answer}`, w / 2, h * 0.72, { fontSize: 72, color: "#22c55e", fontWeight: "900", shadow: true });
      drawText(c, this.patternLabel, w / 2, h * 0.8, { fontSize: 36, color: "#ffffff80" });
      c.restore();
    }

    drawCorners(c, w, h, "#22c55e");
  }

  private drawSequence(c: CanvasRenderingContext2D, w: number, h: number): void {
    const total = this.sequence.length + 1;
    const boxW = 140;
    const gap = 16;
    const totalW = total * boxW + (total - 1) * gap;
    const startX = (w - totalW) / 2;
    const y = h * 0.28;

    for (let i = 0; i < this.sequence.length; i++) {
      this.drawNumBox(c, startX + i * (boxW + gap), y, boxW, boxW, String(this.sequence[i]), "#22c55e", false);
    }
    const lastX = startX + this.sequence.length * (boxW + gap);
    if (this.phase === "play") {
      this.drawNumBox(c, lastX, y, boxW, boxW, "?", "#22c55e", true);
    } else {
      const t = clamp(this.phaseTimer / 0.5, 0, 1);
      c.save();
      c.globalAlpha = clamp(t * 2, 0, 1);
      this.drawNumBox(c, lastX, y, boxW, boxW, String(this.answer), "#22c55e", false, true);
      c.restore();
    }
  }

  private drawNumBox(
    c: CanvasRenderingContext2D, x: number, y: number, w: number, hgt: number,
    label: string, color: string, isQuestion: boolean, isAnswer = false
  ): void {
    c.save();
    if (isQuestion) {
      c.fillStyle = "rgba(34, 197, 94, 0.15)";
      c.strokeStyle = color;
      c.lineWidth = 3;
      c.setLineDash([10, 8]);
    } else if (isAnswer) {
      c.fillStyle = color;
      c.strokeStyle = color;
      c.lineWidth = 3;
      c.shadowColor = color;
      c.shadowBlur = 30;
    } else {
      c.fillStyle = "rgba(34, 197, 94, 0.2)";
      c.strokeStyle = "rgba(34, 197, 94, 0.5)";
      c.lineWidth = 2;
    }
    c.beginPath();
    c.roundRect(x, y, w, hgt, 16);
    c.fill();
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = isAnswer ? "#0a0a0f" : "#fff";
    c.font = `bold ${isQuestion ? 56 : 44}px Inter, system-ui, sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(label, x + w / 2, y + hgt / 2);
    c.restore();
  }

  private drawOptions(c: CanvasRenderingContext2D, w: number, h: number): void {
    const optW = 200;
    const optH = 100;
    const gap = 20;
    const totalW = optW * 2 + gap;
    const totalH = optH * 2 + gap;
    const startX = (w - totalW) / 2;
    const startY = h * 0.5;

    for (let i = 0; i < this.options.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (optW + gap);
      const y = startY + row * (optH + gap);
      const isSelected = this.selectedOption === i;
      c.save();
      c.fillStyle = isSelected ? "rgba(34, 197, 94, 0.4)" : "rgba(255,255,255,0.08)";
      if (isSelected) {
        c.shadowColor = "#22c55e";
        c.shadowBlur = 20;
      }
      c.beginPath();
      c.roundRect(x, y, optW, optH, 12);
      c.fill();
      c.strokeStyle = "rgba(34, 197, 94, 0.5)";
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = "#fff";
      c.font = `bold 40px Inter, system-ui, sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(String(this.options[i]), x + optW / 2, y + optH / 2);
      c.restore();
    }
  }

  protected onInput(x: number, y: number): void {
    if (this.phase !== "play") return;
    const optW = 200;
    const optH = 100;
    const gap = 20;
    const totalW = optW * 2 + gap;
    const startX = (1080 - totalW) / 2;
    const startY = 1920 * 0.5;
    for (let i = 0; i < this.options.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const ox = startX + col * (optW + gap);
      const oy = startY + row * (optH + gap);
      if (x >= ox && x <= ox + optW && y >= oy && y <= oy + optH) {
        this.selectedOption = i;
        this.phase = "reveal";
        this.phaseTimer = 0;
        break;
      }
    }
  }
}
