import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  useContents?: boolean;
  disabled?: boolean;
}

interface Coords {
  top: number;
  left: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 0.2,
  className = '',
  useContents = false,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<Coords>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const target = useContents ? triggerRef.current.firstElementChild : triggerRef.current;
      if (!target) return;

      const rect = target.getBoundingClientRect();
      let top = 0;
      let left = 0;

      const offset = 10;

      switch (position) {
        case 'top':
          top = rect.top - offset;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + offset;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - offset;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + offset;
          break;
      }

      setCoords({ top, left });
    }
  }, [position, useContents]);

  const showTooltip = () => {
    if (disabled) return;
    updatePosition();
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay * 1000);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, updatePosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getFramerTransform = () => {
    switch (position) {
      case 'top':
        return { x: '-50%', y: '-100%' };
      case 'bottom':
        return { x: '-50%', y: '0%' };
      case 'left':
        return { x: '-100%', y: '-50%' };
      case 'right':
        return { x: '0%', y: '-50%' };
      default:
        return { x: '-50%', y: '-100%' };
    }
  };

  return (
    <div
      ref={triggerRef}
      className={className}
      style={{ 
        display: useContents ? 'contents' : 'inline-block',
        position: useContents ? undefined : 'relative'
      }}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {typeof document !== 'undefined' && !disabled && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, ...getFramerTransform() }}
              animate={{ opacity: 1, scale: 1, ...getFramerTransform() }}
              exit={{ opacity: 0, scale: 0.9, ...getFramerTransform() }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 99999,
                pointerEvents: 'none',
              }}
            >
              <div className="px-3 py-1.5 rounded-lg border border-white/10 shadow-2xl backdrop-blur-md bg-[#0a0a1a]/95">
                <div className="relative z-10 text-[12px] font-bold text-white whitespace-nowrap tracking-wide">
                  {content}
                </div>
                <div className="absolute inset-0 rounded-lg bg-indigo-500/20 blur-xl -z-10" />
                
                <div 
                  className={`absolute w-2 h-2 rotate-45 bg-[#0a0a1a] border-white/10 -z-10
                    ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b' : ''}
                    ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t' : ''}
                    ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-r border-t' : ''}
                    ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2 border-l border-b' : ''}
                  `}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default Tooltip;
