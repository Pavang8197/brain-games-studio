# Brain Games Studio — Windows Setup Instructions

Run **Brain Games Studio** locally on Windows 10 or Windows 11 with zero native FFmpeg installation required (MP4 H.264 + AAC encoding runs directly in Chrome or Microsoft Edge).

## 1. Prerequisites

1. **Node.js 20 LTS or newer** (or **Bun 1.2+**):
   - Download Node.js LTS from https://nodejs.org/ and run the installer with default options.
   - Verify in PowerShell or Command Prompt:
     ```powershell
     node -v
     npm -v
     ```
2. **Modern Chromium browser**: Google Chrome or Microsoft Edge (latest version) for hardware-accelerated WebCodecs H.264 + AAC MP4 export. (Firefox and browsers without native AAC WebCodecs automatically fall back to built-in FFmpeg.wasm.)

## 2. Extract and Install

1. Unzip `brain-games-studio-source.zip` to a folder such as `C:\BrainGamesStudio`.
2. Open **PowerShell** inside `C:\BrainGamesStudio` and install dependencies:
   ```powershell
   npm install
   ```
   *(If you use Bun: `bun install`)*

## 3. Start Brain Games Studio

Run the local development server:

```powershell
npm run dev
```

Open the URL printed in the terminal (default: `http://localhost:8080`) in **Google Chrome** or **Microsoft Edge**.

## 4. Generate and Export a Video

1. Pick a preset (**Easy**, **Medium**, **Hard**) or customize cups (3–8), balls (1–4), swaps (1–20), speed, reveal duration (>= 2s), countdown, duration (30–60s), resolution (`1080×1920` or `720×1280`), theme, cup color, and ball color.
2. Optionally edit the **Voiceover Script** or upload a recorded `.mp3` / `.wav` / `.m4a` voiceover file.
3. Click **Preview** to watch and hear the full deterministic game before exporting.
4. Click **Export Video (MP4)** — the studio renders every frame at exact 30 FPS timestamps, mixes all enabled audio tracks, validates the MP4 container/codecs, and downloads a ready-to-upload `.mp4` for YouTube Shorts and Instagram Reels.

## 5. Run Automated Tests

```powershell
npm test
```

This executes the Vitest suite covering deterministic cup identity tracking, pre-shuffle ball reveal guarantees, multi-ball tracking, 30/35/40/45/60s timelines, audio mixing, and MP4 binary validation.

## 6. Optional Production Build

```powershell
npm run build
```