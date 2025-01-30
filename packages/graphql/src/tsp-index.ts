import type { DecoratorImplementations } from "@typespec/compiler";
import { NAMESPACE } from "./lib.js";
import { $schema } from "./lib/schema.js";

export const $decorators: DecoratorImplementations = {
  [NAMESPACE]: {
    schema: $schema,
  },
};
