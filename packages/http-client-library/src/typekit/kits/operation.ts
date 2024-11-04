import { Operation } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import { AccessKit, getAccess, getName, NameKit } from "./utils.js";

export interface SdkOperationKit extends NameKit<Operation>, AccessKit<Operation> {}

interface SdkKit {
  operation: SdkOperationKit;
}

declare module "@typespec/compiler/typekit" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface OperationKit extends SdkOperationKit {}
}

defineKit<SdkKit>({
  operation: {
    getAccess(operation) {
      return getAccess(operation);
    },
    getName(operation) {
      return getName(operation);
    },
  },
});
