# Contributing to basspearl

Thank you for your interest in contributing to **basspearl**! As an open-source, client-side audio-reactive visual synthesizer, we welcome contributions from developers, designers, VJs, musicians, and creators of all backgrounds.

This guide outlines our development workflow, coding style, and pull request guidelines to help you get started quickly.

---

## Code of Conduct

We are committed to fostering a welcoming, respectful, and inclusive community. Please be polite, collaborative, and constructive in all discussions, issues, and pull requests.

---

## Project Structure

Getting familiar with the directory structure will help you locate the files you need to modify:

```text
├── components/          # React UI components (Modals, Panels, Menus, etc.)
│   └── content/         # Page content (About, Help, etc.)
├── config/              # Configuration files for visual effects, macros, puzzles, etc.
├── context/             # React Contexts (e.g., AuthContext)
├── functions/           # Cloudflare Pages Functions (Serverless backend API)
│   └── api/
│       ├── feedback.ts  # Feedback collection handler
│       └── webhook/     # Payment webhooks (Lemon Squeezy integration)
├── hooks/               # Custom React hooks
├── services/            # Core business logic and engines
│   ├── glitchEngine.ts  # Canvas WebGL/Three.js effect rendering engine
│   ├── exportService.ts # Hardware-accelerated MP4 encoder integration (uses mediabunny)
│   └── puzzleService.ts # Gameplay service logic
├── store/               # Zustand state stores
├── types.ts             # Unified TypeScript declarations for effects, frequency bands, macros, etc.
├── index.css            # Global CSS styles (TailwindCSS v4)
└── wrangler.jsonc       # Cloudflare Pages configuration
```

---

## Local Development Setup

To set up a local development environment, follow these steps:

1. **Prerequisites**: Ensure you have Node.js (v18+) and `npm` installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Configuration**:
   - Copy `.env.example` to `.env.local`.
   - Set up a [Firebase](https://firebase.google.com/) project and retrieve your web configuration details to enable user authentication.
   - Fill in details for Google Analytics and Lemon Squeezy if you plan to test payment or telemetry features locally.
4. **Run Dev Server**:
   ```bash
   npm run dev
   ```
5. **Run Tests**:
   - We use [Vitest](https://vitest.dev/) for unit and integration testing:
     ```bash
     npm run test       # Run test suite once
     npm run test:watch # Run tests in interactive watch mode
     ```

---

## Coding Guidelines

### 1. TypeScript & Typings
- Avoid `any` at all costs. Use strong interfaces, generics, or unions.
- All visual effect types, frequency bands, and presets should be registered under [types.ts](./types.ts).
- Keep effect configurations documented in [config/effects.ts](./config/effects.ts) and presets in [config/macros.ts](./config/macros.ts).

### 2. State Management (Zustand)
- We use Zustand for fast, reactive, out-of-component state updates (e.g., [store/useEffectStore.ts](./store/useEffectStore.ts)).
- Store selectors should be used inside React components to prevent unnecessary re-renders.
  ```typescript
  // Preferred: Select specific store properties
  const isMobile = useEffectStore((s) => s.isMobile);
  ```
- Local UI state (e.g., whether a specific drop-down is open inside a card) should remain in React `useState`.

### 3. Styling & Layout
- We use **TailwindCSS v4**.
- Global Tailwind configurations and custom CSS components are placed in [index.css](./index.css).
- When developing UI elements, keep the design clean, responsive, and aligned with the main theme.

### 4. GPU-Accelerated Effects & Shaders
- Canvas rendering is implemented under [services/glitchEngine.ts](./services/glitchEngine.ts).
- When adding a new WebGL pattern or effect, register the enum value in `GlitchEffectType` in `types.ts`, configure its parameters in `effects.ts`, and add its WebGL implementation to `glitchShaders.ts`, or `ThreeJSEffects.ts` for Three.js effects.

---

## Commit Messages

We encourage the use of [Conventional Commits](https://www.conventionalcommits.org/) to keep our git history clean and readable:

- `feat: add spectral map effect` (New feature)
- `fix: prevent audio sync jitter when changing frequency bands` (Bug fix)
- `docs: update setup steps in readme` (Documentation changes)
- `style: fix alignment of pro-tier pricing modal` (Styling tweaks)
- `test: add unit test for language translation service` (Testing updates)
- `refactor: clean up Three.js initialization logic` (Code reorganization)

---

## Submitting a Pull Request

1. **Fork the Repository** and clone your fork locally.
2. **Create a Branch** off of `main`:
   ```bash
   git checkout -b feature/your-awesome-feature
   # or
   git checkout -b bugfix/fix-some-bug
   ```
3. **Commit your changes** with a meaningful commit message.
4. **Add Tests** for any new features or bug fixes.
5. **Verify the code builds and tests pass**:
   ```bash
   npm run test
   npm run build
   ```
6. **Push to your fork** and submit a Pull Request (PR) to the `main` branch of the official repository.
7. **PR Review**: Our maintainers will review your PR. Be ready to address feedback and update your branch accordingly.

Thank you again for making **basspearl** a better visual tool for everyone!
