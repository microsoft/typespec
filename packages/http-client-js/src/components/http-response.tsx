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
