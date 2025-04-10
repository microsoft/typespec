import * as ay from "@alloy-js/core";
import { HttpOperation } from "@typespec/http";
import { ClientOperation as DefaultOperationComponent } from "../client-operation.jsx";
import { OperationHandlerPipeline } from "./types.jsx";

export interface OperationPipelineProps {
  httpOperation: HttpOperation;
  pipeline: OperationHandlerPipeline;
  internal?: boolean;
}

/**
 * Component that manages the operation handler pipeline.
 * It will try each handler in order until it finds one that can handle the operation.
 * If no handler is found, it will use the default ClientOperation component.
 */
export function OperationPipeline({ httpOperation, pipeline, internal }: OperationPipelineProps) {
  for (const handler of pipeline.handlers) {
    if (handler.canHandle(httpOperation)) {
      return handler.handle(httpOperation);
    }
  }

  // Default to standard client operation if no handler matched
  const defaultOperationRefkey = ay.refkey(httpOperation.operation);
  return (
    <DefaultOperationComponent
      httpOperation={httpOperation}
      internal={internal}
      refkey={defaultOperationRefkey}
    />
  );
}
