import { $contentTypeDecorator, $dataDecorator, $eventsDecorator } from "./decorators.js";

export { $lib } from "./lib.js";
export { $onValidate } from "./validate.js";

/**
 * Maps the `TypeSpec.Events` decorator names to their JavaScript implementations
 * for the TypeSpec library loader.
 */
export const $decorators = {
  "TypeSpec.Events": {
    contentType: $contentTypeDecorator,
    data: $dataDecorator,
    events: $eventsDecorator,
  },
};
