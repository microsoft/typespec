import type { RekeyableMap } from "../../core/types.js";
import { createRekeyableMap } from "../../utils/misc.js";

/** @experimental */
export function copyMap<T, U>(map: RekeyableMap<T, U>): RekeyableMap<T, U> {
  return createRekeyableMap(Array.from(map.entries()));
}
