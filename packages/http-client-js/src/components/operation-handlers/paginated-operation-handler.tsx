import * as ay from "@alloy-js/core";
import { Children } from "@alloy-js/core";
import { $ } from "@typespec/compiler/experimental/typekit";
import * as ts from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import { OperationHandler } from "./types.js";
import { ClientOperation } from "../client-operation.jsx";

export const PaginatedOperationHandler: OperationHandler = {
  canHandle(httpOperation: HttpOperation): boolean {
    const pagingOperation = $.operation.getPagingOperation(httpOperation.operation);
    return pagingOperation !== undefined;
  },
  handle(httpOperation: HttpOperation): Children {
    const internalOperationRefkey = ay.refkey(httpOperation.operation, "internal");
    const operationRefkey = ay.refkey(httpOperation.operation);
    return (
      <ay.List>
        <ts.FunctionDeclaration export async name={httpOperation.operation.name} refkey={operationRefkey}>
          {`
          // Implementation for paginated operation
          const path = parse("${httpOperation.path}").expand({});
          // ... rest of implementation
        `}
        </ts.FunctionDeclaration>
        <ClientOperation internal httpOperation={httpOperation} refkey={internalOperationRefkey}/>
      </ay.List>
    );
  }
}
