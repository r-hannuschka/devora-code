/**
 * Eine wiederverwendbare, asynchrone Warteschlange für das SDK
 */
export class AsyncQueue {
  private queue: (() => Promise<void> | void)[] = [];
  private isProcessing = false;

  /**
   * Fügt eine asynchrone oder synchrone Aufgabe hinten an die Schlange an
   */
  public enqueue(task: () => Promise<void> | void): void {
    this.queue.push(task);
    this.process();
  }

  private async process(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const nextTask = this.queue.shift()!;
      try {
        await nextTask();
      } catch (error) {
        console.error("[SDK AsyncQueue] Task failed:", error);
      }
    }

    this.isProcessing = false;
  }
}
