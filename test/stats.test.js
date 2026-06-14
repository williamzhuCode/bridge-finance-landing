import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../main.js';
import { loadIndexFixture } from './helpers.js';

describe('easeOut', () => {
  it('is pinned at the 0 and 1 boundaries', () => {
    expect(api.easeOut(0)).toBe(0);
    expect(api.easeOut(1)).toBe(1);
  });

  it('is monotonically increasing across the range', () => {
    let prev = -Infinity;
    for (let t = 0; t <= 1.0001; t += 0.1) {
      const v = api.easeOut(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('eases out (decelerates): more than half the distance is covered by the midpoint', () => {
    expect(api.easeOut(0.5)).toBeGreaterThan(0.5);
  });
});

describe('animateCount', () => {
  beforeEach(() => {
    loadIndexFixture();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats and lands on the final value once progress reaches 1', () => {
    const frames = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });

    api.animateCount('stat-loans', 0, 500, 1000, (v) => '$' + v + 'M+');

    // Use realistic (non-zero) timestamps: rAF never reports time 0.
    frames[0](1000);  // startTime = 1000, progress 0 -> $0M+
    expect(document.getElementById('stat-loans').textContent).toBe('$0M+');

    frames[1](2000);  // progress 1 -> $500M+
    expect(document.getElementById('stat-loans').textContent).toBe('$500M+');
  });

  it('does nothing when the target element is absent', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    api.animateCount('does-not-exist', 0, 10, 100, (v) => String(v));
    expect(raf).not.toHaveBeenCalled();
  });
});

describe('createStatsObserverCallback (fire-once guard)', () => {
  it('runs the animation only the first time the section intersects', () => {
    const onIntersect = vi.fn();
    const cb = api.createStatsObserverCallback(onIntersect);
    cb([{ isIntersecting: true }]);
    cb([{ isIntersecting: true }]);
    expect(onIntersect).toHaveBeenCalledTimes(1);
  });

  it('does not fire while the section is off-screen', () => {
    const onIntersect = vi.fn();
    const cb = api.createStatsObserverCallback(onIntersect);
    cb([{ isIntersecting: false }]);
    expect(onIntersect).not.toHaveBeenCalled();
  });
});

describe('runStatsAnimation stars', () => {
  beforeEach(() => {
    loadIndexFixture();
    vi.useFakeTimers();
    // animateCount relies on rAF; stub it to a no-op so we isolate the stars.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reveals the five stars one at a time then stops', () => {
    api.runStatsAnimation();
    const starEl = document.getElementById('stat-stars');
    expect(starEl.textContent).toBe('');

    vi.advanceTimersByTime(260);
    expect(starEl.textContent).toBe('★');

    vi.advanceTimersByTime(260 * 4);
    expect(starEl.textContent).toBe('★★★★★');

    // Interval should have been cleared — no sixth star.
    vi.advanceTimersByTime(260 * 5);
    expect(starEl.textContent).toBe('★★★★★');
  });
});
