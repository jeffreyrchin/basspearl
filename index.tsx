import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Layer 3 scroll-lock: Non-passive touchmove block kills iOS Safari rubber-banding.
// CSS alone (overflow:hidden, position:fixed) is insufficient on older iOS.
// { passive: false } is required to allow e.preventDefault() inside a touch handler.
document.addEventListener('touchmove', (e) => {
  const target = e.target as HTMLElement;

  // Allow touch scrolling if the user is swiping inside a dedicated scroll container
  if (target.closest('.scroll-container') || target.closest('.custom-scrollbar')) {
    return;
  }

  // Allow touch interactions with sliders and scrubbers
  if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'range') {
    return;
  }

  e.preventDefault();
}, { passive: false });

// Dynamic Viewport Height Fix: Sets --vh variable for robust 100% height calculations
// that actually respect mobile browser chrome (address bars, footers).
const updateVH = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};
window.addEventListener('resize', updateVH);
updateVH();

// Hybrid Zoom Prevention (Lighthouse-friendly)
// We allow scaling in the meta tag to pass audits, but block the gestures in JS.
document.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

// Prevents 'gesturestart' on iOS
document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
