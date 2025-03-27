import { Children, code, For, Refkey, List, refkey } from "@alloy-js/core";
import { isVoidType } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { getCreateRestErrorRefkey } from "./static-helpers/rest-error.jsx";
import { ContentTypeEncodingProvider } from "./transforms/content-type-encoding-provider.jsx";
import { JsonTransform } from "./transforms/json/json-transform.jsx";
import { HttpOperation } from "@typespec/http";
import { FunctionDeclaration, TypeExpression } from "@typespec/emitter-framework/typescript";
import * as ts from "@alloy-js/typescript";
import { httpRuntimeTemplateLib } from "./external-packages/ts-http-runtime.js";

export function getHttpRequestDeserializeRefkey(httpOperation: HttpOperation) {
  return refkey(httpOperation, "http-request-deserialize");
}

export interface HttpResponseDeserializeProps {
  httpOperation: HttpOperation;
  responseRefkey: Refkey;
  children?: Children;
}

export function HttpResponseDeserialize(props: HttpResponseProps) {
  const httpOperation = props.httpOperation;
  const namePolicy = ts.useTSNamePolicy();
  const functionName = namePolicy.getName(httpOperation.operation.name + "Deserialize", "function");
  return (
    <FunctionDeclaration
      name={functionName}
      refkey={getHttpRequestDeserializeRefkey(httpOperation)}
      parametersMode="replace"
      parameters={{ response: httpRuntimeTemplateLib.PathUncheckedResponse }}
    >
      <List hardline>
        <HttpResponses httpOperation={props.httpOperation} />
        {code`throw ${getCreateRestErrorRefkey()}(response);`}
      </List>
    </FunctionDeclaration>
  );
}

export interface HttpResponseProps {
  httpOperation: HttpOperation;
  responseRefkey: Refkey;
  children?: Children;
}

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

export function HttpResponses(props: HttpResponsesProps) {
  // Handle response by status code and content type
  const responses = $.httpOperation.flattenResponses(props.httpOperation);
  return (
    <For each={responses.filter((r) => !$.httpResponse.isErrorResponse(r))}>
      {({ statusCode, contentType, responseContent, type }) => {
        const body = responseContent.body;

        let expression: Children = code`return;`;

        const contentTypeCheck = body
          ? ` && response.headers["content-type"]?.includes("${contentType}")`
          : " && !response.body";

        if (body && (body.bodyKind === "single" || (type && !isVoidType(type)))) {
          expression = (
            <ContentTypeEncodingProvider contentType={contentType}>
              return{" "}
              <JsonTransform itemRef={"response.body"} target="application" type={body.type} />
              !;
            </ContentTypeEncodingProvider>
          );
        }

        if ($.httpResponse.statusCode.isSingle(statusCode)) {
          return code`
      if (+response.status === ${statusCode}${contentTypeCheck}) {
        ${expression}
      }
      `;
        }

        if ($.httpResponse.statusCode.isRange(statusCode)) {
          return code`
      if (+response.status >= ${statusCode.start} && +response.status <= ${statusCode.end} ${contentTypeCheck}) {
        ${expression}
      }
      `;
        }

        return null;
      }}
    </For>
  );
}
