import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Layer 3 scroll-lock: Non-passive touchmove block kills iOS Safari rubber-banding.
// CSS alone (overflow:hidden, position:fixed) is insufficient on older iOS.
// { passive: false } is required to allow e.preventDefault() inside a touch handler.
document.addEventListener('touchmove', (e) => {
  // Allow touch scrolling if the user is swiping inside a dedicated scroll container
  const target = e.target as HTMLElement;
  if (target.closest('.scroll-container') || target.closest('.custom-scrollbar')) {
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

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
