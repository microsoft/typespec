import { $client, $clientLocation } from "./decorators/index.js";

export { $lib } from "./lib.js";

/** @internal */
export const $decorators = {
  "TypeSpec.HttpClient": {
    client: $client,
    clientLocation: $clientLocation,
  },
};
