import { roundRect, hexToRgba } from "./utils";

export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;

export function createVideoCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = VIDEO_WIDTH;
  canvas.height = VIDEO_HEIGHT;
  return canvas;
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  accentColor = "#22d3ee"
): void {
  const gradient = ctx.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.5, h * 0.8);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(0.5, "#0f0f1e");
  gradient.addColorStop(1, "#08080f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  const gridSize = 80;
  const offset = (time * 20) % gridSize;
  for (let x = -offset; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = -offset; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  y: number,
  progress: number,
  color = "#22d3ee"
): void {
  const barH = 6;
  const barW = w * 0.8;
  const barX = (w - barW) / 2;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(ctx, barX, y, barW, barH, 3);
  ctx.fill();
  ctx.fillStyle = color;
  if (progress > 0) {
    roundRect(ctx, barX, y, barW * progress, barH, 3);
    ctx.fill();
  }
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    fontSize?: number;
    color?: string;
    fontWeight?: string;
    align?: CanvasTextAlign;
    maxWidth?: number;
    lineHeight?: number;
    shadow?: boolean;
  } = {}
): void {
  const {
    fontSize = 48,
    color = "#ffffff",
    fontWeight = "bold",
    align = "center",
    maxWidth,
    lineHeight = 1.3,
    shadow = true,
  } = opts;

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
  }

  if (maxWidth) {
    const lines = wrapText(ctx, text, maxWidth);
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * fontSize * lineHeight);
    });
  } else {
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = "#22d3ee",
  fontSize = 32
): void {
  ctx.save();
  ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const padding = 24;
  const w = metrics.width + padding * 2;
  const h = fontSize + 20;
  ctx.fillStyle = hexToRgba(color, 0.15);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "transparent";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawTimer(
  ctx: CanvasRenderingContext2D,
  w: number,
  y: number,
  seconds: number,
  total: number,
  color = "#22d3ee"
): void {
  drawText(ctx, `${seconds.toFixed(1)}s`, w / 2, y, {
    fontSize: 40,
    color,
    fontWeight: "900",
  });
  drawProgressBar(ctx, w, y + 30, 1 - seconds / total, color);
}

export function drawCorners(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string
): void {
  const len = 50;
  const margin = 30;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const corners = [
    [margin, margin, 1, 1],
    [w - margin, margin, -1, 1],
    [margin, h - margin, 1, -1],
    [w - margin, h - margin, -1, -1],
  ];
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * len, y);
    ctx.stroke();
  }
  ctx.restore();
}
