import { $contentType, $data, $events } from "./decorators.js";

export { $lib } from "./lib.js";

export const $decorators = {
  "TypeSpec.Events": {
    contentType: $contentType,
    data: $data,
    events: $events,
  },
};
