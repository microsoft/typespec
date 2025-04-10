/**
 * This file defines the HTTP response deserialization logic for operations.
 * It contains functions to create unique reference keys and generate function declarations
 * that handle the parsing and error handling of HTTP responses.
 */

import { Children, code, List, Refkey, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";
import { httpRuntimeTemplateLib } from "../../external-packages/ts-http-runtime.js";
import { HttpResponseProps, HttpResponses } from "../../http-response.jsx";
import { getOperationOptionsTypeRefkey } from "../../operation-options.jsx";
import { getOperationOptionsParameterRefkey } from "../../operation-parameters.jsx";
import { getCreateRestErrorRefkey } from "../../static-helpers/rest-error.jsx";

/**
 * Generates a unique reference key for the HTTP request deserialization function
 * based on the given HTTP operation.
 *
 * @param httpOperation - The HTTP operation for which the deserialization function is generated.
 */
export function getHttpRequestDeserializeRefkey(httpOperation: HttpOperation) {
  return refkey(httpOperation, "http-request-deserialize");
}

/**
 * Interface defining properties for HTTP response deserialization.
 */
export interface HttpResponseDeserializeProps {
  httpOperation: HttpOperation;
  responseRefkey: Refkey;
  children?: Children;
}

/**
 * Component that generates a function declaration for deserializing HTTP responses.
 * It handles custom response operations, invokes response hooks if defined, deserializes responses,
 * and throws errors for unsuccessful HTTP responses.
 *
 * @param props - Properties for HTTP response deserialization, including httpOperation and child components.
 * @returns A FunctionDeclaration component that defines a deserialization function.
 */
export function HttpResponseDeserialize(props: HttpResponseProps) {
  // Extract the HTTP operation from props
  const httpOperation = props.httpOperation;

  // Obtain the naming policy for TypeScript entities to generate a unique function name
  const namePolicy = ts.useTSNamePolicy();
  const functionName = namePolicy.getName(httpOperation.operation.name + "Deserialize", "function");

  const responseRefkey = refkey();

  // Define the parameters for the generated deserialization function
  const params = [
    {
      // The HTTP response received (unchecked path response type)
      name: "response",
      type: httpRuntimeTemplateLib.PathUncheckedResponse,
      refkey: responseRefkey,
    },
    {
      // Options parameter that allows customization of operation behavior like onResponse hook
      name: "options",
      refkey: getOperationOptionsParameterRefkey(httpOperation),
      type: getOperationOptionsTypeRefkey(httpOperation),
      optional: true,
    },
  ];

  return (
    <FunctionDeclaration
      // Use the computed function name and assign a unique reference key for the deserialization function
      name={functionName}
      refkey={getHttpRequestDeserializeRefkey(httpOperation)}
      parametersMode="replace"
      parameters={params}
    >
      {code`      
      if (typeof options?.operationOptions?.onResponse === "function") {
        options?.operationOptions?.onResponse(${responseRefkey});
      }`}
      <List hardline>
        <HttpResponses httpOperation={props.httpOperation} />
        {code`throw ${getCreateRestErrorRefkey()}(${responseRefkey});`}
      </List>
    </FunctionDeclaration>
  );
}
