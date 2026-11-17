import { $terminalEventDecorator } from "./decorators.js";

export { $lib } from "./lib.js";

/**
 * Provides the TypeSpec library loader with the JavaScript implementation of
 * `TypeSpec.SSE.terminalEvent`.
 */
export const $decorators = {
  "TypeSpec.SSE": {
    terminalEvent: $terminalEventDecorator,
  },
};

export { $onValidate } from "./validate.js";
