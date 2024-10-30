import {
  AccessFlags,
  createTCGCContext,
  getAccess as tcgcGetAccess,
} from "@azure-tools/typespec-client-generator-core";
import { Operation } from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";

interface AzureOperationKit {
  /**
   * Get access of an operation
   *
   * @param operation Operation to get access of
   */
  getAccess(operation: Operation): AccessFlags;

}

interface TypeKit {
  operation: AzureOperationKit;
}

declare module "@typespec/compiler/typekit" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface OperationKit extends AzureOperationKit {}
}

defineKit<TypeKit>({
  operation: {
    getAccess(operation) {
      const context = createTCGCContext($.program, "typescript");
      return tcgcGetAccess(context, operation);
    },
  },
});
