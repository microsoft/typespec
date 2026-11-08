import { $streamOfDecorator } from "./decorators.js";
export { $lib } from "./lib.js";

/**
 * Provides the TypeSpec library loader with the JavaScript implementation of
 * `TypeSpec.Streams.streamOf`.
 */
export const $decorators = {
  "TypeSpec.Streams": {
    streamOf: $streamOfDecorator,
  },
};
