import type { DecoratorImplementations } from "@typespec/compiler";
import { $lib } from "./lib.js";
import { $compose, $interface } from "./lib/interface.js";
import { $nullable, $nullableElements } from "./lib/nullable.js";
import { $oneOf } from "./lib/one-of.js";
import { $operationFields } from "./lib/operation-fields.js";
import { $mutation, $query, $subscription } from "./lib/operation-kind.js";
import { $schema } from "./lib/schema.js";
import { $specifiedBy } from "./lib/specified-by.js";
import { $onValidate } from "./validate.js";

export { $lib, $onValidate };

export const $decorators: DecoratorImplementations = {
  "TypeSpec.GraphQL": {
    compose: $compose,
    interface: $interface,
    mutation: $mutation,
    nullable: $nullable,
    nullableElements: $nullableElements,
    oneOf: $oneOf,
    operationFields: $operationFields,
    query: $query,
    schema: $schema,
    specifiedBy: $specifiedBy,
    subscription: $subscription,
  },
};
