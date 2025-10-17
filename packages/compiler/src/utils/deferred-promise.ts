export class DeferredPromise<T> {
  private promise: Promise<T>;
  private resolve!: (value: T) => void;
  private reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
  }

  getPromise(): Promise<T> {
    return this.promise;
  }

  resolvePromise(value: T) {
    this.resolve(value);
  }

  rejectPromise(reason?: any) {
    this.reject(reason);
  }
}
