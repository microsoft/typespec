import { refkey as ayRefkey, code, For, type Children, type Refkey } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import type { Interface, Operation } from "@typespec/compiler";
import { isTemplateDeclaration, isVoidType } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import type { OperationHttpCanonicalization } from "@typespec/http-canonicalization";
import { getUniqueItems } from "@typespec/json-schema";
import { getDocComments } from "../../utils/doc-comments.jsx";
import { getSuccessReturnType } from "../../utils/return-type-helpers.js";
import { TypeExpression } from "../type-expression/type-expression.jsx";

const interfaceRefKeyPrefix = Symbol.for("http-server-csharp:interface");

/** Creates a stable refkey for a business logic interface from its TypeSpec Interface type. */
export function businessLogicInterfaceRefkey(type: Interface): Refkey {
  return ayRefkey(interfaceRefKeyPrefix, type);
}

export interface BusinessLogicInterfaceProps {
  /** The TypeSpec interface to generate a business logic interface for. */
  type: Interface;
  /** The canonicalized HTTP operations (for filtering body params on GET). */
  canonicalOps?: OperationHttpCanonicalization[];
}

/**
 * Generates an ASP.NET business logic interface (e.g., `IPetStoreOperations`)
 * from a TypeSpec interface. Each operation becomes an async Task method.
 */
export function BusinessLogicInterface(props: BusinessLogicInterfaceProps): Children {
  const { $ } = useTsp();
  const namePolicy = cs.useCSharpNamePolicy();
  const interfaceName = `I${namePolicy.getName(props.type.name, "class")}`;
  const operations = Array.from(props.type.operations.entries()).filter(
    ([_, op]) => !isTemplateDeclaration(op),
  );

  // Build a map from operation name to its canonicalized HTTP info
  const canonicalMap = new Map<string, OperationHttpCanonicalization>();
  if (props.canonicalOps) {
    for (const cop of props.canonicalOps) {
      canonicalMap.set(cop.name, cop);
    }
  }

  return (
    <cs.InterfaceDeclaration
      name={interfaceName}
      public
      refkey={businessLogicInterfaceRefkey(props.type)}
      doc={getDocComments($, props.type)}
    >
      <For each={operations} doubleHardline>
        {([name, op]) => (
          <BusinessLogicMethod name={name} operation={op} canonicalOp={canonicalMap.get(name)} />
        )}
      </For>
    </cs.InterfaceDeclaration>
  );
}

interface BusinessLogicMethodProps {
  name: string;
  operation: Operation;
  canonicalOp?: OperationHttpCanonicalization;
}

/**
 * Renders a single async method signature in a business logic interface.
 * Method names get an "Async" suffix (e.g., `ListPetsAsync`).
 */
function BusinessLogicMethod(props: BusinessLogicMethodProps): Children {
  const namePolicy = cs.useCSharpNamePolicy();
  const methodName = `${namePolicy.getName(props.name, "class-method")}Async`;

  const { $ } = useTsp();
  const successType = getSuccessReturnType($.program, props.operation.returnType);
  const returnType = successType
    ? code`Task<${(<TypeExpression type={successType} />)}>`
    : code`Task`;

  // Check if this is a multipart request
  const isMultipart = props.canonicalOp?.requestParameters.body?.bodyKind === "multipart";

  // For GET operations, suppress body parameters entirely
  const isGet = props.canonicalOp?.method === "get";
  const bodyPropNames = new Set<string>();
  if (isGet && props.canonicalOp) {
    const body = props.canonicalOp.requestParameters.body;
    if (body?.bodyKind === "single" && body.bodies.length > 0) {
      const bodyType = body.bodies[0].type.sourceType;
      if (bodyType.kind === "Model") {
        for (const [name] of bodyType.properties) {
          bodyPropNames.add(name);
        }
      }
    }
    for (const p of props.canonicalOp.requestParameters.properties) {
      if (p.kind === "body" || p.kind === "bodyRoot" || p.kind === "bodyProperty") {
        bodyPropNames.add(p.property.sourceType.name);
      }
    }
  }

  // For multipart requests, suppress all body-related params
  // For all requests, suppress content-type params
  const filteredPropNames = new Set<string>();
  if (props.canonicalOp) {
    for (const p of props.canonicalOp.requestParameters.properties) {
      if (
        isMultipart &&
        (p.kind === "body" ||
          p.kind === "bodyRoot" ||
          p.kind === "bodyProperty" ||
          p.kind === "multipartBody")
      ) {
        filteredPropNames.add(p.property.sourceType.name);
      }
      if (p.property.isContentTypeProperty) {
        filteredPropNames.add(p.property.sourceType.name);
      }
    }
  }

  const parameters = Array.from(props.operation.parameters.properties.entries())
    .filter(([name, prop]) => !isVoidType(prop.type))
    .filter(([name]) => !bodyPropNames.has(name))
    .filter(([name]) => !filteredPropNames.has(name))
    .map(([pName, prop]) => {
      const isUnique = getUniqueItems($.program, prop);
      const isArrayType = prop.type.kind === "Model" && $.array.is(prop.type);
      let typeExpr: Children;
      if (isUnique && isArrayType && prop.type.kind === "Model" && prop.type.indexer?.value) {
        typeExpr = (
          <>
            ISet&lt;
            <TypeExpression type={prop.type.indexer.value} />
            &gt;
          </>
        );
      } else {
        typeExpr = <TypeExpression type={prop.type} />;
      }
      return {
        name: namePolicy.getName(pName, "parameter"),
        type: typeExpr,
        optional: prop.optional,
      };
    })
    // Required parameters must come before optional ones in C#
    .sort((a, b) => (a.optional === b.optional ? 0 : a.optional ? 1 : -1));

  // For multipart requests, add MultipartReader parameter
  if (isMultipart) {
    parameters.push({
      name: "reader",
      type: code`MultipartReader`,
      optional: false,
    });
  }

  return (
    <cs.InterfaceMethod
      name={methodName}
      parameters={parameters}
      returns={returnType}
      doc={getDocComments($, props.operation)}
    />
  );
}
