import { useState, useCallback, useMemo } from "react";
import {
  Gamepad2, Play, Pause, RotateCcw, Download, Volume2, VolumeX,
  Settings, Eye, Clock, Music, Zap, Grid3x3, ListOrdered, Eye as EyeIcon,
  Palette, Hash, Sigma, Combine, CupSoda, Trophy, ChevronRight, Sparkles,
} from "lucide-react";
import { GAMES, getDefaultTiming, getGamesByCategory } from "./engine/registry";
import { getGameById } from "./engine/registry";
import type { BrainGame, GameCategory, GameConfig, Difficulty, GamePhase, VideoTimingConfig } from "./engine/types";
import { DIFFICULTY_ORDER, DIFFICULTY_LABELS, CATEGORY_LABELS, CATEGORY_COLORS } from "./engine/types";
import { audioEngine } from "./engine/audio";
import { VideoExporter } from "./engine/video-exporter";
import { PreviewCanvas } from "./components/preview-canvas";

const ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  CupSoda, Grid3x3, ListOrdered, Eye, Palette, Zap, Hash, Sigma, Combine,
};

const CATEGORIES: GameCategory[] = ["memory", "visual", "reaction", "logic"];

export default function App() {
  const [selectedGameId, setSelectedGameId] = useState<string>("find-the-ball");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [muted, setMuted] = useState(false);
  const [masterVol, setMasterVol] = useState(0.8);
  const [sfxVol, setSfxVol] = useState(0.7);
  const [musicVol, setMusicVol] = useState(0.3);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(true);
  const [exportResult, setExportResult] = useState<{ duration: number; frames: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"library" | "config" | "export">("library");

  const selectedGame = useMemo(() => getGameById(selectedGameId)!, [selectedGameId]);

  const [timing, setTiming] = useState<VideoTimingConfig>(() => getDefaultTiming(selectedGame));

  const gameConfig: GameConfig = useMemo(() => ({
    difficulty,
    duration: timing.gameplayDuration,
  }), [difficulty, timing.gameplayDuration]);

  const handleSelectGame = useCallback((game: BrainGame) => {
    setPlaying(false);
    setPhase("idle");
    setExportUrl(null);
    setExportResult(null);
    setSelectedGameId(game.id);
    setTiming(getDefaultTiming(game));
  }, []);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setPlaying(false);
    setPhase("idle");
    setDifficulty(d);
  }, []);

  const handlePlay = useCallback(() => {
    setExportUrl(null);
    setPhase("idle");
    setPlaying(true);
    if (!muted) {
      audioEngine.setMuted(false);
      audioEngine.playSound("start");
      if (timing.backgroundMusic) {
        audioEngine.startMusic();
      }
    }
  }, [muted, timing.backgroundMusic]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    audioEngine.stopMusic();
  }, []);

  const handleRestart = useCallback(() => {
    setPlaying(false);
    setPhase("idle");
    audioEngine.stopMusic();
    setTimeout(() => {
      setPlaying(true);
      if (!muted) {
        audioEngine.playSound("start");
        if (timing.backgroundMusic) audioEngine.startMusic();
      }
    }, 50);
  }, [muted, timing.backgroundMusic]);

  const handleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    audioEngine.setMuted(next);
    if (next) audioEngine.stopMusic();
  }, [muted]);

  const handleMasterVol = useCallback((v: number) => {
    setMasterVol(v);
    audioEngine.setMasterVolume(v);
  }, []);

  const handleSfxVol = useCallback((v: number) => {
    setSfxVol(v);
    audioEngine.setSfxVolume(v);
  }, []);

  const handleMusicVol = useCallback((v: number) => {
    setMusicVol(v);
    audioEngine.setMusicVolume(v);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportProgress(0);
    setExportUrl(null);
    setExportResult(null);
    audioEngine.stopMusic();

    try {
      const instance = selectedGame.createInstance(gameConfig);
      const exporter = new VideoExporter();
      const result = await exporter.export({
        game: instance,
        config: gameConfig,
        timing,
        fps: 30,
        onProgress: (p) => setExportProgress(p),
      });
      const url = URL.createObjectURL(result.blob);
      setExportUrl(url);
      setExportResult({ duration: result.duration, frames: result.frames });
      instance.destroy();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Video export failed. Your browser may not support WebCodecs. Try Chrome or Edge.");
    } finally {
      setExporting(false);
    }
  }, [selectedGame, gameConfig, timing]);

  const totalDuration = useMemo(() => {
    return timing.hookDuration + timing.instructionsDuration + timing.gameplayDuration +
      timing.thinkDuration + timing.revealDuration + timing.endingDuration;
  }, [timing]);

  const updateTiming = useCallback((key: keyof VideoTimingConfig, value: string | number | boolean) => {
    setTiming((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 glow-primary">
              <Gamepad2 className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Brain Games Studio</h1>
              <p className="text-xs text-muted-foreground">YouTube Shorts & Reels Creator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMute}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          {/* Left: Preview + Controls */}
          <div className="space-y-4">
            {/* Preview */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-primary" />
                  <h2 className="font-bold">Live Preview</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>9:16 • 1080×1920</span>
                  {phase !== "idle" && phase !== "complete" && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-primary">
                      {phase}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-center">
                <PreviewCanvas
                  game={selectedGame}
                  config={gameConfig}
                  timing={timing}
                  playing={playing}
                  onPhaseChange={setPhase}
                />
              </div>
              {/* Controls */}
              <div className="mt-4 flex items-center justify-center gap-3">
                {!playing ? (
                  <button
                    onClick={handlePlay}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground transition-all hover:scale-105 glow-primary"
                  >
                    <Play size={20} /> Play
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-2 rounded-xl bg-muted px-6 py-2.5 font-bold transition-all hover:scale-105"
                  >
                    <Pause size={20} /> Pause
                  </button>
                )}
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 font-bold transition-all hover:bg-muted"
                >
                  <RotateCcw size={18} /> Restart
                </button>
              </div>
            </div>

            {/* Export Section */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Download size={18} className="text-accent" />
                <h2 className="font-bold">Export Video</h2>
              </div>
              {exporting ? (
                <div className="space-y-2">
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${exportProgress * 100}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Rendering frames... {Math.round(exportProgress * 100)}%
                  </p>
                </div>
              ) : exportUrl ? (
                <div className="space-y-3">
                  <video
                    src={exportUrl}
                    controls
                    className="w-full rounded-xl border border-border"
                    style={{ maxHeight: "400px" }}
                  />
                  {exportResult && (
                    <p className="text-center text-xs text-muted-foreground">
                      {exportResult.frames} frames • {exportResult.duration.toFixed(1)}s • MP4
                    </p>
                  )}
                  <div className="flex gap-2">
                    <a
                      href={exportUrl}
                      download={`brain-game-${selectedGameId}-${difficulty}.mp4`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-bold text-accent-foreground transition-all hover:scale-105"
                    >
                      <Download size={18} /> Download MP4
                    </a>
                    <button
                      onClick={handleExport}
                      className="rounded-xl border border-border px-4 py-2.5 font-bold transition-all hover:bg-muted"
                    >
                      Re-export
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-bold">{totalDuration}s</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Resolution</span>
                    <span className="font-bold">1080×1920</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">FPS</span>
                    <span className="font-bold">30</span>
                  </div>
                  <button
                    onClick={handleExport}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-accent-foreground transition-all hover:scale-[1.02] glow-accent"
                  >
                    <Download size={20} /> Export MP4
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
              {([
                { id: "library", label: "Games", icon: Gamepad2 },
                { id: "config", label: "Config", icon: Settings },
                { id: "export", label: "Timing", icon: Clock },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                    activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Library Tab */}
            {activeTab === "library" && (
              <div className="space-y-4">
                {CATEGORIES.map((cat) => {
                  const games = getGamesByCategory(cat);
                  if (games.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: CATEGORY_COLORS[cat] }}
                        />
                        {CATEGORY_LABELS[cat]}
                      </h3>
                      <div className="space-y-2">
                        {games.map((game) => {
                          const Icon = ICONS[game.icon] ?? Gamepad2;
                          const isSelected = game.id === selectedGameId;
                          return (
                            <button
                              key={game.id}
                              onClick={() => handleSelectGame(game)}
                              className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/10 glow-primary"
                                  : "border-border bg-card hover:border-primary/50"
                              }`}
                            >
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                                style={{
                                  background: `${CATEGORY_COLORS[game.category]}20`,
                                  color: CATEGORY_COLORS[game.category],
                                }}
                              >
                                <Icon size={20} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-bold">{game.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{game.description}</p>
                              </div>
                              {isSelected && <Sparkles size={16} className="text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Config Tab */}
            {activeTab === "config" && (
              <div className="space-y-4">
                {/* Difficulty */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 font-bold">Difficulty</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {DIFFICULTY_ORDER.map((d) => (
                      <button
                        key={d}
                        onClick={() => handleDifficultyChange(d)}
                        className={`rounded-lg border p-3 text-center transition-all ${
                          difficulty === d
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <p className="font-bold">{DIFFICULTY_LABELS[d]}</p>
                        <p className="text-xs text-muted-foreground">{selectedGame.difficultyConfigs[d].label}</p>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {selectedGame.difficultyConfigs[difficulty].description}
                  </p>
                </div>

                {/* Audio Settings */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-bold">
                    <Volume2 size={16} /> Audio
                  </h3>
                  <div className="space-y-3">
                    <VolumeSlider label="Master" value={masterVol} onChange={handleMasterVol} />
                    <VolumeSlider label="Sound Effects" value={sfxVol} onChange={handleSfxVol} />
                    <VolumeSlider label="Music" value={musicVol} onChange={handleMusicVol} />
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={timing.backgroundMusic}
                      onChange={(e) => updateTiming("backgroundMusic", e.target.checked)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span className="flex items-center gap-1.5">
                      <Music size={14} /> Background Music
                    </span>
                  </label>
                </div>

                {/* Hook Text */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-2 font-bold">Hook Text</h3>
                  <input
                    type="text"
                    value={timing.hookText}
                    onChange={(e) => updateTiming("hookText", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedGame.hookTexts.map((text) => (
                      <button
                        key={text}
                        onClick={() => updateTiming("hookText", text)}
                        className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ending Text */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-2 font-bold">Ending Text</h3>
                  <input
                    type="text"
                    value={timing.endingText}
                    onChange={(e) => updateTiming("endingText", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedGame.endingTexts.map((text) => (
                      <button
                        key={text}
                        onClick={() => updateTiming("endingText", text)}
                        className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Timing Tab */}
            {activeTab === "export" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 font-bold">Video Timing (seconds)</h3>
                  <div className="space-y-3">
                    <TimingSlider label="Hook" value={timing.hookDuration} min={1} max={5} step={0.5}
                      onChange={(v) => updateTiming("hookDuration", v)} color="oklch(0.72 0.18 200)" />
                    <TimingSlider label="Instructions" value={timing.instructionsDuration} min={1} max={8} step={0.5}
                      onChange={(v) => updateTiming("instructionsDuration", v)} color="oklch(0.75 0.22 60)" />
                    <TimingSlider label="Gameplay" value={timing.gameplayDuration} min={3} max={30} step={1}
                      onChange={(v) => updateTiming("gameplayDuration", v)} color="oklch(0.55 0.2 160)" />
                    <TimingSlider label="Think" value={timing.thinkDuration} min={1} max={8} step={0.5}
                      onChange={(v) => updateTiming("thinkDuration", v)} color="oklch(0.7 0.19 145)" />
                    <TimingSlider label="Reveal" value={timing.revealDuration} min={2} max={8} step={0.5}
                      onChange={(v) => updateTiming("revealDuration", v)} color="oklch(0.78 0.17 75)" />
                    <TimingSlider label="Ending" value={timing.endingDuration} min={2} max={8} step={0.5}
                      onChange={(v) => updateTiming("endingDuration", v)} color="oklch(0.65 0.22 25)" />
                  </div>
                  <div className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-center">
                    <p className="text-xs text-muted-foreground">Total Duration</p>
                    <p className="text-2xl font-black text-primary">{totalDuration}s</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-2 flex items-center gap-2 font-bold">
                    <Trophy size={16} /> Score Display
                  </h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={timing.showScore}
                      onChange={(e) => updateTiming("showScore", e.target.checked)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    Show score in ending
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function VolumeSlider({ label, value, onChange }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

function TimingSlider({ label, value, min, max, step, onChange, color }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold" style={{ color }}>{value}s</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{ accentColor: color }}
      />
    </div>
  );
}
