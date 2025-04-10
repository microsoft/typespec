/**
 * This file contains helper components to generate HTTP responses handling.
 * The code processes responses by status code and content type, and throws custom REST errors when the response
 * does not match any in the spec.
 * It uses the Alloy JS framework and Typespec HTTP utilities to flatten and process HTTP responses.
 */

import { Children, code, For, List, Refkey } from "@alloy-js/core";
import { isVoidType } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { HttpOperation } from "@typespec/http";
import { getCreateRestErrorRefkey } from "./static-helpers/rest-error.jsx";
import { ContentTypeEncodingProvider } from "./transforms/content-type-encoding-provider.jsx";
import { JsonTransform } from "./transforms/json/json-transform.jsx";

export interface HttpResponseProps {
  httpOperation: HttpOperation;
  responseRefkey: Refkey;
  children?: Children;
}

/**
 * HttpResponse component that renders a list of HTTP response handling code.
 * It includes conditional handling for the success responses and a fallback error throwing.
 *
 * @param props - Properties including the HTTP operation and a reference key for the response.
 */
export function HttpResponse(props: HttpResponseProps) {
  return (
    <List hardline>
      <HttpResponses httpOperation={props.httpOperation} />
      {code`throw ${getCreateRestErrorRefkey()}(response);`}
    </List>
  );
}

export interface HttpResponsesProps {
  httpOperation: HttpOperation;
  children?: Children;
}

/**
 * HttpResponses component that iterates over HTTP responses extracted from the httpOperation.
 * It generates conditional checks for each non-error response based on status code and content type.
 *
 * @param props - Properties containing the HttpOperation to be processed.
 */
export function HttpResponses(props: HttpResponsesProps) {
  // Obtain and flatten the HTTP responses from the operation, filtering by non-error responses.
  const responses = $.httpOperation.flattenResponses(props.httpOperation);

  return (
    <For each={responses.filter((r) => !$.httpResponse.isErrorResponse(r))}>
      {({ statusCode, contentType, responseContent, type }) => {
        // Extract the body from the response content
        const body = responseContent.body;

        // Default expression to return if no valid body processing is applicable.
        let expression: Children = code`return;`;

        // Build a content type check condition:
        // If a body exists, check if the response headers include the expected content type.
        // Otherwise, ensure that the response has no body.
        const contentTypeCheck = body
          ? ` && response.headers["content-type"]?.includes("${contentType}")`
          : " && !response.body";

        // If there is a response body and (it's single (aka not multipart nor file) or the type is not void),
        // apply JSON transformation wrapped with the content-type encoding provider.
        if (body && (body.bodyKind === "single" || (type && !isVoidType(type)))) {
          expression = (
            <ContentTypeEncodingProvider contentType={contentType}>
              return{" "}
              <JsonTransform itemRef={"response.body"} target="application" type={body.type} />
              !;
            </ContentTypeEncodingProvider>
          );
        }

        // If the status code represents a single status value, generate an if-statement to match it.
        if ($.httpResponse.statusCode.isSingle(statusCode)) {
          return code`
      if (+response.status === ${statusCode}${contentTypeCheck}) {
        ${expression}
      }
      `;
        }

        // If the status code represents a range, generate an if-statement to match the range.
        if ($.httpResponse.statusCode.isRange(statusCode)) {
          return code`
      if (+response.status >= ${statusCode.start} && +response.status <= ${statusCode.end} ${contentTypeCheck}) {
        ${expression}
      }
      `;
        }

        // Return null if the statusCode type is not handled explicitly.
        return null;
      }}
    </For>
  );
}
