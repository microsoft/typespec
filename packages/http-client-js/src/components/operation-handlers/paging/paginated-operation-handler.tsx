import * as ay from "@alloy-js/core";
import { Children } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import * as cl from "@typespec/http-client";
import { reportDiagnostic } from "../../../lib.js";
import { getClientcontextDeclarationRef } from "../../client-context/client-context-declaration.jsx";
import { OperationOptionsDeclaration } from "../../operation-options.jsx";
import { getOperationParameters } from "../../operation-parameters.jsx";
import {
  getBuildPagedAsyncIteratorRefkey,
  getPagedAsyncIterableIteratorRefkey,
} from "../../static-helpers/paging-helper.jsx";
import { getPageItemTypeName } from "../paging/page-item.jsx";
import { getPageResponseTypeRefkey, PageResponseDeclaration } from "../paging/page-response.jsx";
import {
  getPageSettingProperties,
  getPageSettingsTypeRefkey,
  PageSettingsDeclaration,
} from "../paging/page-settings.jsx";
import { HttpRequestSend } from "../paging/request-send.jsx";
import {
  getHttpRequestDeserializeRefkey,
  HttpResponseDeserialize,
} from "../paging/response-deserialize.jsx";
import { extractPagingDetail, PagingDetail } from "../paging/util.js";
import { OperationHandler } from "../types.js";

export const PaginatedOperationHandler: OperationHandler = {
  canHandle(httpOperation: HttpOperation): boolean {
    const pagingMetadata = $.operation.getPagingMetadata(httpOperation.operation);
    return pagingMetadata !== undefined;
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
    const pagingOperation = $.operation.getPagingMetadata(httpOperation.operation)!;
    const responseRefkey = ay.refkey(httpOperation, "http-response");
    const operationRefkey = ay.refkey(httpOperation.operation);
    const returnType = ay.code`${getPagedAsyncIterableIteratorRefkey()}<${getPageItemTypeName(pagingOperation)},${getPageResponseTypeRefkey(httpOperation)},${getPageSettingsTypeRefkey(httpOperation)}>`;
    const clientContextInterfaceRef = getClientcontextDeclarationRef(client);
    const signatureParams: ts.ParameterDescriptor[] = [
      { name: "client", type: clientContextInterfaceRef, refkey: ay.refkey(client, "client") },
      ...getOperationParameters(httpOperation),
    ];
    const pagingDetail = extractPagingDetail(httpOperation, pagingOperation);
    // Exclude from operation options and include them into PageSettings
    const excludes = getPageSettingProperties(pagingOperation).map((p) => p.property);
    return (
      <ay.List>
        <OperationOptionsDeclaration operation={httpOperation} excludes={excludes} />
        <PageSettingsDeclaration operation={httpOperation} pagingOperation={pagingOperation} />
        <PageResponseDeclaration operation={httpOperation} pagingOperation={pagingOperation} />
        <HttpRequestSend httpOperation={httpOperation} responseRefkey={responseRefkey} />
        <HttpResponseDeserialize httpOperation={httpOperation} responseRefkey={responseRefkey} />
        <FunctionDeclaration
          export
          name={httpOperation.operation.name}
          returnType={returnType}
          refkey={operationRefkey}
          parametersMode="replace"
          parameters={signatureParams}
        >
          <ay.List>
            <GetElements httpOperation={httpOperation} pageDetail={pagingDetail} />
            <GetPagedResponse
              httpOperation={httpOperation}
              pageDetail={pagingDetail}
              operationParams={signatureParams}
            />
            <>
              {ay.code`
              return ${getBuildPagedAsyncIteratorRefkey}<${getPageItemTypeName(pagingOperation)}, ${getPageResponseTypeRefkey(httpOperation)}, ${getPageSettingsTypeRefkey(httpOperation)}>({${getElementsRefkey(httpOperation)}, ${getPagedResponseFunctionRefkey(httpOperation)}});`}
            </>
          </ay.List>
        </FunctionDeclaration>
      </ay.List>
    );
  },
};

interface GetPagedResponseProps {
  httpOperation: HttpOperation;
  pageDetail: PagingDetail;
  operationParams: ts.ParameterDescriptor[];
}
function getPagedResponseFunctionRefkey(httpOperation: HttpOperation) {
  return ay.refkey(httpOperation, "get-paged-response");
}

function GetPagedResponse(props: GetPagedResponseProps) {
  const pagingDetail = props.pageDetail;
  const httpOperation = props.httpOperation;
  const params: ts.ParameterDescriptor[] = [
    { name: "nextToken", type: "string", optional: true, refkey: ay.refkey() },
    {
      name: "settings",
      type: getPageSettingsTypeRefkey(httpOperation),
      optional: true,
      refkey: ay.refkey(),
    },
  ];
  // TODO: template can't resolve the ref key so fallback to useTSNamePolicy
  const namePolicy = ts.useTSNamePolicy();
  const functionName = namePolicy.getName(httpOperation.operation.name + "Send", "function");
  const sendParamStr = props.operationParams
    .map((param) => param.name)
    .slice(0, -1)
    .join(", ");
  return (
    <FunctionDeclaration
      name="getPagedResponse"
      async
      refkey={getPagedResponseFunctionRefkey(httpOperation)}
      parameters={params}
    >
      {ay.code` 
      ${
        props.pageDetail.pattern === "nextLink"
          ? `
        let response: PathUncheckedResponse;
        if (nextToken) {
          response = await client.pathUnchecked(nextToken).get();
        } else {
          const combinedOptions = { ...options, ...settings };
          response = await ${functionName}(${sendParamStr}, combinedOptions);
        } `
          : `
        const combinedOptions = {...options, ...settings};
        ${
          pagingDetail.input?.nextToken
            ? `
            if (nextToken) {
              combinedOptions.${pagingDetail.input?.nextToken} = nextToken;
            }`
            : ``
        }
        const response = await ${functionName}(${sendParamStr},  combinedOptions);    
        `
      }
    return {
      pagedResponse: await ${getHttpRequestDeserializeRefkey(httpOperation)}(response, options),
      nextToken: ${
        pagingDetail.output.nextToken
          ? `response.${pagingDetail.output.nextToken.position}["${pagingDetail.output.nextToken.name}"]`
          : `undefined`
      },
    };
      `}
    </FunctionDeclaration>
  );
}

interface GetElementsProps {
  httpOperation: HttpOperation;
  pageDetail: PagingDetail;
}
function getElementsRefkey(httpOperation: HttpOperation) {
  return ay.refkey(httpOperation, "get-elements");
}
function GetElements(props: GetElementsProps) {
  const pagingDetail = props.pageDetail;
  const httpOperation = props.httpOperation;
  const params = [
    {
      name: "response",
      type: getPageResponseTypeRefkey(httpOperation),
      refkey: ay.refkey(),
    },
  ];
  return (
    <FunctionDeclaration
      name="getElements"
      refkey={getElementsRefkey(httpOperation)}
      parameters={params}
    >
      {ay.code`
      return response.${pagingDetail.output.items};
      `}
    </FunctionDeclaration>
  );
}
