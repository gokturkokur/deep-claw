import { describe, expect, it } from 'vitest';
import { segmentCircle, segmentRect, sweep, type Shape } from '../src/systems/Collision';

const circle = (id: number, x: number, y: number, r: number): Shape => ({ id, kind: 'circle', x, y, r, hw: 0, hh: 0 });
const rect = (id: number, x: number, y: number, hw: number, hh: number): Shape => ({ id, kind: 'rect', x, y, r: 0, hw, hh });

describe('segment maths', () => {
  it('hits a circle in the middle of the segment', () => {
    const t = segmentCircle(0, 0, 100, 0, 50, 0, 10);
    expect(t).toBeCloseTo(0.4, 5);
  });
  it('misses a circle that is off to the side', () => {
    expect(segmentCircle(0, 0, 100, 0, 50, 30, 10)).toBe(-1);
  });
  it('reports 0 when the start is already inside', () => {
    expect(segmentCircle(50, 0, 100, 0, 50, 0, 10)).toBe(0);
  });
  it('hits a rect and misses a rect', () => {
    expect(segmentRect(0, 0, 100, 0, 50, 0, 10, 10)).toBeCloseTo(0.4, 5);
    expect(segmentRect(0, 0, 100, 0, 50, 40, 10, 10)).toBe(-1);
    expect(segmentRect(0, 0, 0, 100, 0, 50, 10, 10)).toBeCloseTo(0.4, 5);
  });
});

describe('sweep', () => {
  it('returns the first object along the path, not the first in the list', () => {
    const shapes = [circle(1, 0, 500, 20), circle(2, 0, 200, 20), circle(3, 0, 350, 20)];
    const hit = sweep(shapes, 0, 0, 0, 800, 0);
    expect(hit?.id).toBe(2);
  });
  it('does not tunnel through a small object with a big step', () => {
    // Diamond-sized target, step of 45 px (50 ms at 900 px/s) is bigger than its diameter.
    const shapes = [circle(1, 0, 300, 10)];
    const hit = sweep(shapes, 0, 280, 0, 325, 0);
    expect(hit?.id).toBe(1);
  });
  it('returns null when nothing is on the path', () => {
    expect(sweep([circle(1, 300, 300, 10)], 0, 0, 0, 800, 5)).toBeNull();
  });
  it('tip radius widens the hit area', () => {
    expect(sweep([circle(1, 20, 300, 10)], 0, 0, 0, 800, 5)).toBeNull();
    expect(sweep([circle(1, 14, 300, 10)], 0, 0, 0, 800, 5)?.id).toBe(1);
  });
  it('works with mixed circles and rects', () => {
    const shapes = [rect(1, 0, 400, 40, 30), circle(2, 0, 250, 20)];
    expect(sweep(shapes, 0, 0, 0, 800, 0)?.id).toBe(2);
  });
});
