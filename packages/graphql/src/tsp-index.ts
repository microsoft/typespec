import type { DecoratorImplementations } from "@typespec/compiler";
import { NAMESPACE } from "./lib.js";
import { $operationFields } from "./lib/operation-fields.js";
import { $schema } from "./lib/schema.js";

export const $decorators: DecoratorImplementations = {
  [NAMESPACE]: {
    operationFields: $operationFields,
    schema: $schema,
  },
};
