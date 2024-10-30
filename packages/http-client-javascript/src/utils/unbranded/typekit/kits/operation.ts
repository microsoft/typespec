import { createTCGCContext, shouldGenerateConvenient, shouldGenerateProtocol } from "@azure-tools/typespec-client-generator-core";
import { BaseType, Operation } from "@typespec/compiler";
import { defineKit, $ } from "@typespec/compiler/typekit";
import { HttpAuth } from "@typespec/http";

export interface SdkCredential extends BaseType {
  kind: "Credential";
  scheme: HttpAuth;
}

export interface SdkOperationKit {
  /**
   * Whether to generate a convenient method for the operation.
   * @param operation 
   */
  generateConvenient(operation: Operation): boolean;

  /**
   * Whether to generate a protocol method for the operation.
   * @param operation
   */
  generateProtocol(operation: Operation): boolean;
}

interface TypeKit {
  operation: SdkOperationKit;
}

declare module "@typespec/compiler/typekit" {
  interface OperationKit extends SdkOperationKit {}
}

defineKit<TypeKit>({
  operation: {
    generateConvenient(operation) {
      const context = createTCGCContext($.program, "typescript");
      return shouldGenerateConvenient(context, operation);
    },
    generateProtocol(operation) {
      const context = createTCGCContext($.program, "typescript");
      return shouldGenerateProtocol(context, operation);
    }
  },
});
