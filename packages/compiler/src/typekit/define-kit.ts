import { EmitContext } from "../core/types.js";

type KitFunction<T extends Record<string, any>> = (context: { context: EmitContext }) => T;

type KitReturnType<T> = T extends KitFunction<infer R> ? R : never;

type CombinedKit<T> = {
  [K in keyof T]: KitReturnType<T[K]>;
};

export function defineKit<const T extends Record<string, KitFunction<any>>>(
  sources: T
): (context: EmitContext) => CombinedKit<T>;
export function defineKit<T extends KitFunction<any>>(fn: T): T;
export function defineKit(
  source: Record<string, KitFunction<any>> | KitFunction<any>
): KitFunction<any> | ((context: EmitContext) => CombinedKit<any>) {
  if (typeof source === "function") {
    return source;
  }

  return ({ context }: { context: EmitContext }) => {
    const combined: Record<string, KitFunction<any>> = {};

    for (const [key, value] of Object.entries(source)) {
      combined[key] = value({ context });
    }

    return combined;
  };
}
