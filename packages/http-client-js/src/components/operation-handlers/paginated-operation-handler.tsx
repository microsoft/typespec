import * as ay from "@alloy-js/core";
import { Children } from "@alloy-js/core";
import { $ } from "@typespec/compiler/experimental/typekit";
import * as ts from "@alloy-js/typescript";
import { HttpOperation } from "@typespec/http";
import { OperationHandler } from "./types.js";
import { ClientOperation } from "../client-operation.jsx";
import { getHttpRequestSendRefkey, HttpRequest, HttpRequestSend } from "../http-request.jsx";
import { getHttpRequestDeserializeRefkey, HttpResponse, HttpResponseDeserialize } from "../http-response.jsx";
import { OperationOptionsDeclaration } from "../operation-options.jsx";
import { getPageSettingsTypeRefkey, PageSettingsDeclaration } from "./paging/page-settings.jsx";
import * as cl from "@typespec/http-client";
import { reportDiagnostic } from "../../lib.js";
import { getClientcontextDeclarationRef } from "../client-context/client-context-declaration.jsx";
import { getOperationParameters } from "../operation-parameters.jsx";
import { FunctionDeclaration, TypeExpression } from "@typespec/emitter-framework/typescript";
import { getPageResponseTypeRefkey, PageResponseDeclaration } from "./paging/page-response.jsx";
import { getBuildPagedAsyncIteratorRefkey, getPagedAsyncIterableIteratorRefkey } from "../static-helpers/paging-helper.jsx";
import { getPageItemTypeName } from "./paging/page-item.jsx";

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
    const pagingOperation = $.operation.getPagingOperation(httpOperation.operation)!;
    const responseRefkey = ay.refkey(httpOperation, "http-response");
    const operationRefkey = ay.refkey(httpOperation.operation);
    const returnType = ay.code`${getPagedAsyncIterableIteratorRefkey()}<${getPageItemTypeName(pagingOperation)},${getPageResponseTypeRefkey(httpOperation)},${getPageSettingsTypeRefkey(httpOperation)}>`;
    const clientContextInterfaceRef = getClientcontextDeclarationRef(client);
    const signatureParams: Record<string, ts.ParameterDescriptor | ay.Children> = {
      client: { type: clientContextInterfaceRef, refkey: ay.refkey(client, "client") },
      ...getOperationParameters(httpOperation),
    };
    // TODO: concatentate the function call for send fn
    // TODO: extract the elements
    const itemsPosition = pagingOperation.output.pageItems.property.name;
    const isNextLink = pagingOperation.output.nextLink !== undefined;
    const nextTokenProperty = pagingOperation.output.nextLink?.property ?? pagingOperation.output.continuationToken?.property;
    // TODO: extract the next token
    const nextTokenOutputName = nextTokenProperty?.name;
    const nextTokenInputName = pagingOperation.input.continuationToken?.property.name;
    return (
      <ay.List>
        <OperationOptionsDeclaration operation={httpOperation} />
        <PageSettingsDeclaration operation={httpOperation} pagingOperation={pagingOperation} />
        <PageResponseDeclaration operation={httpOperation} pagingOperation={pagingOperation} />
        <HttpRequestSend httpOperation={httpOperation} responseRefkey={responseRefkey} signatureParams={signatureParams} />
        <HttpResponseDeserialize httpOperation={httpOperation} responseRefkey={responseRefkey} />
        <FunctionDeclaration
          export
          name={httpOperation.operation.name}
          returnType={returnType}
          refkey={operationRefkey}
          parametersMode="replace"
          parameters={signatureParams}
        >
          {ay.code`return ${getBuildPagedAsyncIteratorRefkey()}<${getPageItemTypeName(pagingOperation)},${getPageResponseTypeRefkey(httpOperation)},${getPageSettingsTypeRefkey(httpOperation)}>({
          getPagedResponse: async (nextToken?: string, settings?: ${getPageSettingsTypeRefkey(httpOperation)}) => {
             ${isNextLink ? `if (nextToken) {
              return await client.pathUnchecked(nextToken).get();
            }` : ``}
            const _options = { ...options, ...settings};
            ${nextTokenInputName ? `if (nextToken) {
              _options.${nextTokenInputName} = nextToken;
            }` : ``}
            return await ${getHttpRequestSendRefkey(httpOperation)}(client, _options);
          },
          deserializeRawResponse: async (response) => {
            return await ${getHttpRequestDeserializeRefkey(httpOperation)}(response)
          },
          getElements: (response) => {
            return response.${itemsPosition};
          }
          ${nextTokenOutputName ? `
            ,
            getNextToken: (response) => {
              return response.body["${nextTokenOutputName}"];
            }
            `: ``}
          
          });`}
        </FunctionDeclaration>
      </ay.List>
    );
  }
}
