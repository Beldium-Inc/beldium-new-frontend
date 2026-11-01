/**
 * Run `worker` over `items` with at most `limit` running at once.
 *
 * The first failure stops new work from starting, lets the ones already in
 * flight finish (so the draft keeps an honest record of what reached the
 * server), then rethrows. A retry skips everything that already went through.
 */
export async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  let failed = false;
  let firstError: unknown;

  async function lane() {
    while (!failed && next < items.length) {
      const item = items[next++] as T;
      try {
        await worker(item);
      } catch (cause) {
        if (!failed) firstError = cause;
        failed = true;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  if (failed) throw firstError;
}
