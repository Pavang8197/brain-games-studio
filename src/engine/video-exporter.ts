import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from "./render";
import type { GameContext, GameInstance, GameConfig, AudioEngineInterface } from "./types";
import type { VideoTimingConfig, GamePhase } from "./types";
import { audioEngine } from "./audio";

export interface ExportOptions {
  game: GameInstance;
  config: GameConfig;
  timing: VideoTimingConfig;
  fps?: number;
  onProgress?: (progress: number) => void;
}

export interface ExportResult {
  blob: Blob;
  duration: number;
  frames: number;
  width: number;
  height: number;
  hasAudio: boolean;
}

export interface FrameData {
  canvas: HTMLCanvasElement;
  phase: GamePhase;
}

export class VideoExporter {
  async export(opts: ExportOptions): Promise<ExportResult> {
    const fps = opts.fps ?? VIDEO_FPS;
    const canvas = document.createElement("canvas");
    canvas.width = VIDEO_WIDTH;
    canvas.height = VIDEO_HEIGHT;
    const ctx = canvas.getContext("2d", { alpha: false })!;

    const totalDuration =
      opts.timing.hookDuration +
      opts.timing.instructionsDuration +
      opts.timing.gameplayDuration +
      opts.timing.thinkDuration +
      opts.timing.revealDuration +
      opts.timing.endingDuration;

    const totalFrames = Math.ceil(totalDuration * fps);

    opts.game.init();
    opts.game.start();

    const phases: { phase: GamePhase; duration: number; text?: string }[] = [
      { phase: "hook", duration: opts.timing.hookDuration },
      { phase: "instructions", duration: opts.timing.instructionsDuration },
      { phase: "playing", duration: opts.timing.gameplayDuration },
      { phase: "thinking", duration: opts.timing.thinkDuration },
      { phase: "reveal", duration: opts.timing.revealDuration },
      { phase: "ending", duration: opts.timing.endingDuration },
    ];

    const gameCtx: GameContext = {
      canvas,
      ctx,
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
      timestamp: 0,
      phase: "idle",
      difficulty: opts.config.difficulty,
      config: opts.config,
      audio: audioEngine as unknown as AudioEngineInterface,
    };

    const frames: VideoFrame[] = [];
    let frameIdx = 0;
    let phaseIdx = 0;
    let phaseElapsed = 0;
    let phaseTime = 0;
    let globalElapsed = 0;
    const dt = 1 / fps;

    while (frameIdx < totalFrames) {
      if (phaseIdx >= phases.length) break;
      const currentPhase = phases[phaseIdx]!;
      phaseTime = currentPhase.duration;

      if (phaseElapsed >= phaseTime) {
        phaseIdx++;
        phaseElapsed = 0;
        continue;
      }

      gameCtx.phase = currentPhase.phase;
      gameCtx.timestamp = globalElapsed;
      phaseElapsed += dt;
      globalElapsed += dt;
      opts.game.update(dt, globalElapsed);

      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
      opts.game.render(gameCtx);

      const frame = new VideoFrame(canvas, {
        timestamp: (frameIdx * 1e6) / fps,
        duration: 1e6 / fps,
      });
      frames.push(frame);

      frameIdx++;
      opts.onProgress?.(frameIdx / totalFrames);
    }

    const result = await this.muxFrames(frames, fps);
    frames.forEach((f) => f.close());
    return result;
  }

  private async muxFrames(frames: VideoFrame[], fps: number): Promise<ExportResult> {
    const Muxer = await import("mp4-muxer");
    const muxer = new Muxer.Muxer({
      target: new Muxer.ArrayBufferTarget(),
      video: {
        codec: "avc",
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
        frameRate: fps,
      },
      fastStart: "in-memory",
    });

    let encoder: VideoEncoder | null = null;
    if (typeof VideoEncoder !== "undefined") {
      encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error("VideoEncoder error:", e),
      });
      encoder.configure({
        codec: "avc1.42e032",
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
        bitrate: 4_000_000,
        framerate: fps,
      });
    }

    if (encoder) {
      for (const frame of frames) {
        encoder.encode(frame, { keyFrame: frame.timestamp === 0 });
      }
      await encoder.flush();
    }

    muxer.finalize();
    const { buffer } = muxer.target as unknown as { buffer: ArrayBuffer };
    const blob = new Blob([buffer], { type: "video/mp4" });

    return {
      blob,
      duration: frames.length / fps,
      frames: frames.length,
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
      hasAudio: false,
    };
  }

  static isSupported(): boolean {
    return typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined";
  }
}
