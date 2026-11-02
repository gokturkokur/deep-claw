/** Powder keg style blast, shared by Deep Claw (kegs) and the magnet prototype (old grenade). */

export interface Blastable {
  x: number;
  y: number;
  alive: boolean;
}

export interface BlastCallbacks<T> {
  /** An explosive went off (the first one, then every chained one). */
  explode(e: T): void;
  /** A non-explosive thing was destroyed by a blast. */
  destroyed(e: T): void;
}

/**
 * Destroys everything with its centre inside `radius` of the exploding thing, chaining through
 * other explosives (breadth first). Marks `alive = false` on everything it touches.
 */
export function chainBlast<T extends Blastable>(
  all: readonly T[],
  first: T,
  radius: number,
  isExplosive: (e: T) => boolean,
  cb: BlastCallbacks<T>,
): void {
  const queue: T[] = [first];
  first.alive = false;
  const r2 = radius * radius;
  while (queue.length) {
    const src = queue.shift() as T;
    cb.explode(src);
    for (const o of all) {
      if (!o.alive || o === src) continue;
      const dx = o.x - src.x;
      const dy = o.y - src.y;
      if (dx * dx + dy * dy > r2) continue;
      o.alive = false;
      if (isExplosive(o)) queue.push(o);
      else cb.destroyed(o);
    }
  }
}
