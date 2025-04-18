/**
 * Component responsible for managing the operation handler pipeline.
 *
 * This component iterates through a list of handlers to determine
 * which handler can process the given HTTP operation. It uses the first handler
 * that returns a truthy value for the canHandle method, and then renders the
 * result of its handle method. If no handler is able to process the operation,
 * it falls back to rendering a default client operation component.
 */

import * as ay from "@alloy-js/core";
import { HttpOperation } from "@typespec/http";
import { ClientOperation as DefaultOperationComponent } from "../client-operation.jsx";
import { OperationHandlerPipeline } from "./types.jsx";

/**
 * Props for OperationPipeline component.
 *
 * @param httpOperation - The HTTP operation to be processed.
 * @param pipeline - The pipeline containing operation handlers.
 * @param internal - Optional flag indicating if the operation is internal.
 */
export interface OperationPipelineProps {
  httpOperation: HttpOperation;
  pipeline: OperationHandlerPipeline;
  internal?: boolean;
}

/**
 * Component that manages the operation handler pipeline.
 * It will try each handler in order until it finds one that can handle the operation.
 * If no handler is found, it will use the default ClientOperation component.
 *
 * @param props - OperationPipelineProps object containing:
 *   - httpOperation: the HTTP operation instance.
 *   - pipeline: the pipeline of registered operation handlers.
 *   - internal (optional): flag to indicate if the operation is internal.
 * @returns Component that represents the processed operation.
 */
export function OperationPipeline({ httpOperation, pipeline, internal }: OperationPipelineProps) {
  // Iterate through each available handler in the pipeline
  for (const handler of pipeline.handlers) {
    // Check if the current handler can process the provided HTTP operation
    if (handler.canHandle(httpOperation)) {
      // If yes, delegate the handling to the specific handler and return the result
      return handler.handle(httpOperation);
    }
  }

  // If no handler matches, generate a unique reference key for the operation
  const defaultOperationRefkey = ay.refkey(httpOperation.operation);
  // Default to standard client operation if no handler was able to process the operation
  return (
    <DefaultOperationComponent
      httpOperation={httpOperation}
      internal={internal}
      refkey={defaultOperationRefkey}
    />
  );
}
