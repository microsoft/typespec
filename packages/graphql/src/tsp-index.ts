import type { DecoratorImplementations } from "@typespec/compiler";
import { NAMESPACE } from "./lib.js";
import { $compose, $Interface } from "./lib/interface.js";
import { $schema } from "./lib/schema.js";

export const $decorators: DecoratorImplementations = {
  [NAMESPACE]: {
    compose: $compose,
    Interface: $Interface,
    schema: $schema,
  },
};
