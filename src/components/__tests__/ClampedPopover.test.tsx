import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClampedPopover } from '../common/ClampedPopover';

function makeAnchor(left: number, top: number): HTMLButtonElement {
  const anchor = document.createElement('button');
  anchor.getBoundingClientRect = () =>
    ({
      left,
      top,
      right: left + 40,
      bottom: top + 20,
      width: 40,
      height: 20,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
  return anchor;
}

describe('ClampedPopover (Đợt 10.3.1)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 960 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 640 });
  });

  it('clamps a right/bottom-edge anchor inside a 960×640 viewport', () => {
    const anchor = makeAnchor(900, 600);
    render(
      <ClampedPopover anchor={anchor} width={288}>
        <div>Nội dung popover</div>
      </ClampedPopover>
    );

    const popover = screen.getByTestId('clamped-popover');
    expect(popover.style.position).toBe('fixed');
    expect(parseFloat(popover.style.left)).toBeLessThanOrEqual(960 - 288 - 8);
    expect(parseFloat(popover.style.left)).toBeGreaterThanOrEqual(8);
    expect(parseFloat(popover.style.top)).toBeLessThanOrEqual(640 - 180);
    expect(parseFloat(popover.style.top)).toBeGreaterThanOrEqual(8);
    expect(parseFloat(popover.style.maxHeight)).toBeGreaterThanOrEqual(180);
  });

  it('renders in a portal outside the app container', () => {
    const anchor = makeAnchor(20, 20);
    const { container } = render(
      <ClampedPopover anchor={anchor} width={256}>
        <div>Portal content</div>
      </ClampedPopover>
    );

    const popover = screen.getByTestId('clamped-popover');
    expect(container.contains(popover)).toBe(false);
    expect(document.body.contains(popover)).toBe(true);
    expect(popover.textContent).toContain('Portal content');
  });

  it('renders nothing without an anchor', () => {
    render(
      <ClampedPopover anchor={null} width={256}>
        <div>Never shown</div>
      </ClampedPopover>
    );
    expect(screen.queryByTestId('clamped-popover')).toBeNull();
  });
});
