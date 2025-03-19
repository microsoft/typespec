import type { DecoratorImplementations } from "@typespec/compiler";
import { NAMESPACE } from "./lib.js";
import { $compose, $Interface } from "./lib/interface.js";
import { $mutation, $query, $subscription } from "./lib/operation-kind.js";
import { $operationFields } from "./lib/operation-fields.js";
import { $schema } from "./lib/schema.js";

export const $decorators: DecoratorImplementations = {
  [NAMESPACE]: {
    compose: $compose,
    Interface: $Interface,
    mutation: $mutation,
    query: $query,
    operationFields: $operationFields,
    schema: $schema,
    subscription: $subscription,
  },
};
