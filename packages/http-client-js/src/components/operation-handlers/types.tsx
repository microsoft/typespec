import { type Children } from "@alloy-js/core";
import { HttpOperation } from "@typespec/http";

export interface OperationHandler {
  /**
   * Check if this handler can handle the given operation
   */
  canHandle(operation: HttpOperation): boolean;

  /**
   * Render the operation using this handler
   */
  handle(operation: HttpOperation): Children;
}

export interface OperationHandlerPipeline {
  handlers: OperationHandler[];
}
