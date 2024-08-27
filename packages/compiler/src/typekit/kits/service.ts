import { defineKit } from "../define-kit.js";

export interface ServiceKit {
  service: {};
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends ServiceKit {}
}

defineKit<ServiceKit>({
  service: {},
});
