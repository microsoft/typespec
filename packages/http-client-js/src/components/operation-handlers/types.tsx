import { Children } from "@alloy-js/core";
import { HttpOperation } from "@typespec/http";

/**
 * Interface representing a handler capable of processing an HTTP operation.
 */
export interface OperationHandler {
  /**
   * Determines if this handler is capable of processing the given HTTP operation.
   *
   * @param operation - The HTTP operation to be checked.
   * @returns true if the handler can process the operation; otherwise, false.
   */
  canHandle(operation: HttpOperation): boolean;

  /**
   * Processes and renders the given HTTP operation.
   *
   * @param operation - The HTTP operation to be rendered.
   * @returns The component that represents the generated output of the operation.
   */
  handle(operation: HttpOperation): Children;
}

/**
 * Interface for a pipeline consisting of multiple operation handlers.
 * This structure allows an ordered collection of handlers to be maintained,
 * facilitating the selection of an appropriate handler for any given HTTP operation.
 */
export interface OperationHandlerPipeline {
  /**
   * An array of OperationHandler instances that the pipeline will iterate over
   * to find a handler capable of processing a specific HTTP operation.
   */
  handlers: OperationHandler[];
}
