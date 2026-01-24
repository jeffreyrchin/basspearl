# GlitchBrain - Glitch Art Generator

Transform images into stunning glitch art in seconds with real-time effects and unlimited creative possibilities.

## Features

- 🎨 **10 Glitch Effects**: Pixel Sort, RGB Shift, Data Mosh, Deep Fry, and more
- ⚡ **Real-time Preview**: See effects instantly as you adjust parameters
- 🔐 **Firebase Auth**: Google + Email sign-in
- 💾 **Export Credits**: 5 free exports for anonymous users, unlimited for signed-in users
- 🎯 **Production-Ready UI**: Polished, responsive design

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase (Authentication)

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** → **Google** and **Email/Password**
3. Copy your Firebase config to `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production

```bash
npm run build
npm run preview
```

## Usage

1. **Upload an Image**: Drag and drop or click to select
2. **Apply Effects**: Toggle effects on/off, adjust intensity and threshold
3. **Export**: Download your glitched masterpiece

**Anonymous users**: Get 5 free exports per session  
**Signed-in users**: Unlimited exports!

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS + Custom CSS
- **Auth**: Firebase Authentication
- **Effects Engine**: Custom Canvas API-based glitch algorithms

## License

MIT
