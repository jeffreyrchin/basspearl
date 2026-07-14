# basspearl | Browser-Based Audio-Reactive Visual Synthesizer

Turn your sound into animated 2D/3D visuals. basspearl is an open-source, AI-powered audio visualizer and animation editor for musicians, artists, DJs, VJs, content creators, and more! Built entirely for the web, it processes all audio analysis, WebGL rendering, and MP4 video export client-side in the browser.

---

## Features

- **Rich FX Library**: 100+ high-performance visual effects (Channel Shift, Wave Distortion, Tri Crush, Tunnel Warp, particle fields, 3D objects, and more) categorized into patterns, modifiers, and presets.
- **Dynamic Audio Analysis**: Sub-frame audio processing that splits sound into Sub, Bass, Mid, and Treble ranges.
- **Granular Reactivity**: Map any effect parameter (intensity, speed, size) to a specific frequency band or lock them to static values.
- **Interactive Puzzles**: Solve interactive effect configuration puzzles to unlock additional macros/presets.
- **Privacy-First Design**: All rendering and processing is local. Your music and image assets never leave your device.
- **Hardware-Accelerated Export**: Export your animations directly to high-definition MP4 files in the browser, powered by the `mediabunny` encoder.
- **Multi-Scene Workspace**: Edit and manage scenes with configurable transitions (crossfade, fade-to-black, zoom fade, etc.).
- **Pro DJ/VJ Controls**: Extensive keyboard shortcuts for accessibility, live control, effect grouping, duplicating, and drag-and-drop effect reordering.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) + Custom CSS
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Drag-and-Drop**: [@dnd-kit](https://dnd-kit.com/)
- **Graphics & Rendering**: [Three.js](https://threejs.org/) + WebGL Custom Shaders
- **Video Encoding**: `mediabunny` (WebGL canvas recorder)
- **Authentication**: [Firebase Auth](https://firebase.google.com/) (Google & Email/Password)
- **Deployment & API**: [Cloudflare Pages](https://pages.cloudflare.com/) + Cloudflare Pages Functions
- **Payments Integration**: [Lemon Squeezy](https://www.lemonsqueezy.com/) (Lifetime Pro webhook processing)
- **Testing**: [Vitest](https://vitest.dev/)

---

## Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/jeffreyrchin/basspearl.git
cd basspearl
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory and copy the contents from `.env.example`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Lemon Squeezy checkout link (for Lifetime Pro tier checkout button)
VITE_LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/product-id
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run Test Suite

```bash
npm run test
```

### 5. Build for Production

```bash
npm run build
npm run preview
```

---

## VJ & DJ Keyboard Shortcuts

### Playback & Timeline
| Key | Action |
| --- | --- |
| `Space` | Play / Pause audio playback |
| `←` / `→` | Seek backward/forward 5 seconds |
| `Shift` + `←` / `→` | Seek backward/forward 10 seconds |
| `J` / `L` | Seek backward/forward 10 seconds |

### Interface Toggle
| Key | Action |
| --- | --- |
| `H` | Hide / Show User Interface (Full Screen Preview) |
| `Esc` | Show UI / Close active modals |
| `P` | Toggle Sidebar |
| `I` | Toggle Inspector |
| `Y` | Toggle Library |
| `K` | Toggle Scene Bar |

### Effect Editing (Sidebar)
| Key | Action |
| --- | --- |
| `Mod + A` | Select all effects in the active scene |
| `Mod + D` | Duplicate selected effects |
| `Mod + G` | Group selected effects into an effect group |
| `Mod + Shift + G` | Ungroup selected effect group |
| `Delete` / `Backspace` | Remove selected effects |
| `Esc` | Clear active selection |
| `O` | Insert new Image |
| `C` | Insert new Color |
| `M` | Insert new Move-Scale |

### Scenes & History
| Key | Action |
| --- | --- |
| `1` - `9` | Switch to Scene 1 through 9 |
| `[` | Navigate to the previous scene |
| `]` | Navigate to the next scene |
| `Mod + Z` | Undo the last action |
| `Mod + Shift + Z` | Redo the last undone action |

*(Note: `Mod` refers to `⌘ Command` on macOS and `Ctrl` on Windows/Linux)*

---

## 🤝 Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](./CONTRIBUTING.md) to learn about our style guidelines, folder structure, and submission process.

## License

This project is licensed under the [MIT License](LICENSE).
