/**
 * This file defines utilities for constructing and sending HTTP requests in a paging-enabled operation.
 * It includes functions to generate unique reference keys, parameter definitions for the request functions,
 * and a component to build the request sending function for a given HTTP operation.
 */
import * as ay from "@alloy-js/core";
import { List, Refkey, StatementList, code, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Reference } from "@alloy-js/typescript";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import * as cl from "@typespec/http-client";
import { getClientcontextDeclarationRef } from "../../client-context/client-context-declaration.jsx";
import { HttpRequestOptions } from "../../http-request-options.jsx";
import { HttpRequest } from "../../http-request.jsx";
import {
  getOperationOptionsParameterRefkey,
  getOperationParameters,
} from "../../operation-parameters.jsx";

/**
 * Properties for the HttpRequestSend component.
 * @param httpOperation The HTTP operation to be performed.
 * @param responseRefkey Optional reference key for the response.
 */
export interface HttpRequestSendProps {
  httpOperation: HttpOperation;
  responseRefkey?: Refkey;
}

/**
 * Generates a unique reference key for the HTTP request send function based on the given operation.
 * @param httpOperation The HTTP operation for which the refkey is generated.
 */
export function getHttpRequestSendRefkey(httpOperation: HttpOperation) {
  return refkey(httpOperation, "http-request-send");
}

/**
 * Constructs the parameter list for the HTTP request send function.
 * This includes the client instance and parameters derived from the HTTP operation.
 *
 * The options parameter is corrected to accept a Record<string, any> in order to support both paging
 * and non-paging options.
 *
 * @param httpOperation The HTTP operation for which parameters are constructed.
 * @returns An array of parameter descriptors for the HTTP request send function.
 */
export function getHttpRequestSendParams(httpOperation: HttpOperation) {
  // Retrieve the client library utility
  const clientLibrary = cl.useClientLibrary();
  // Get the client specific for the given HTTP operation
  const client = clientLibrary.getClientForOperation(httpOperation);
  // Retrieve the client context interface reference using the client instance
  const clientContextInterfaceRef = getClientcontextDeclarationRef(client!);

  // Build the signature parameters starting with the client and then followed by operation-specific parameters
  const signatureParams: ts.ParameterDescriptor[] = [
    { name: "client", type: clientContextInterfaceRef, refkey: ay.refkey(client, "client") },
    ...getOperationParameters(httpOperation),
  ];

  // Clone the parameters array
  const parameters: ts.ParameterDescriptor[] = [...signatureParams];

  // Replace the last parameter with a corrected 'options' parameter definition to accept Record<string, any>
  parameters[parameters.length - 1] = {
    name: "options",
    type: "Record<string, any>",
    refkey: getOperationOptionsParameterRefkey(httpOperation),
    optional: true,
  };

  return parameters;
}

/**
 * A component that generates an asynchronous function to send an HTTP request for the given operation.
 * The generated function utilizes the client instance to invoke the appropriate HTTP verb method with
 * constructed URL and options.
 *
 * @param props Contains the HTTP operation and an optional response reference key.
 * @returns A FunctionDeclaration component representing the HTTP request send function.
 */
export function HttpRequestSend(props: HttpRequestSendProps) {
  const httpOperation = props.httpOperation;

  // Generate unique reference keys for the URL and request options nodes
  const operationUrlRefkey = refkey();
  const requestOptionsRefkey = refkey();

  // Retrieve the HTTP verb (e.g., GET, POST) from the operation
  const verb = props.httpOperation.verb;

  // Use the naming policy to generate a function name based on the operation name for clarity and consistency
  const namePolicy = ts.useTSNamePolicy();
  const functionName = namePolicy.getName(httpOperation.operation.name + "Send", "function");

  // Retrieve the parameter definitions for the function
  const parameters = getHttpRequestSendParams(httpOperation);

  /**
   * The following JSX elements embed code generation nodes:
   *  - HttpRequest.Url generates the code for constructing the URL based on the HTTP operation.
   *  - HttpRequestOptions configures the request options (headers, query parameters, body, etc.) for the HTTP call.
   *  - Return statement c and sends the request using the provided client instance:
   *    - client.pathUnchecked() is used to select the path without additional type-checking.
   *    - The method corresponding to the HTTP verb (e.g., .get, .post) is invoked with the request options.
   *    - The operation is asynchronous and awaits the client call response.
   */
  return (
    <FunctionDeclaration
      name={functionName}
      async
      refkey={getHttpRequestSendRefkey(httpOperation)}
      parametersMode="replace"
      parameters={parameters}
    >
      <List>
        <StatementList>
          <HttpRequest.Url httpOperation={props.httpOperation} refkey={operationUrlRefkey} />
          <HttpRequestOptions httpOperation={props.httpOperation} refkey={requestOptionsRefkey} />
          {code`return await client.pathUnchecked(${(<Reference refkey={operationUrlRefkey} />)}).${verb}(${(<Reference refkey={requestOptionsRefkey} />)});`}
        </StatementList>
      </List>
    </FunctionDeclaration>
  );
}
