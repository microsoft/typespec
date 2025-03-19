import type { DecoratorImplementations } from "@typespec/compiler";
import { NAMESPACE } from "./lib.js";
import { $compose, $Interface } from "./lib/interface.js";
import { $operationFields } from "./lib/operation-fields.js";
import { $compose, $Interface } from "./lib/interface.js";
import { $schema } from "./lib/schema.js";

export const $decorators: DecoratorImplementations = {
  [NAMESPACE]: {
    compose: $compose,
    Interface: $Interface,
    operationFields: $operationFields,
    schema: $schema,
  },
};
