/** Swept (segment based) collision maths. No Phaser, no allocations in the hot path. */

export interface Shape {
  id: number;
  kind: 'circle' | 'rect';
  x: number;
  y: number;
  /** circle radius */
  r: number;
  /** rect half extents */
  hw: number;
  hh: number;
}

/**
 * Entry parameter t (0..1) of segment A->B against a circle, or -1 if there is no hit.
 * If A is already inside the circle, returns 0.
 */
export function segmentCircle(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, r: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const fx = ax - cx;
  const fy = ay - cy;
  const c = fx * fx + fy * fy - r * r;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a === 0) return -1;
  const b = 2 * (fx * dx + fy * dy);
  const disc = b * b - 4 * a * c;
  if (disc < 0) return -1;
  const sq = Math.sqrt(disc);
  const t = (-b - sq) / (2 * a);
  if (t >= 0 && t <= 1) return t;
  return -1;
}

/** Entry parameter t (0..1) of segment A->B against an axis aligned box (slab method), or -1. */
export function segmentRect(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, hw: number, hh: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  let tmin = 0;
  let tmax = 1;
  const minX = cx - hw;
  const maxX = cx + hw;
  const minY = cy - hh;
  const maxY = cy + hh;

  if (dx === 0) {
    if (ax < minX || ax > maxX) return -1;
  } else {
    let t1 = (minX - ax) / dx;
    let t2 = (maxX - ax) / dx;
    if (t1 > t2) {
      const s = t1;
      t1 = t2;
      t2 = s;
    }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return -1;
  }
  if (dy === 0) {
    if (ay < minY || ay > maxY) return -1;
  } else {
    let t1 = (minY - ay) / dy;
    let t2 = (maxY - ay) / dy;
    if (t1 > t2) {
      const s = t1;
      t1 = t2;
      t2 = s;
    }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return -1;
  }
  return tmin;
}

export interface SweepHit {
  id: number;
  t: number;
}

const hitResult: SweepHit = { id: -1, t: 0 };

/**
 * Sweeps the tip segment A->B (tip radius `tipR`) against all shapes.
 * The first shape along the segment wins (smallest t). Returns a shared result object
 * (do not keep a reference) or null.
 */
export function sweep(shapes: readonly Shape[], ax: number, ay: number, bx: number, by: number, tipR: number): SweepHit | null {
  let best = Infinity;
  let bestId = -1;
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    const t =
      s.kind === 'circle'
        ? segmentCircle(ax, ay, bx, by, s.x, s.y, s.r + tipR)
        : segmentRect(ax, ay, bx, by, s.x, s.y, s.hw + tipR, s.hh + tipR);
    if (t >= 0 && t < best) {
      best = t;
      bestId = s.id;
    }
  }
  if (bestId < 0) return null;
  hitResult.id = bestId;
  hitResult.t = best;
  return hitResult;
}
