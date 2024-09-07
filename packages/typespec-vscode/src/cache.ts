export class Cache<T> {
  private _cache: Record<string, T> = {};

  get(key: string): T | undefined {
    return this._cache[key];
  }
  set(key: string, value: T): void {
    this._cache[key] = value;
  }
  delete(key: string): void {
    delete this._cache[key];
  }
  clear(): void {
    this._cache = {};
  }
  setAll(keys: string[], value: T): void {
    keys.forEach((key) => {
      this.set(key, value);
    });
  }
}
