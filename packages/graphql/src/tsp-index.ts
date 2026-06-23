import type { DecoratorImplementations } from "@typespec/compiler";
import { NAMESPACE } from "./lib.js";
import { $compose, $interface } from "./lib/interface.js";
import { $operationFields } from "./lib/operation-fields.js";
import { $mutation, $query, $subscription } from "./lib/operation-kind.js";
import { $schema } from "./lib/schema.js";
import { $specifiedBy } from "./lib/specified-by.js";

export const $decorators: DecoratorImplementations = {
  [NAMESPACE]: {
    compose: $compose,
    interface: $interface,
    mutation: $mutation,
    query: $query,
    operationFields: $operationFields,
    schema: $schema,
    specifiedBy: $specifiedBy,
    subscription: $subscription,
  },
};
