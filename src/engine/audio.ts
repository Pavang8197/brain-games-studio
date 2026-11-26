import type { AudioEngineInterface, SoundType } from "./types";

export class AudioEngine implements AudioEngineInterface {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicNodes: OscillatorNode[] = [];
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private muted = false;
  private masterVolume = 0.8;
  private sfxVolume = 0.7;
  private musicVolume = 0.3;
  private recordingActive = false;
  private recordedSamples: Float32Array[] = [];
  private recordBuffer: AudioBuffer | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
      this.sfxGain.gain.value = this.sfxVolume;
      this.musicGain.gain.value = this.musicVolume;
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMasterVolume(v: number): void {
    this.masterVolume = v;
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : v;
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }

  setMusicVolume(v: number): void {
    this.musicVolume = v;
    if (this.musicGain) this.musicGain.gain.value = v;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : this.masterVolume;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private now(): number {
    return this.ctx!.currentTime;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    gain = 0.3,
    delay = 0,
    destination?: GainNode
  ): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = this.now() + delay;
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(gain, start + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(env);
    env.connect(destination ?? this.sfxGain!);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  private noise(duration: number, gain = 0.2, delay = 0): void {
    const ctx = this.ensureContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const env = ctx.createGain();
    env.gain.value = gain;
    source.connect(env);
    env.connect(this.sfxGain!);
    source.start(this.now() + delay);
  }

  playSound(type: SoundType, volume = 1): void {
    if (this.muted) return;
    this.ensureContext();
    const g = 0.3 * volume;
    switch (type) {
      case "click":
        this.tone(800, 0.05, "square", g * 0.5);
        break;
      case "pop":
        this.tone(600, 0.08, "sine", g);
        this.tone(900, 0.06, "sine", g * 0.5, 0.02);
        break;
      case "tick":
        this.tone(1200, 0.03, "square", g * 0.4);
        break;
      case "countdown":
        this.tone(440, 0.15, "triangle", g);
        break;
      case "start":
        this.tone(523, 0.1, "triangle", g);
        this.tone(659, 0.1, "triangle", g, 0.1);
        this.tone(784, 0.2, "triangle", g, 0.2);
        break;
      case "correct":
        this.tone(523, 0.1, "triangle", g);
        this.tone(659, 0.1, "triangle", g, 0.08);
        this.tone(784, 0.15, "triangle", g, 0.16);
        this.tone(1047, 0.3, "triangle", g, 0.24);
        break;
      case "wrong":
        this.tone(200, 0.2, "sawtooth", g * 0.6);
        this.tone(150, 0.3, "sawtooth", g * 0.6, 0.1);
        break;
      case "reveal":
        this.tone(440, 0.1, "triangle", g * 0.5);
        this.tone(554, 0.1, "triangle", g * 0.5, 0.08);
        this.tone(659, 0.2, "triangle", g, 0.16);
        break;
      case "victory":
        this.tone(523, 0.12, "triangle", g);
        this.tone(659, 0.12, "triangle", g, 0.1);
        this.tone(784, 0.12, "triangle", g, 0.2);
        this.tone(1047, 0.4, "triangle", g, 0.3);
        this.tone(1319, 0.4, "triangle", g * 0.7, 0.3);
        break;
      case "shuffle":
        this.noise(0.05, g * 0.3);
        break;
      case "whoosh":
        this.noise(0.15, g * 0.2);
        break;
      case "suspense":
        this.tone(110, 0.5, "sawtooth", g * 0.3);
        this.tone(165, 0.5, "sawtooth", g * 0.2, 0.1);
        break;
      case "end":
        this.tone(784, 0.15, "triangle", g);
        this.tone(659, 0.15, "triangle", g, 0.12);
        this.tone(523, 0.3, "triangle", g, 0.24);
        break;
    }
  }

  startMusic(): void {
    if (this.musicInterval) return;
    const ctx = this.ensureContext();
    const tempo = 120;
    const beatDuration = 60 / tempo;
    const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];
    let step = 0;

    const playStep = () => {
      if (this.muted) return;
      const freq = notes[step % notes.length]!;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const start = ctx.currentTime;
      env.gain.setValueAtTime(0, start);
      env.gain.linearRampToValueAtTime(0.15, start + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, start + beatDuration * 0.8);
      osc.connect(env);
      env.connect(this.musicGain!);
      osc.start(start);
      osc.stop(start + beatDuration);

      const bass = ctx.createOscillator();
      const bassEnv = ctx.createGain();
      bass.type = "sine";
      bass.frequency.value = freq / 2;
      bassEnv.gain.setValueAtTime(0, start);
      bassEnv.gain.linearRampToValueAtTime(0.1, start + 0.02);
      bassEnv.gain.exponentialRampToValueAtTime(0.001, start + beatDuration);
      bass.connect(bassEnv);
      bassEnv.connect(this.musicGain!);
      bass.start(start);
      bass.stop(start + beatDuration + 0.05);

      step++;
    };

    playStep();
    this.musicInterval = setInterval(playStep, beatDuration * 1000);
  }

  stopMusic(): void {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.musicNodes.forEach((n) => {
      try { n.stop(); } catch { /* already stopped */ }
    });
    this.musicNodes = [];
  }

  destroy(): void {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioEngine = new AudioEngine();
