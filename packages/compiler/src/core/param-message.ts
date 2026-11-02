import type { CallableMessage } from "./types.js";

/**
 * Build a typed diagnostic-message formatter using a tagged template whose substitutions name parameters.
 * The returned callable substitutes values from a dictionary and exposes the parameter names in `keys`.
 * @example
 * ```ts
 * const message = paramMessage`Unknown type ${"name"}.`;
 * message({ name: "Widget" }); // "Unknown type Widget."
 * ```
 */
export function paramMessage<const T extends string[]>(
  strings: readonly string[],
  ...keys: T
): CallableMessage<T> {
  const template = (dict: Record<T[number], string>) => {
    const result = [strings[0]];
    keys.forEach((key, i) => {
      const value = (dict as any)[key];
      if (value !== undefined) {
        result.push(value);
      }
      result.push(strings[i + 1]);
    });
    return result.join("");
  };
  template.keys = keys;
  return template;
}
