import { Operation } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import "@typespec/http/experimental/typekit";
import { getClientFromOperation } from "../../client-resolution.js";
import { Client } from "../../interfaces.js";

interface ClientOperationKit {
  /**
   * Gets the client associated with an Operation.
   * @param operation The operation to get the client for.
   * @returns The client associated with the operation, or undefined if no client is found.
   */
  getClient(operation: Operation): Client | undefined;
}

interface TypekitExtension {
  operation: ClientOperationKit;
}

declare module "@typespec/compiler/typekit" {
  interface OperationKit extends ClientOperationKit {}
}

defineKit<TypekitExtension>({
  operation: {
    getClient(operation: Operation): Client | undefined {
      return getClientFromOperation(this.program, operation);
    },
  },
});
