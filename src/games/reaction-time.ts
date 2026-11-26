import { BaseGame } from "../engine/base-game";
import type { GameContext } from "../engine/types";
import { drawBackground, drawText, drawCorners, drawProgressBar } from "../engine/render";
import { clamp } from "../engine/utils";

type Phase = "wait" | "go" | "result" | "tooEarly" | "reveal";

export class ReactionTimeGame extends BaseGame {
  private phase: Phase = "wait";
  private phaseTimer = 0;
  private waitTime = 0;
  private reactionStart = 0;
  private reactionTime = 0;
  private resultTimer = 0;
  private attempts: number[] = [];
  private maxAttempts = 3;
  private currentAttempt = 0;
  private avgReaction = 0;
  private tooEarly = false;

  protected onInit(): void {
    this.phase = "wait";
    this.phaseTimer = 0;
    this.waitTime = 1.5 + Math.random() * 2.5;
    this.reactionStart = 0;
    this.reactionTime = 0;
    this.resultTimer = 0;
    this.attempts = [];
    this.currentAttempt = 0;
    this.avgReaction = 0;
    this.tooEarly = false;
  }

  protected onStart(): void {}

  protected onUpdate(dt: number, _elapsed: number): void {
    this.phaseTimer += dt;

    if (this.phase === "wait") {
      if (this.phaseTimer >= this.waitTime) {
        this.phase = "go";
        this.phaseTimer = 0;
        this.reactionStart = this.elapsed;
      }
    } else if (this.phase === "go") {
      // waiting for tap
    } else if (this.phase === "result") {
      this.resultTimer += dt;
      if (this.resultTimer >= 2) {
        this.currentAttempt++;
        if (this.currentAttempt >= this.maxAttempts) {
          this.avgReaction = this.attempts.reduce((a, b) => a + b, 0) / this.attempts.length;
          this.phase = "reveal";
          this.phaseTimer = 0;
        } else {
          this.phase = "wait";
          this.phaseTimer = 0;
          this.waitTime = 1.5 + Math.random() * 2.5;
          this.tooEarly = false;
        }
      }
    } else if (this.phase === "tooEarly") {
      this.resultTimer += dt;
      if (this.resultTimer >= 1.5) {
        this.phase = "wait";
        this.phaseTimer = 0;
        this.waitTime = 1.5 + Math.random() * 2.5;
        this.tooEarly = false;
      }
    }
  }

  protected onRender(ctx: GameContext): void {
    const { ctx: c, width: w, height: h, phase: gp } = ctx;
    drawBackground(c, w, h, this.phaseTimer, "#ef4444");

    if (gp === "hook") {
      drawText(c, "REACTION TEST", w / 2, h * 0.35, { fontSize: 64, color: "#ef4444", fontWeight: "900" });
      drawText(c, "How fast are you?", w / 2, h * 0.45, { fontSize: 44, color: "#fff", maxWidth: w * 0.8 });
      return;
    }
    if (gp === "instructions") {
      drawText(c, "Wait for GREEN", w / 2, h * 0.3, { fontSize: 52, color: "#ef4444", fontWeight: "900" });
      drawText(c, "Then tap fast!", w / 2, h * 0.4, { fontSize: 42, color: "#fff" });
      drawText(c, "3 attempts!", w / 2, h * 0.48, { fontSize: 38, color: "#fff" });
      return;
    }
    if (gp === "ending") {
      drawText(c, `Avg: ${this.avgReaction.toFixed(0)}ms`, w / 2, h * 0.3, { fontSize: 64, color: "#ef4444", fontWeight: "900" });
      drawText(c, "How fast are you?", w / 2, h * 0.42, { fontSize: 42, color: "#fff" });
      drawText(c, "Comment your time!", w / 2, h * 0.5, { fontSize: 42, color: "#fff" });
      return;
    }

    drawText(c, `Attempt ${this.currentAttempt + 1}/${this.maxAttempts}`, w / 2, h * 0.08, {
      fontSize: 40, color: "#ef4444", fontWeight: "bold",
    });

    if (this.phase === "wait") {
      this.drawBigCircle(c, w, h, "#ef4444", "WAIT...");
    } else if (this.phase === "go") {
      this.drawBigCircle(c, w, h, "#22c55e", "TAP NOW!");
    } else if (this.phase === "result") {
      this.drawBigCircle(c, w, h, "#22c55e", `${this.reactionTime.toFixed(0)}ms`);
      drawText(c, "Nice!", w / 2, h * 0.75, { fontSize: 48, color: "#22c55e", fontWeight: "900" });
    } else if (this.phase === "tooEarly") {
      this.drawBigCircle(c, w, h, "#f97316", "TOO EARLY!");
      drawText(c, "Wait for green...", w / 2, h * 0.75, { fontSize: 36, color: "#f97316" });
    } else if (this.phase === "reveal") {
      drawText(c, "YOUR AVERAGE", w / 2, h * 0.3, { fontSize: 48, color: "#ef4444", fontWeight: "900" });
      drawText(c, `${this.avgReaction.toFixed(0)}ms`, w / 2, h * 0.42, { fontSize: 120, color: "#fff", fontWeight: "900" });
      this.drawTimes(c, w, h);
    }

    drawCorners(c, w, h, "#ef4444");
  }

  private drawBigCircle(c: CanvasRenderingContext2D, w: number, h: number, color: string, label: string): void {
    const cx = w / 2;
    const cy = h * 0.5;
    const r = 250;
    const pulse = this.phase === "go" ? 1 + 0.05 * Math.sin(this.phaseTimer * 10) : 1;

    c.save();
    c.fillStyle = color;
    c.shadowColor = color;
    c.shadowBlur = 60;
    c.beginPath();
    c.arc(cx, cy, r * pulse, 0, Math.PI * 2);
    c.fill();
    c.restore();

    drawText(c, label, cx, cy, { fontSize: 52, color: "#fff", fontWeight: "900" });
  }

  private drawTimes(c: CanvasRenderingContext2D, w: number, h: number): void {
    for (let i = 0; i < this.attempts.length; i++) {
      drawText(c, `Attempt ${i + 1}: ${this.attempts[i]!.toFixed(0)}ms`, w / 2, h * 0.55 + i * 60, {
        fontSize: 36, color: "#fff",
      });
    }
  }

  protected onInput(_x: number, _y: number): void {
    if (this.phase === "wait") {
      this.phase = "tooEarly";
      this.phaseTimer = 0;
      this.resultTimer = 0;
      this.tooEarly = true;
    } else if (this.phase === "go") {
      this.reactionTime = (this.elapsed - this.reactionStart) * 1000;
      this.attempts.push(this.reactionTime);
      this.phase = "result";
      this.phaseTimer = 0;
      this.resultTimer = 0;
    }
  }
}
