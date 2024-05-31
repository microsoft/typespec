// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

/**
 * A deduplicating queue that only allows elements to be enqueued once.
 *
 * This uses a Set to track visited elements.
 */
export interface OnceQueue<T> {
  /**
   * Enqueue a value if it has not been enqueued before.
   */
  add(value: T): void;
  /**
   * Dequeue the next value.
   */
  take(): T | undefined;
  /**
   * Check if the queue is empty.
   */
  isEmpty(): boolean;
}

/**
 * Creates a new OnceQueue with the given initial values.
 */
export function createOnceQueue<T>(...initialValues: T[]): OnceQueue<T> {
  const visited = new Set<T>();
  const queue = [] as T[];
  let idx = 0;
  const oncequeue: OnceQueue<T> = {
    add(value: T): void {
      if (!visited.has(value)) {
        visited.add(value);
        queue.push(value);
      }
    },
    take(): T | undefined {
      if (idx < queue.length) {
        return queue[idx++];
      } else {
        return undefined;
      }
    },
    isEmpty(): boolean {
      return idx >= queue.length;
    },
  };

  for (const value of initialValues) {
    oncequeue.add(value);
  }

  return oncequeue;
}
