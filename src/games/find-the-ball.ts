import { BaseGame } from "./base-game";
import type { GameContext, GameResult } from "./types";
import {
  drawBackground,
  drawText,
  drawCorners,
  drawProgressBar,
} from "./render";
import { easeInOut, easeOut, easeOutBack, clamp, lerp } from "./utils";

interface Cup {
  id: number;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  lift: number;
  revealed: boolean;
}

interface SwapStep {
  cupA: number;
  cupB: number;
  duration: number;
}

type Phase =
  | "show"
  | "cover"
  | "shuffle"
  | "wait"
  | "reveal";

export class FindTheBallGame extends BaseGame {
  private cups: Cup[] = [];
  private ballCupId = 0;
  private ballVisible = true;
  private phase: Phase = "show";
  private swaps: SwapStep[] = [];
  private swapIdx = 0;
  private swapElapsed = 0;
  private currentSwap: SwapStep | null = null;
  private cupCount = 3;
  private shuffleCount = 8;
  private shuffleSpeed = 0.5;
  private revealTime = 2;
  private thinkTime = 3;
  private selectedCup: number | null = null;
  private answerRevealed = false;
  private ballX = 0;
  private ballY = 0;
  private phaseTimer = 0;

  protected onInit(): void {
    this.cupCount = this.config.cupCount ?? 3;
    this.shuffleCount = this.config.shuffleCount ?? 8;
    this.shuffleSpeed = this.config.shuffleSpeed ?? 0.5;
    this.revealTime = this.config.revealTime ?? 2;
    this.thinkTime = this.config.thinkTime ?? 3;
    this.phase = "show";
    this.phaseTimer = 0;
    this.swaps = [];
    this.swapIdx = 0;
    this.currentSwap = null;
    this.selectedCup = null;
    this.answerRevealed = false;

    this.cups = this.range(this.cupCount).map((i) => ({
      id: i,
      x: 0,
      y: 0,
      homeX: 0,
      homeY: 0,
      lift: 0,
      revealed: false,
    }));

    this.ballCupId = this.randInt(0, this.cupCount - 1);
    this.ballVisible = true;
  }

  protected onStart(): void {
    this.layoutCups();
  }

  private layoutCups(): void {
    const cy = 600;
    const spacing = 320 / Math.max(this.cupCount - 1, 1);
    const totalW = spacing * (this.cupCount - 1);
    const startX = 540 - totalW / 2;
    for (let i = 0; i < this.cupCount; i++) {
      this.cups[i]!.x = startX + i * spacing;
      this.cups[i]!.y = cy;
      this.cups[i]!.homeX = this.cups[i]!.x;
      this.cups[i]!.homeY = cy;
      this.cups[i]!.lift = 0;
    }
    this.updateBallPos();
  }

  private updateBallPos(): void {
    const cup = this.cups.find((c) => c.id === this.ballCupId);
    if (cup) {
      this.ballX = cup.x;
      this.ballY = cup.y + 35;
    }
  }

  private generateSwaps(): void {
    this.swaps = [];
    let lastA = -1;
    let lastB = -1;
    for (let i = 0; i < this.shuffleCount; i++) {
      let a: number;
      let b: number;
      do {
        a = this.randInt(0, this.cupCount - 1);
        b = this.randInt(0, this.cupCount - 1);
      } while (
        a === b ||
        (a === lastA && b === lastB) ||
        (a === lastB && b === lastA)
      );
      const baseDur = 0.4 / this.shuffleSpeed;
      const speedVar = 0.7 + Math.random() * 0.6;
      this.swaps.push({ cupA: a, cupB: b, duration: baseDur * speedVar });
      lastA = a;
      lastB = b;
    }
  }

  protected onUpdate(dt: number, _elapsed: number): void {
    this.phaseTimer += dt;

    switch (this.phase) {
      case "show": {
        if (this.phaseTimer >= this.revealTime) {
          this.phase = "cover";
          this.phaseTimer = 0;
          this.ballVisible = false;
        }
        break;
      }
      case "cover": {
        const t = clamp(this.phaseTimer / 0.4, 0, 1);
        for (const cup of this.cups) {
          cup.lift = easeOut(t) * 0;
          cup.y = cup.homeY + (1 - t) * (-80);
        }
        if (this.phaseTimer >= 0.4) {
          for (const cup of this.cups) {
            cup.y = cup.homeY;
          }
          this.phase = "shuffle";
          this.phaseTimer = 0;
          this.generateSwaps();
          this.swapIdx = 0;
          this.currentSwap = this.swaps[0] ?? null;
          this.swapElapsed = 0;
        }
        break;
      }
      case "shuffle": {
        if (!this.currentSwap) {
          this.phase = "wait";
          this.phaseTimer = 0;
          break;
        }
        this.swapElapsed += dt;
        const t = clamp(this.swapElapsed / this.currentSwap.duration, 0, 1);
        const eased = easeInOut(t);
        const cupA = this.cups.find((c) => c.id === this.currentSwap!.cupA)!;
        const cupB = this.cups.find((c) => c.id === this.currentSwap!.cupB)!;
        const aStartX = cupA.homeX;
        const bStartX = cupB.homeX;
        cupA.x = lerp(aStartX, bStartX, eased);
        cupB.x = lerp(bStartX, aStartX, eased);
        const arc = Math.sin(t * Math.PI) * 60;
        cupA.y = cupA.homeY - arc;
        cupB.y = cupB.homeY + arc * 0.5;

        if (t >= 1) {
          cupA.homeX = bStartX;
          cupB.homeX = aStartX;
          cupA.x = cupA.homeX;
          cupB.x = cupB.homeX;
          cupA.y = cupA.homeY;
          cupB.y = cupB.homeY;
          this.swapIdx++;
          this.currentSwap = this.swaps[this.swapIdx] ?? null;
          this.swapElapsed = 0;
        }
        break;
      }
      case "wait": {
        if (this.phaseTimer >= this.thinkTime) {
          this.phase = "reveal";
          this.phaseTimer = 0;
          this.answerRevealed = true;
        }
        break;
      }
      case "reveal": {
        const cup = this.cups.find((c) => c.id === this.ballCupId);
        if (cup) {
          const t = clamp(this.phaseTimer / 0.5, 0, 1);
          cup.y = cup.homeY - easeOutBack(t) * 120;
        }
        break;
      }
    }
    this.updateBallPos();
  }

  protected onRender(ctx: GameContext): void {
    const { ctx: c, width: w, height: h, phase: gamePhase, audio } = ctx;
    drawBackground(c, w, h, this.phaseTimer, "#fbbf24");

    if (gamePhase === "hook") {
      this.drawHook(c, w, h);
      return;
    }
    if (gamePhase === "instructions") {
      this.drawInstructions(c, w, h);
      return;
    }
    if (gamePhase === "ending") {
      this.drawEnding(c, w, h);
      return;
    }

    if (gamePhase === "thinking") {
      this.drawThinkPrompt(c, w, h);
    }

    this.drawCups(c, w, h);

    if (this.ballVisible) {
      this.drawBall(c);
    }

    if (gamePhase === "reveal" || (this.phase === "reveal" && this.answerRevealed)) {
      this.drawAnswer(c, w, h);
    }

    if (gamePhase === "playing" || gamePhase === "thinking") {
      this.drawHint(c, w, h, gamePhase);
    }

    drawCorners(c, w, h, "#fbbf24");
  }

  private drawHook(c: CanvasRenderingContext2D, w: number, h: number): void {
    drawText(c, "FIND THE BALL", w / 2, h * 0.35, {
      fontSize: 72,
      color: "#fbbf24",
      fontWeight: "900",
      shadow: true,
    });
    drawText(c, "Follow the cups...", w / 2, h * 0.45, {
      fontSize: 44,
      color: "#ffffff",
      maxWidth: w * 0.8,
    });
    const pulse = 0.5 + 0.5 * Math.sin(this.phaseTimer * 4);
    c.save();
    c.globalAlpha = 0.3 + pulse * 0.5;
    drawText(c, "Can you track it?", w / 2, h * 0.55, {
      fontSize: 38,
      color: "#fbbf24",
    });
    c.restore();
  }

  private drawInstructions(c: CanvasRenderingContext2D, w: number, h: number): void {
    drawText(c, "Watch the ball", w / 2, h * 0.3, {
      fontSize: 56,
      color: "#fbbf24",
      fontWeight: "900",
    });
    drawText(c, "Cups will shuffle", w / 2, h * 0.4, {
      fontSize: 42,
      color: "#ffffff",
      maxWidth: w * 0.8,
    });
    drawText(c, "Find it at the end!", w / 2, h * 0.48, {
      fontSize: 42,
      color: "#ffffff",
      maxWidth: w * 0.8,
    });

    const t = clamp(this.phaseTimer / 1, 0, 1);
    const ease = easeOutBack(t);
    c.save();
    c.translate(w / 2, h * 0.65);
    c.scale(ease, ease);
    this.drawSingleCup(c, 0, 0, 100, 120, "#fbbf24");
    c.restore();
  }

  private drawThinkPrompt(c: CanvasRenderingContext2D, w: number, h: number): void {
    const remaining = Math.max(0, this.thinkTime - this.phaseTimer);
    drawText(c, "Where is it?", w / 2, h * 0.15, {
      fontSize: 56,
      color: "#fbbf24",
      fontWeight: "900",
    });
    drawText(c, `${Math.ceil(remaining)}`, w / 2, h * 0.22, {
      fontSize: 80,
      color: "#ffffff",
      fontWeight: "900",
    });
    drawProgressBar(c, w, h * 0.26, remaining / this.thinkTime, "#fbbf24");
  }

  private drawHint(c: CanvasRenderingContext2D, w: number, h: number, phase: string): void {
    if (phase === "playing") {
      drawText(c, "Watch carefully!", w / 2, h * 0.1, {
        fontSize: 44,
        color: "#fbbf24",
        fontWeight: "bold",
      });
    }
  }

  private drawCups(c: CanvasRenderingContext2D, _w: number, _h: number): void {
    const sorted = [...this.cups].sort((a, b) => a.y - b.y);
    for (const cup of sorted) {
      this.drawSingleCup(c, cup.x, cup.y, 90, 130, "#fbbf24", cup.id);
    }
  }

  private drawSingleCup(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    hgt: number,
    color: string,
    _id?: number
  ): void {
    c.save();
    c.translate(x, y);

    c.fillStyle = "rgba(0,0,0,0.3)";
    c.beginPath();
    c.ellipse(0, hgt / 2 + 8, w * 0.6, 10, 0, 0, Math.PI * 2);
    c.fill();

    const grad = c.createLinearGradient(-w, 0, w, 0);
    grad.addColorStop(0, "#d97706");
    grad.addColorStop(0.3, color);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, "#92400e");
    c.fillStyle = grad;

    c.beginPath();
    c.moveTo(-w * 0.7, -hgt / 2);
    c.lineTo(-w * 0.85, hgt / 2);
    c.lineTo(w * 0.85, hgt / 2);
    c.lineTo(w * 0.7, -hgt / 2);
    c.closePath();
    c.fill();

    c.fillStyle = "rgba(0,0,0,0.3)";
    c.beginPath();
    c.ellipse(0, -hgt / 2, w * 0.7, w * 0.2, 0, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = "rgba(255,255,255,0.2)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-w * 0.6, -hgt / 2 + 8);
    c.lineTo(-w * 0.75, hgt / 2 - 8);
    c.stroke();

    c.strokeStyle = "rgba(0,0,0,0.3)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-w * 0.7, -hgt / 2);
    c.lineTo(-w * 0.85, hgt / 2);
    c.lineTo(w * 0.85, hgt / 2);
    c.lineTo(w * 0.7, -hgt / 2);
    c.closePath();
    c.stroke();

    c.restore();
  }

  private drawBall(c: CanvasRenderingContext2D): void {
    c.save();
    c.translate(this.ballX, this.ballY);
    const r = 28;
    const grad = c.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    grad.addColorStop(0, "#fef3c7");
    grad.addColorStop(0.5, "#f87171");
    grad.addColorStop(1, "#991b1b");
    c.fillStyle = grad;
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.5)";
    c.beginPath();
    c.arc(-r * 0.3, -r * 0.3, r * 0.25, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  private drawAnswer(c: CanvasRenderingContext2D, w: number, h: number): void {
    const t = clamp(this.phaseTimer / 0.5, 0, 1);
    const alpha = clamp(t * 2, 0, 1);
    c.save();
    c.globalAlpha = alpha;
    drawText(c, "HERE IT IS!", w / 2, h * 0.12, {
      fontSize: 64,
      color: "#fbbf24",
      fontWeight: "900",
      shadow: true,
    });
    c.restore();
  }

  private drawEnding(c: CanvasRenderingContext2D, w: number, h: number): void {
    drawText(c, "Did you get it?", w / 2, h * 0.3, {
      fontSize: 56,
      color: "#fbbf24",
      fontWeight: "900",
    });
    drawText(c, "Comment your guess!", w / 2, h * 0.4, {
      fontSize: 42,
      color: "#ffffff",
      maxWidth: w * 0.8,
    });
    drawText(c, "Try Level 2!", w / 2, h * 0.5, {
      fontSize: 42,
      color: "#ffffff",
      maxWidth: w * 0.8,
    });
  }

  protected onInput(x: number, y: number): void {
    void x;
    void y;
  }

  protected onDestroy(): void {
    this.cups = [];
  }
}
