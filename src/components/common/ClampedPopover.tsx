import React, { ReactNode, RefObject, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ClampedPopoverProps {
  /** The cell/button the popover belongs to. */
  anchor: HTMLElement | null;
  children: ReactNode;
  /** Preferred width in px; the popover is clamped to the viewport. */
  width?: number;
  className?: string;
  /** Attach the existing outside-click ref so clicks inside don't commit. */
  popoverRef?: RefObject<HTMLDivElement | null>;
}

const MARGIN = 8;

/**
 * Renders popover content in a portal with fixed positioning clamped to the
 * viewport. Keeps inline editors usable at 960×640 without clipping or
 * horizontal page scroll (Đợt 10.3.1).
 */
export const ClampedPopover: React.FC<ClampedPopoverProps> = ({
  anchor,
  children,
  width = 288,
  className = '',
  popoverRef,
}) => {
  const [style, setStyle] = useState<React.CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!anchor) {
      setStyle(null);
      return;
    }

    const update = () => {
      const rect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth || 960;
      const viewportHeight = window.innerHeight || 640;
      const maxLeft = Math.max(MARGIN, viewportWidth - width - MARGIN);
      const left = Math.min(Math.max(MARGIN, rect.left), maxLeft);
      const top = Math.min(Math.max(MARGIN, rect.top), Math.max(MARGIN, viewportHeight - 180));

      setStyle({
        position: 'fixed',
        left,
        top,
        width,
        maxHeight: Math.max(180, viewportHeight - top - MARGIN),
        overflowY: 'auto',
        zIndex: 60,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchor, width]);

  if (!anchor || !style) return null;

  return createPortal(
    <div ref={popoverRef} style={style} className={className} data-testid="clamped-popover">
      {children}
    </div>,
    document.body
  );
};
