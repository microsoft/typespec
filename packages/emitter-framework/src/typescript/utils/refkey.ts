import type { Refkey } from "@alloy-js/core";

export function joinRefkeys(...refkeys: (Refkey | Refkey[] | undefined)[]): Refkey[] {
  return refkeys.filter((v) => !!v).flat();
}
