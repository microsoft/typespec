/**
 * This module defines a RestError class and a helper function to create instances of it.
 * The RestError encapsulates details from an HTTP response to provide richer error information.
 */

import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { httpRuntimeTemplateLib } from "../external-packages/ts-http-runtime.js";

/**
 * Generates a unique reference key for the RestError class.
 *
 * @returns A reference key for the RestError class
 */
export function getRestErrorRefkey() {
  return ay.refkey("rest-error", "static-helpers", "class");
}

/**
 * Generates a unique reference key for the createRestError function.
 *
 * @returns A reference key for the createRestError function
 */
export function getCreateRestErrorRefkey() {
  return ay.refkey("create-rest-error", "static-helpers", "function");
}

/**
 * Constructs the RestError class and associated helper function.
 *
 * The RestError class extends the native Error class and includes details from
 * an HTTP response such as request, response, status, body, and headers. It also
 * provides a static helper method to create a RestError directly from an HTTP response.
 *
 * @returns An component containing the RestError class declaration and the createRestError function
 */
export function RestError() {
  const requestRefkey = ay.refkey("request", "rest-error-class-field");
  const responseRefkey = ay.refkey("response", "rest-error-class-field");
  const statusRefkey = ay.refkey("status", "rest-error-class-field");
  const bodyRefkey = ay.refkey("body", "rest-error-class-field");
  const headersRefkey = ay.refkey("headers", "rest-error-class-field");
  const constructorRefkey = ay.refkey("constructor", "rest-error-class-method");
  const fromHttpResponseRefkey = ay.refkey("from-http-response", "rest-error-class-method");

  // Declaration of the RestError class which extends the built-in Error class
  const restErrorClass = (
    <ts.ClassDeclaration export name="RestError" extends="Error" refkey={getRestErrorRefkey()}>
      <ay.StatementList>
        <ts.ClassField
          public
          name="request"
          type={httpRuntimeTemplateLib.PipelineRequest}
          refkey={requestRefkey}
        />
        <ts.ClassField
          public
          name="response"
          type={httpRuntimeTemplateLib.HttpResponse}
          refkey={responseRefkey}
        />
        <ts.ClassField public name="status" type="string" refkey={statusRefkey} />
        <ts.ClassField public name="body" type="any" refkey={bodyRefkey} />
        <ts.ClassField
          public
          name="headers"
          type={httpRuntimeTemplateLib.RawHttpHeaders}
          refkey={headersRefkey}
        />
      </ay.StatementList>

      <ay.List hardline>
        <ts.ClassMethod
          name="constructor"
          parameters={[
            { name: "message", type: "string" },
            { name: "response", type: httpRuntimeTemplateLib.HttpResponse },
          ]}
          returnType={null}
          refkey={constructorRefkey}
        >
          {ay.code`
          // Create an error message that includes relevant details.
          super(\`$\{message\} - HTTP $\{response.status} received for $\{response.request.method} $\{response.request.url}\`);
          this.name = 'RestError';
          this.request = response.request;
          this.response = response;
          this.status = response.status;
          this.headers = response.headers;
          this.body = response.body;

          // Set the prototype explicitly.
          Object.setPrototypeOf(this, RestError.prototype);
        `}
        </ts.ClassMethod>
        <ts.ClassMethod
          static
          name="fromHttpResponse"
          parameters={[{ name: "response", type: httpRuntimeTemplateLib.HttpResponse }]}
          returnType={getRestErrorRefkey()}
          refkey={fromHttpResponseRefkey}
        >
          {ay.code`
          const defaultMessage = \`Unexpected HTTP status code: $\{response.status}\`;
          return new RestError(defaultMessage, response);
        `}
        </ts.ClassMethod>
      </ay.List>
    </ts.ClassDeclaration>
  );

  // Helper function to create a RestError instance. It delegates error creation to the static method.
  const createRestError = (
    <ts.FunctionDeclaration
      export
      name="createRestError"
      parameters={[{ name: "response", type: httpRuntimeTemplateLib.HttpResponse }]}
      returnType={getRestErrorRefkey()}
      refkey={getCreateRestErrorRefkey()}
    >
      {ay.code`
      return ${fromHttpResponseRefkey}(response);
    `}
    </ts.FunctionDeclaration>
  );

  // Return the class declaration and helper function along with newlines for readability.
  return [restErrorClass, "\n\n", createRestError];
}
