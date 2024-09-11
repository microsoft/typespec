import { Children, code, mapJoin, Refkey } from "@alloy-js/core";
import { Operation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { TypeTransformCall } from "@typespec/emitter-framework/typescript";

export interface HttpResponseProps {
  operation: Operation;
  responseRefkey: Refkey;
  children?: Children;
}

export function HttpResponse(props: HttpResponseProps) {

  
  return <>
    <HttpResponses operation={props.operation} />
    
    {code`throw new Error("Unhandled response");`}  
  </>
}

export interface HttpResponsesProps {
  operation: Operation;
  children?: Children;
}

export function HttpResponses(props: HttpResponsesProps) {
  // Handle response by status code and content type
  return mapJoin($.httpOperation.getResponses(props.operation), ({statusCode, contentType, responseContent} ) => {
    const body = responseContent.body;

    let expression = code`return;`;

    const contentTypeCheck = body ?
        `&& response.headers.get("content-type") === "${contentType}"`
      : "&& !response.body";

    if(body && body.bodyKind === "single") {
      expression = <>
      return <TypeTransformCall type={body.type} target="application" itemName="response.body" />;
      </>
    }


    if($.httpResponse.statusCode.isSingle(statusCode)) {
      return code`
      if (response.status === ${statusCode} ${contentTypeCheck}) {
        ${expression}
      }
      `;
    }

    if($.httpResponse.statusCode.isRange(statusCode)) {
      return code`
      if (response.status >= ${statusCode.start} && response.status <= ${statusCode.end} ${contentTypeCheck}) {
        ${expression}
      }
      `;
    }
  }, {joiner: "\n\n"});
}

