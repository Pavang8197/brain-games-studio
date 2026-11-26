import { useEffect, useRef, useState, useCallback } from "react";
import type { BrainGame, GameConfig, GameInstance, GameContext, GamePhase, VideoTimingConfig } from "../engine/types";
import { audioEngine } from "../engine/audio";
import { drawBackground, drawCorners } from "../engine/render";
import { VIDEO_WIDTH, VIDEO_HEIGHT } from "../engine/render";

interface PreviewCanvasProps {
  game: BrainGame;
  config: GameConfig;
  timing: VideoTimingConfig;
  playing: boolean;
  onPhaseChange?: (phase: GamePhase) => void;
}

export function PreviewCanvas({ game, config, timing, playing, onPhaseChange }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<GameInstance | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [phase, setPhase] = useState<GamePhase>("idle");

  const totalDuration =
    timing.hookDuration + timing.instructionsDuration + timing.gameplayDuration +
    timing.thinkDuration + timing.revealDuration + timing.endingDuration;

  const getPhaseAt = useCallback((elapsed: number): GamePhase => {
    let t = 0;
    if (elapsed < (t += timing.hookDuration)) return "hook";
    if (elapsed < (t += timing.instructionsDuration)) return "instructions";
    if (elapsed < (t += timing.gameplayDuration)) return "playing";
    if (elapsed < (t += timing.thinkDuration)) return "thinking";
    if (elapsed < (t += timing.revealDuration)) return "reveal";
    if (elapsed < (t += timing.endingDuration)) return "ending";
    return "complete";
  }, [timing]);

  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const instance = game.createInstance(config);
    instanceRef.current = instance;
    instance.init();
    instance.start();
    startRef.current = performance.now();
    lastTimeRef.current = performance.now();

    const animate = () => {
      const now = performance.now();
      const elapsed = (now - startRef.current) / 1000;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      if (elapsed >= totalDuration) {
        const gameCtx: GameContext = {
          canvas, ctx, width: VIDEO_WIDTH, height: VIDEO_HEIGHT,
          timestamp: elapsed, phase: "complete", difficulty: config.difficulty,
          config, audio: audioEngine,
        };
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        drawBackground(ctx, VIDEO_WIDTH, VIDEO_HEIGHT, elapsed);
        drawCorners(ctx, VIDEO_WIDTH, VIDEO_HEIGHT, "#22d3ee");
        setPhase("complete");
        onPhaseChange?.("complete");
        return;
      }

      const currentPhase = getPhaseAt(elapsed);
      if (currentPhase !== phase) {
        setPhase(currentPhase);
        onPhaseChange?.(currentPhase);
        if (currentPhase === "reveal") audioEngine.playSound("reveal");
        if (currentPhase === "ending") audioEngine.playSound("end");
      }

      instance.update(dt, elapsed);

      const gameCtx: GameContext = {
        canvas, ctx, width: VIDEO_WIDTH, height: VIDEO_HEIGHT,
        timestamp: elapsed, phase: currentPhase, difficulty: config.difficulty,
        config, audio: audioEngine,
      };
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
      instance.render(gameCtx);

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      instance.destroy();
    };
  }, [playing, game, config, timing, totalDuration, getPhaseAt, onPhaseChange, phase]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const instance = instanceRef.current;
    if (!canvas || !instance) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = VIDEO_WIDTH / rect.width;
    const scaleY = VIDEO_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    instance.handleInput(x, y);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="w-full h-auto rounded-xl border border-border bg-black"
      style={{ aspectRatio: "9/16", maxHeight: "70vh" }}
    />
  );
}
