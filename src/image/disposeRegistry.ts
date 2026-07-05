/**
 * Tracks Skia native objects (SkImage / SkData / SkSurface / SkParagraph …) so
 * they can be released deterministically. Skia objects are JSI HostObjects; the
 * Hermes GC under-counts their native footprint and may never collect them, so
 * we must call `.dispose()` explicitly. This registry is a safety net: register
 * anything created imperatively, and `flush()` on unmount to guarantee cleanup.
 */

export interface Disposable {
  dispose: () => void;
}

export class DisposeRegistry {
  private items = new Set<Disposable>();

  /** Track an object and return it for convenient chaining. */
  add<T extends Disposable>(item: T): T {
    this.items.add(item);
    return item;
  }

  /** Stop tracking without disposing (e.g. ownership handed elsewhere). */
  forget(item: Disposable): void {
    this.items.delete(item);
  }

  /** Dispose a single tracked object now. */
  release(item: Disposable | null | undefined): void {
    if (!item) {
      return;
    }
    this.items.delete(item);
    safeDispose(item);
  }

  /** Dispose everything still tracked. Call on unmount. */
  flush(): void {
    for (const item of this.items) {
      safeDispose(item);
    }
    this.items.clear();
  }

  get size(): number {
    return this.items.size;
  }
}

/** Dispose without throwing if the object was already released. */
export function safeDispose(item: Disposable | null | undefined): void {
  if (!item) {
    return;
  }
  try {
    item.dispose();
  } catch {
    // Already disposed or not a real disposable — ignore.
  }
}
