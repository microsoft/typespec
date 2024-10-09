import { $terminalEventDecorator } from "./decorators.js";

export { $lib } from "./lib.js";

export const $decorators = {
  "TypeSpec.SSE": {
    terminalEvent: $terminalEventDecorator,
  },
};

export { $onValidate } from "./validate.js";
