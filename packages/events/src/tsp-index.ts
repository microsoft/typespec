import { $contentTypeDecorator, $dataDecorator, $eventsDecorator } from "./decorators.js";

export { $lib } from "./lib.js";
export { $onValidate } from "./validate.js";
export const $decorators = {
  "TypeSpec.Events": {
    contentType: $contentTypeDecorator,
    data: $dataDecorator,
    events: $eventsDecorator,
  },
};
