import { code, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Attribute } from "@alloy-js/csharp";
import { isErrorModel, isVoidType } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import type { OperationHttpCanonicalization } from "@typespec/http-canonicalization";
import { getDocComments } from "../../utils/doc-comments.jsx";
import { getHttpVerbAttribute, getRouteTemplate } from "../../utils/http-helpers.js";
import type { RequestModelInfo } from "../request-models.jsx";
import { TypeExpression } from "../type-expression/type-expression.jsx";
import { getBindingAttribute, getLiteralDefaultValue } from "./parameter-binding.js";
import { getSuccessStatusCode } from "./response-analysis.js";

export interface ControllerActionProps {
  /** The canonicalized HTTP operation to generate an action method for. */
  operation: OperationHttpCanonicalization;
  /** The name of the business logic implementation field (e.g., "petStoreImpl"). */
  implFieldName: string;
  /** Request model info if this operation uses a synthetic request model. */
  requestModel?: RequestModelInfo;
}

type ParamInfo = {
  name: string;
  type: Children;
  attributes?: string[];
  optional?: boolean;
  default?: Children;
};

/**
 * Renders an ASP.NET controller action method for an HTTP operation.
 */
export function ControllerAction(props: ControllerActionProps): Children {
  const { $ } = useTsp();
  const namePolicy = cs.useCSharpNamePolicy();
  const opName = namePolicy.getName(props.operation.name, "class-method");
  const verb = getHttpVerbAttribute(props.operation.method);
  const route = getRouteTemplate(props.operation.path);
  const isGet = props.operation.method === "get";

  // Map all HTTP parameters (path, query, header) to C# method parameters
  const pathParams: ParamInfo[] = [];
  const queryHeaderParams: ParamInfo[] = [];
  for (const p of props.operation.requestParameters.properties) {
    if (p.property.isContentTypeProperty) continue;
    const isOptional = p.property.sourceType.optional;
    const literalDefault = getLiteralDefaultValue(p.property.sourceType.type);
    if (p.kind === "path") {
      const paramName = namePolicy.getName(p.property.sourceType.name, "parameter");
      const attr = getBindingAttribute(p, paramName);
      pathParams.push({
        name: paramName,
        type: <TypeExpression type={p.property.sourceType.type} />,
        attributes: attr ? [attr] : undefined,
        optional: isOptional,
        default: literalDefault,
      });
    } else if (p.kind === "query" || p.kind === "header") {
      const attr = getBindingAttribute(p);
      queryHeaderParams.push({
        name: namePolicy.getName(p.property.sourceType.name, "parameter"),
        type: <TypeExpression type={p.property.sourceType.type} />,
        attributes: attr ? [attr] : undefined,
        optional: isOptional,
        default: literalDefault,
      });
    }
  }
  // Required params (no default) first, then params with defaults
  const sortByDefault = (a: ParamInfo, b: ParamInfo) => {
    const aHasDefault = a.default !== undefined || a.optional;
    const bHasDefault = b.default !== undefined || b.optional;
    if (aHasDefault === bHasDefault) return 0;
    return aHasDefault ? 1 : -1;
  };
  // Default: path params, then query/header params (sorted by default presence)
  let parameters: ParamInfo[] = [...pathParams, ...queryHeaderParams.sort(sortByDefault)];

  // Add body parameter if present (but NOT for GET requests)
  const body = props.operation.requestParameters.body;
  let callArgs: string;
  const isMultipart = !isGet && body?.bodyKind === "multipart";
  const isBodyRoot =
    !isGet &&
    body?.bodyKind === "single" &&
    body.bodies.length > 0 &&
    props.operation.requestParameters.properties.some((p) => p.kind === "bodyRoot");
  const hasExplicitBody =
    !isGet &&
    body?.bodyKind === "single" &&
    body.bodies.length > 0 &&
    body.bodies[0].property !== undefined &&
    !isBodyRoot;

  if (isGet) {
    // GET requests suppress body parameters entirely
    callArgs = parameters.map((p) => p.name).join(", ");
  } else if (isMultipart) {
    // Multipart body: don't add body as parameter — we'll create a MultipartReader in the method body
    callArgs = [...parameters.map((p) => p.name), "reader"].join(", ");
  } else if (isBodyRoot) {
    // @bodyRoot — the whole model is the body, no other HTTP params extracted
    parameters = [
      { name: "body", type: <TypeExpression type={body!.bodies[0].type.sourceType} /> },
    ];
    callArgs = "body";
  } else if (props.requestModel && body?.bodyKind === "single" && body.bodies.length > 0) {
    // Request model for spread body: path, body, query/header
    const bodyParam = { name: "body", type: code`${props.requestModel.name}` };
    parameters = [...pathParams, bodyParam, ...queryHeaderParams];
    // Call args: path params, then body property accesses, then query/header params
    const bodyType = body.bodies[0].type.sourceType;
    if (bodyType.kind === "Model") {
      const bodyArgs = Array.from(bodyType.properties.values()).map((p) => {
        const propName = namePolicy.getName(p.name, "class-property");
        return `body.${propName}`;
      });
      const pathArgNames = pathParams.map((p) => p.name);
      const queryArgNames = queryHeaderParams.map((p) => p.name);
      callArgs = [...pathArgNames, ...bodyArgs, ...queryArgNames].join(", ");
    } else {
      callArgs = parameters.map((p) => p.name).join(", ");
    }
  } else if (hasExplicitBody) {
    parameters.push({
      name: "body",
      type: <TypeExpression type={body!.bodies[0].type.sourceType} />,
      attributes: ["FromBody"],
    });
    callArgs = parameters.map((p) => p.name).join(", ");
  } else if (body?.bodyKind === "single" && body.bodies.length > 0) {
    parameters.push({
      name: "body",
      type: <TypeExpression type={body.bodies[0].type.sourceType} />,
      attributes: ["FromBody"],
    });
    callArgs = parameters.map((p) => p.name).join(", ");
  } else {
    callArgs = parameters.map((p) => p.name).join(", ");
  }

  // Determine the success status code from the response
  const { statusCode, hasBody } = getSuccessStatusCode(props.operation);

  // Determine response type for ProducesResponseType attribute
  const returnType = props.operation.sourceType.returnType;
  const responseStatusCode = hasBody ? "OK" : "NoContent";
  let responseTypeExpr: Children | undefined = undefined;

  if (hasBody) {
    if (returnType.kind === "Union") {
      for (const variant of returnType.variants.values()) {
        const vt = variant.type;
        if (isVoidType(vt)) continue;
        if (vt.kind === "Model") {
          try {
            if (isErrorModel($.program, vt)) continue;
          } catch {}
          if (vt.name?.toLowerCase() === "error") continue;
        }
        responseTypeExpr = <TypeExpression type={vt} />;
        break;
      }
    } else if (!isVoidType(returnType)) {
      responseTypeExpr = <TypeExpression type={returnType} />;
    }
  }

  const attributes: Children[] = [
    <Attribute name={verb} />,
    <Attribute name="Route" args={[`"${route}"`]} />,
  ];
  if (isMultipart) {
    attributes.push(<Attribute name="Consumes" args={[`"multipart/form-data"`]} />);
  }
  if (responseTypeExpr) {
    attributes.push(
      <Attribute
        name="ProducesResponseType"
        args={[
          code`(int)HttpStatusCode.${responseStatusCode}`,
          code`Type = typeof(${responseTypeExpr})`,
        ]}
      />,
    );
  } else {
    attributes.push(
      <Attribute
        name="ProducesResponseType"
        args={[code`(int)HttpStatusCode.${responseStatusCode}`, `Type = typeof(void)`]}
      />,
    );
  }

  // Generate the method body
  let methodBody: Children;
  if (isMultipart) {
    // Multipart body: parse boundary and create MultipartReader
    const implCall = hasBody
      ? code`var result = await ${props.implFieldName}.${opName}Async(${callArgs});${"\n"}return ${statusCode === 202 ? "Accepted" : "Ok"}(result);`
      : code`await ${props.implFieldName}.${opName}Async(${callArgs});${"\n"}return ${!hasBody ? "NoContent" : "Ok"}();`;
    methodBody = code`var boundary = Request.GetMultipartBoundary();
if (boundary == null)
{
   return BadRequest("Request missing multipart boundary");
}


var reader = new MultipartReader(boundary, Request.Body);
${implCall}`;
  } else {
    // Non-multipart: generate the return statement based on status code
    if (!hasBody && statusCode === 202) {
      methodBody = code`await ${props.implFieldName}.${opName}Async(${callArgs});${"\n"}return Accepted();`;
    } else if (!hasBody) {
      methodBody = code`await ${props.implFieldName}.${opName}Async(${callArgs});${"\n"}return NoContent();`;
    } else if (statusCode === 202) {
      methodBody = code`var result = await ${props.implFieldName}.${opName}Async(${callArgs});${"\n"}return Accepted(result);`;
    } else if (statusCode !== undefined && statusCode !== 200) {
      methodBody = code`var result = await ${props.implFieldName}.${opName}Async(${callArgs});${"\n"}return StatusCode(${statusCode}, result);`;
    } else {
      methodBody = code`var result = await ${props.implFieldName}.${opName}Async(${callArgs});${"\n"}return Ok(result);`;
    }
  }

  return (
    <cs.Method
      name={opName}
      async
      virtual
      public
      returns={code`Task<IActionResult>`}
      parameters={parameters}
      attributes={attributes}
      doc={getDocComments($, props.operation.sourceType)}
    >
      {methodBody}
    </cs.Method>
  );
}
