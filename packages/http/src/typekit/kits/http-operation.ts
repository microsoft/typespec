import { ignoreDiagnostics, Operation } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import { getHttpOperation } from "../../operations.js";
import { HttpOperation } from "../../types.js";

interface HttpOperationKit {
  httpOperation: {
    /**
     * Get the corresponding HTTP operation for the given TypeSpec operation. The same
     * TypeSpec operation will always return the exact same HttpOperation object.
     *
     * @param op The TypeSpec operation to get the HTTP operation metadata for.
     */
    get(op: Operation): HttpOperation;
  };
}

declare module "@typespec/compiler/typekit" {
  interface TypekitPrototype extends HttpOperationKit {}
}

defineKit<HttpOperationKit>({
  httpOperation: {
    get(op) {
      return ignoreDiagnostics(getHttpOperation(this.program, op));
    },
  },
});
