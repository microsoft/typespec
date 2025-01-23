import { Children, code, mapJoin, Refkey } from "@alloy-js/core";
import { isVoidType } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { ClientOperation } from "@typespec/http-client-library";
import { TypeTransformCall } from "./transforms/type-transform-call.jsx";

export interface HttpResponseProps {
  operation: ClientOperation;
  responseRefkey: Refkey;
  children?: Children;
}

export function HttpResponse(props: HttpResponseProps) {
  return <>
    <HttpResponses operation={props.operation} />
    
    {code`throw new Error("Unhandled response");`}  
  </>;
}

export interface HttpResponsesProps {
  operation: ClientOperation;
  children?: Children;
}

export function HttpResponses(props: HttpResponsesProps) {
  // Handle response by status code and content type
  const responses = $.httpOperation.flattenResponses(props.operation.httpOperation);
  return mapJoin(
    responses.filter((r) => !$.httpResponse.isErrorResponse(r)),
    ({ statusCode, contentType, responseContent, type }) => {
      const body = responseContent.body;

      let expression = code`return;`;

      let contentTypeCheck = body
        ? ` && response.headers.get("content-type") === "${contentType}"`
        : " && !response.body";

      if (contentType === "application/json") {
        contentTypeCheck = "";
      }

      if ((body && body.bodyKind === "single") || (type && !isVoidType(type))) {
        expression =
          <>
      return <TypeTransformCall type={body?.type ?? type} target="application" itemPath={["response", "body"]} />;
      </>;
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
    },
    { joiner: "\n\n" },
  );
}
