import * as ay from "@alloy-js/core";
import { Children } from "@alloy-js/core";
import { $ } from "@typespec/compiler/experimental/typekit";
import * as ts from "@alloy-js/typescript";
import { HttpOperation } from "@typespec/http";
import { OperationHandler } from "./types.js";
import { ClientOperation } from "../client-operation.jsx";
import { HttpRequest } from "../http-request.jsx";
import { HttpResponse } from "../http-response.jsx";
import { OperationOptionsDeclaration } from "../operation-options.jsx";
import { getPageSettingsTypeRefkey, PageSettingsDeclaration } from "./paging/page-settings.jsx";
import * as cl from "@typespec/http-client";
import { reportDiagnostic } from "../../lib.js";
import { getClientcontextDeclarationRef } from "../client-context/client-context-declaration.jsx";
import { getOperationParameters } from "../operation-parameters.jsx";
import { FunctionDeclaration, TypeExpression } from "@typespec/emitter-framework/typescript";
import { PageResponseDeclaration } from "./paging/page-response.jsx";

export const PaginatedOperationHandler: OperationHandler = {
  canHandle(httpOperation: HttpOperation): boolean {
    const pagingOperation = $.operation.getPagingOperation(httpOperation.operation);
    return pagingOperation !== undefined;
  },
  handle(httpOperation: HttpOperation): Children {
    const clientLibrary = cl.useClientLibrary();
    const client = clientLibrary.getClientForOperation(httpOperation);
  
    if (!client) {
      reportDiagnostic($.program, {
        code: "client-not-found",
        target: httpOperation.operation,
      });
      return;
    }
    const internalOperationRefkey = ay.refkey(httpOperation.operation, "internal");
    const pagingOperation = $.operation.getPagingOperation(httpOperation.operation)!;
    
    // build response keys
    const responseRefkey = ay.refkey(httpOperation, "http-response");
    const _pageSettings = pagingOperation?.input;
    console.log(_pageSettings);
    const operationRefkey = ay.refkey(httpOperation.operation);
    // build paging return type
     const namePolicy = ts.useTSNamePolicy();
    const returnType = `PagedAsyncIterableIterator<Foo,${namePolicy.getName(httpOperation.operation.name + "PageResponse", "interface")}, ${namePolicy.getName(httpOperation.operation.name + "PageSettings", "interface")}>`;
     const clientContextInterfaceRef = getClientcontextDeclarationRef(client);
     const signatureParams: Record<string, ts.ParameterDescriptor | ay.Children> = {
    client: { type: clientContextInterfaceRef, refkey: ay.refkey(client, "client") },
    ...getOperationParameters(httpOperation),
  };
    return (
      <ay.List>
        <OperationOptionsDeclaration operation={httpOperation} />
        <PageSettingsDeclaration operation={httpOperation} pagingOperation={pagingOperation} />
        <PageResponseDeclaration operation={httpOperation} pagingOperation={pagingOperation} />
        <FunctionDeclaration 
          export 
          async 
          name={httpOperation.operation.name} 
          returnType={returnType}
          refkey={operationRefkey}
          parametersMode="replace"
          parameters={signatureParams}
        >
        <ay.List hardline>
          <HttpRequest httpOperation={httpOperation} responseRefkey={responseRefkey} />
          <HttpResponse httpOperation={httpOperation} responseRefkey={responseRefkey} />
        </ay.List>
        </FunctionDeclaration>
        <ClientOperation internal httpOperation={httpOperation} refkey={internalOperationRefkey}/>
      </ay.List>
    );
  }
}
