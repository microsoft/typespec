import lzutf8 from "lzutf8";

export interface StateStorage<T extends {}> {
  load(): Partial<T>;
  save(t: Partial<T>): void;
}

export type UrlStorageSchema<T> = {
  [key in keyof T]: UrlStorageItem;
};

export interface UrlStorageItem {
  /** Name of the query parameter where the data will be serialized. */
  queryParam: string;

  /** Encoding the data should be compressed with. If undefined param will not be compressed. */
  compress?: "lz-base64";
}

/**
 * Generic storage mechanism for data in the playground.
 * @param schema Schema of the data to be serialized in the query
 * @returns
 */
export function createUrlStateStorate<const T extends {}>(
  schema: UrlStorageSchema<T>
): StateStorage<T> {
  return { load, save };

  function load(): Partial<T> {
    const result: Record<string, string> = {};
    const parsed = new URLSearchParams(window.location.search);
    for (const [key, query] of Object.entries<UrlStorageItem>(schema)) {
      const value = parsed.get(query.queryParam);

      if (value) {
        if (query.compress) {
          try {
            result[key] = lzutf8.decompress(value, { inputEncoding: "Base64" });
          } catch (e) {
            console.error(
              `Error decompressing query parameter ${query.queryParam} with content:`,
              value
            );
          }
        } else {
          result[key] = value;
        }
      }
    }
    return result as Partial<T>;
  }

  function save(data: T) {
    const params = new URLSearchParams();
    for (const [key, query] of Object.entries<UrlStorageItem>(schema)) {
      const value = (data as any)[key];

      if (value) {
        if (query.compress) {
          const compressed = lzutf8.compress(value, { outputEncoding: "Base64" });
          params.append(query.queryParam, compressed);
        } else {
          params.append(query.queryParam, value);
        }
      }
    }
    history.pushState(null, "", window.location.pathname + "?" + params.toString());
  }
}
