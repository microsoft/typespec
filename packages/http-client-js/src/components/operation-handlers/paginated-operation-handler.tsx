import * as ay from "@alloy-js/core";
import { Children } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import * as cl from "@typespec/http-client";
import { reportDiagnostic } from "../../lib.js";
import { getClientcontextDeclarationRef } from "../client-context/client-context-declaration.jsx";
import { OperationOptionsDeclaration } from "../operation-options.jsx";
import { getOperationParameters } from "../operation-parameters.jsx";
import {
  getBuildPagedAsyncIteratorRefkey,
  getPagedAsyncIterableIteratorRefkey,
} from "../static-helpers/paging-helper.jsx";
import { getPageItemTypeName } from "./paging/page-item.jsx";
import { getPageResponseTypeRefkey, PageResponseDeclaration } from "./paging/page-response.jsx";
import {
  getPageSettingProperties,
  getPageSettingsTypeRefkey,
  PageSettingsDeclaration,
} from "./paging/page-settings.jsx";
import { getHttpRequestSendRefkey, HttpRequestSend } from "./paging/request-send.jsx";
import {
  getHttpRequestDeserializeRefkey,
  HttpResponseDeserialize,
} from "./paging/response-deserialize.jsx";
import { extractPagingDetail } from "./paging/util.js";
import { OperationHandler } from "./types.js";

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
    const sendSignatureParams: Record<string, ts.ParameterDescriptor | ay.Children> = {
      ...signatureParams,
    };
    const pagingDetail = extractPagingDetail(httpOperation, pagingOperation);
    // Downgrade any page settings to PageSettings and exclude from operation options
    const excludes = getPageSettingProperties(pagingOperation).map((p) => p.property);
    return (
      <ay.List>
        <OperationOptionsDeclaration operation={httpOperation} excludes={excludes} />
        <PageSettingsDeclaration operation={httpOperation} pagingOperation={pagingOperation} />
        <PageResponseDeclaration operation={httpOperation} pagingOperation={pagingOperation} />
        <HttpRequestSend
          httpOperation={httpOperation}
          responseRefkey={responseRefkey}
          signatureParams={sendSignatureParams}
        />
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
             ${
               pagingDetail.pattern === "nextLink"
                 ? `if (nextToken) {
              return await client.pathUnchecked(nextToken).get();
            }`
                 : ``
             }
            const combinedOptions = {...options, ...settings};
            ${
              pagingDetail.pattern === "continuationToken" && pagingDetail.input?.nextToken
                ? `if (nextToken) {
              combinedOptions.${pagingDetail.input?.nextToken} = nextToken;
            }`
                : ``
            }
            return await ${getHttpRequestSendRefkey(httpOperation)}(client, combinedOptions as any);
          },
          deserializeRawResponse: async (response) => {
            return await ${getHttpRequestDeserializeRefkey(httpOperation)}(response)
          },
          getElements: (response) => {
            return response.${pagingDetail.output.items};
          },
          ${
            pagingDetail.output.nextToken
              ? `getNextToken: (response) => {
              return response.${pagingDetail.output.nextToken.position}["${pagingDetail.output.nextToken.name}"];
            }
            `
              : ``
          }
          
          });`}
        </FunctionDeclaration>
      </ay.List>
    );
  },
};
