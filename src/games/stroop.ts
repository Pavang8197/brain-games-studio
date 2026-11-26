import { BaseGame } from "../engine/base-game";
import type { GameContext } from "../engine/types";
import { drawBackground, drawText, drawCorners, drawProgressBar } from "../engine/render";
import { clamp, pick } from "../engine/utils";

type Phase = "play" | "reveal";

const COLORS = [
  { name: "RED", hex: "#ef4444" },
  { name: "BLUE", hex: "#3b82f6" },
  { name: "GREEN", hex: "#22c55e" },
  { name: "YELLOW", hex: "#eab308" },
  { name: "PURPLE", hex: "#a855f7" },
];

export class StroopGame extends BaseGame {
  private currentWord = 0;
  private currentColor = 0;
  private options: number[] = [];
  private phase: Phase = "play";
  private phaseTimer = 0;
  private playDuration = 10;
  private correctCount = 0;
  private totalRounds = 0;
  private selectedOption: number | null = null;
  private roundTimer = 0;
  private roundLimit = 3;
  private feedback: "none" | "correct" | "wrong" = "none";
  private feedbackTimer = 0;

  protected onInit(): void {
    this.phase = "play";
    this.phaseTimer = 0;
    this.correctCount = 0;
    this.totalRounds = 0;
    this.selectedOption = null;
    this.roundTimer = 0;
    this.roundLimit = 3;
    this.feedback = "none";
    this.feedbackTimer = 0;
    this.playDuration = this.config.duration ?? 10;
    this.newRound();
  }

  protected onStart(): void {}

  private newRound(): void {
    this.currentWord = this.randInt(0, COLORS.length - 1);
    do {
      this.currentColor = this.randInt(0, COLORS.length - 1);
    } while (this.currentColor === this.currentWord);
    const correctIdx = this.currentColor;
    const wrongs = COLORS.map((_, i) => i).filter((i) => i !== correctIdx);
    this.options = [correctIdx, ...this.shuffle(wrongs).slice(0, 3)];
    this.options = this.shuffle(this.options);
    this.totalRounds++;
    this.selectedOption = null;
    this.roundTimer = 0;
  }

  protected onUpdate(dt: number, _elapsed: number): void {
    this.phaseTimer += dt;
    this.roundTimer += dt;
    this.feedbackTimer += dt;

    if (this.feedback !== "none" && this.feedbackTimer > 0.5) {
      this.feedback = "none";
      if (this.totalRounds < this.roundLimit && this.phase === "play") {
        this.newRound();
      } else if (this.totalRounds >= this.roundLimit) {
        this.phase = "reveal";
        this.phaseTimer = 0;
      }
    }

    if (this.phase === "play") {
      if (this.phaseTimer >= this.playDuration) {
        this.phase = "reveal";
        this.phaseTimer = 0;
      }
    }
  }

  protected onRender(ctx: GameContext): void {
    const { ctx: c, width: w, height: h, phase: gp } = ctx;
    drawBackground(c, w, h, this.phaseTimer, "#a855f7");

    if (gp === "hook") {
      drawText(c, "STROOP TEST", w / 2, h * 0.35, { fontSize: 64, color: "#a855f7", fontWeight: "900" });
      drawText(c, "Don't read the word!", w / 2, h * 0.45, { fontSize: 44, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "instructions") {
      drawText(c, "Tap the COLOR", w / 2, h * 0.3, { fontSize: 52, color: "#a855f7", fontWeight: "900" });
      drawText(c, "of the word", w / 2, h * 0.38, { fontSize: 42, color: "#fff" });
      drawText(c, "Not what it says!", w / 2, h * 0.46, { fontSize: 42, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "ending") {
      drawText(c, `${this.correctCount} / ${this.totalRounds} correct!`, w / 2, h * 0.35, { fontSize: 48, color: "#a855f7", fontWeight: "900" });
      drawText(c, "Comment your score!", w / 2, h * 0.45, { fontSize: 42, color: "#fff" });
      return;
    }

    if (this.phase === "play") {
      const remaining = Math.max(0, this.playDuration - this.phaseTimer);
      drawText(c, `Round ${this.totalRounds}/${this.roundLimit}`, w / 2, h * 0.1, { fontSize: 40, color: "#a855f7", fontWeight: "bold" });
      drawProgressBar(c, w, h * 0.14, remaining / this.playDuration, "#a855f7");

      drawText(c, COLORS[this.currentWord]!.name, w / 2, h * 0.3, {
        fontSize: 96,
        color: COLORS[this.currentColor]!.hex,
        fontWeight: "900",
        shadow: true,
      });
      drawText(c, "What color is this?", w / 2, h * 0.4, { fontSize: 36, color: "#ffffff80" });

      this.drawOptions(c, w, h);

      if (this.feedback === "correct") {
        drawText(c, "CORRECT!", w / 2, h * 0.7, { fontSize: 56, color: "#22c55e", fontWeight: "900" });
      } else if (this.feedback === "wrong") {
        drawText(c, "WRONG!", w / 2, h * 0.7, { fontSize: 56, color: "#ef4444", fontWeight: "900" });
      }
    }

    if (this.phase === "reveal" || gp === "reveal") {
      drawText(c, COLORS[this.currentWord]!.name, w / 2, h * 0.3, {
        fontSize: 96,
        color: COLORS[this.currentColor]!.hex,
        fontWeight: "900",
      });
      drawText(c, `Answer: ${COLORS[this.currentColor]!.name}`, w / 2, h * 0.45, { fontSize: 48, color: "#a855f7", fontWeight: "900" });
      drawText(c, `${this.correctCount} / ${this.totalRounds}`, w / 2, h * 0.55, { fontSize: 56, color: "#fff", fontWeight: "900" });
    }

    drawCorners(c, w, h, "#a855f7");
  }

  private drawOptions(c: CanvasRenderingContext2D, w: number, h: number): void {
    const optSize = 200;
    const gap = 20;
    const totalW = optSize * 4 + gap * 3;
    const startX = (w - totalW) / 2;
    const y = h * 0.5;

    for (let i = 0; i < this.options.length; i++) {
      const colorIdx = this.options[i]!;
      const x = startX + i * (optSize + gap);
      const isSelected = this.selectedOption === i;
      c.save();
      c.fillStyle = COLORS[colorIdx]!.hex;
      if (isSelected) {
        c.shadowColor = COLORS[colorIdx]!.hex;
        c.shadowBlur = 30;
      }
      c.beginPath();
      c.roundRect(x, y, optSize, optSize, 16);
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.3)";
      c.lineWidth = 3;
      c.stroke();
      c.restore();
    }
  }

  protected onInput(x: number, y: number): void {
    if (this.phase !== "play" || this.feedback !== "none") return;
    const optSize = 200;
    const gap = 20;
    const totalW = optSize * 4 + gap * 3;
    const startX = (1080 - totalW) / 2;
    const startY = 1920 * 0.5;
    for (let i = 0; i < this.options.length; i++) {
      const ox = startX + i * (optSize + gap);
      if (x >= ox && x <= ox + optSize && y >= startY && y <= startY + optSize) {
        this.selectedOption = i;
        if (this.options[i] === this.currentColor) {
          this.correctCount++;
          this.feedback = "correct";
        } else {
          this.feedback = "wrong";
        }
        this.feedbackTimer = 0;
        break;
      }
    }
  }
}
