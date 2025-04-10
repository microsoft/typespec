/**
 * This file defines a handler to process HTTP operations that involve pagination.
 * It generates functions to send paginated requests, extract elements from paged responses,
 * and build an asynchronous iterator over the paged data.
 */

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

/**
 * Handler for paginated HTTP operations.
 * Evaluates if an HTTP operation supports pagination and handles its implementation.
 */
export const PaginatedOperationHandler: OperationHandler = {
  /**
   * Checks if it can handle the given HTTP operation.
   * It verifies if the operation has paging metadata defined.
   * @param httpOperation - The HTTP operation to check.
   */
  canHandle(httpOperation: HttpOperation): boolean {
    const pagingMetadata = $.operation.getPagingMetadata(httpOperation.operation);
    return pagingMetadata !== undefined;
  },

  /**
   * Handles the paginated HTTP operation by generating the necessary code to support pagination.
   * It sets up the client, operation parameters, and paged iterator as well as the functions
   * needed to send requests and process responses.
   *
   * @param httpOperation - The HTTP operation to handle.
   * @returns A list of generated components and function declarations for the operation.
   */
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
    // Exclude paging-specific settings from operation options and include them into PageSettings.
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

/**
 * Describes the properties passed to the GetPagedResponse component.
 * @property httpOperation - The HTTP operation object.
 * @property pageDetail - Details about the paging configuration.
 * @property operationParams - List of parameters for the operation.
 */
interface GetPagedResponseProps {
  httpOperation: HttpOperation;
  pageDetail: PagingDetail;
  operationParams: ts.ParameterDescriptor[];
}

/**
 * Helper function to generate a reference key for the getPagedResponse function.
 * @param httpOperation - The HTTP operation to use for generating the reference key.
 */
function getPagedResponseFunctionRefkey(httpOperation: HttpOperation) {
  return ay.refkey(httpOperation, "get-paged-response");
}

/**
 * Component that generates the function for sending paginated HTTP requests and processing responses.
 *
 * This function handles the logic of calling the appropriate API method depending on the paging pattern (e.g., nextLink)
 * and prepares the combined options for client requests.
 *
 * @param props - The properties required to generate the function, including HTTP operation details and paging configuration.
 * @returns A FunctionDeclaration that represents the getPagedResponse function.
 */
function GetPagedResponse(props: GetPagedResponseProps) {
  const pagingDetail = props.pageDetail;
  const httpOperation = props.httpOperation;
  // Define parameters for the getPagedResponse function
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
  // Generate a function name based on the operation's name appended with "Send"
  const functionName = namePolicy.getName(httpOperation.operation.name + "Send", "function");
  // Build a string of parameters for the send function, excluding the last parameter
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

/**
 * Helper function to generate a reference key for the getElements function.
 * @param httpOperation - The HTTP operation to use for generating the reference key.
 */
function getElementsRefkey(httpOperation: HttpOperation) {
  return ay.refkey(httpOperation, "get-elements");
}

/**
 * Describes the properties for the GetElements component.
 * @property httpOperation - The HTTP operation object.
 * @property pageDetail - Details about the paging configuration.
 */
interface GetElementsProps {
  httpOperation: HttpOperation;
  pageDetail: PagingDetail;
}

/**
 * Component that generates the function to extract the items array from a paged response.
 *
 * The generated function (getElements) takes a paged response and returns the array
 * of items from it based on the paging output configuration.
 *
 * @param props - Contains the HTTP operation and paging configuration details.
 * @returns A FunctionDeclaration that represents the getElements function.
 */
function GetElements(props: GetElementsProps) {
  const pagingDetail = props.pageDetail;
  const httpOperation = props.httpOperation;
  // Define parameter for the getElements function to extract items from the response.
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
