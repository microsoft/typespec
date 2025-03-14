import type { DecoratorImplementations } from "@typespec/compiler";
import { NAMESPACE } from "./lib.js";
import { $mutation, $query, $subscription } from "./lib/operation-kind.js";
import { $schema } from "./lib/schema.js";

export const $decorators: DecoratorImplementations = {
  [NAMESPACE]: {
    mutation: $mutation,
    query: $query,
    schema: $schema,
    subscription: $subscription,
  },
};
