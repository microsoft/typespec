import lzutf8 from "lzutf8";

export interface StateStorage<T extends object> {
  load(): Partial<T>;
  save(t: Partial<T>): void;
}

export interface UrlStateStorage<T extends object> extends StateStorage<T> {
  resolveSearchParams(t: Partial<T>): URLSearchParams;
}

export type UrlStorageSchema<T> = {
  [key in keyof T]: UrlStorageItem;
};

export interface UrlStorageItem {
  /** Name of the query parameter where the data will be serialized. */
  queryParam: string;

  type?: "string" | "object";

  /** Encoding the data should be compressed with. If undefined param will not be compressed. */
  compress?: "lz-base64";
}

/**
 * Generic storage mechanism for data in the playground.
 * @param schema Schema of the data to be serialized in the query
 * @returns
 */
export function createUrlStateStorage<const T extends object>(
  schema: UrlStorageSchema<T>,
): UrlStateStorage<T> {
  return { load, save, resolveSearchParams };

  function load(): Partial<T> {
    const result: Record<string, string> = {};
    const parsed = new URLSearchParams(window.location.search);
    for (const [key, item] of Object.entries<UrlStorageItem>(schema)) {
      const value = parsed.get(item.queryParam);
      const decompressed = value && decompress(item, value);
      const deserialized = decompressed && deserialize(item, decompressed);
      if (deserialized) {
        result[key] = deserialized;
      }
    }
    return result as Partial<T>;
  }

  function decompress(item: UrlStorageItem, value: string): string | undefined {
    if (item.compress) {
      try {
        return lzutf8.decompress(value, { inputEncoding: "Base64" });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(
          `Error decompressing query parameter ${item.queryParam} with content:`,
          value,
        );
        return undefined;
      }
    } else {
      return value;
    }
  }

  function deserialize(item: UrlStorageItem, value: string): any {
    if (item.type === "object") {
      try {
        return JSON.parse(value);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(
          `Error decompressing query parameter ${item.queryParam} with content:`,
          value,
        );
        return undefined;
      }
    } else {
      return value;
    }
  }

  function save(data: T) {
    const params = resolveSearchParams(data, true);
    history.pushState(null, "", window.location.pathname + "?" + params.toString());
  }

  function resolveSearchParams(data: T, mergeWithExisting = false): URLSearchParams {
    const params = new URLSearchParams(mergeWithExisting ? location.search : undefined);
    for (const [key, item] of Object.entries<UrlStorageItem>(schema)) {
      const value = (data as any)[key];

      if (value) {
        const serialized = serialize(item, value);
        const compressed = compress(item, serialized);
        params.set(item.queryParam, compressed);
      } else {
        params.delete(item.queryParam);
      }
    }
    return params;
  }

  function compress(item: UrlStorageItem, value: string): string {
    if (item.compress) {
      return lzutf8.compress(value, { outputEncoding: "Base64" });
    } else {
      return value;
    }
  }

  function serialize(item: UrlStorageItem, value: any): string {
    if (item.type === "object") {
      return JSON.stringify(value);
    } else {
      return value;
    }
  }
}
