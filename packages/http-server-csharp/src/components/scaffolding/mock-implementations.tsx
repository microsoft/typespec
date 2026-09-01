import { code, For, SourceDirectory, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import type { Interface, Operation, Program } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import type { OperationHttpCanonicalization } from "@typespec/http-canonicalization";
import { CSharpFile } from "../csharp-file.jsx";
import { TypeExpression } from "../type-expression/type-expression.jsx";
import {
  getGetBodyPropNames,
  getMockReturnStatement,
  getSuccessReturnType,
} from "./mock-return-utils.jsx";

export interface MockImplementationsProps {
  interfaces: Interface[];
  /** Map from interface name to its canonicalized HTTP operations. */
  canonicalOpsMap?: Map<string, OperationHttpCanonicalization[]>;
}

/**
 * Renders per-interface mock implementation classes.
 * These go under the service namespace.
 */
export function MockImplementations(props: MockImplementationsProps): Children {
  return (
    <SourceDirectory path="mocks">
      <For each={props.interfaces}>
        {(iface) => (
          <MockImplementation type={iface} canonicalOps={props.canonicalOpsMap?.get(iface.name)} />
        )}
      </For>
    </SourceDirectory>
  );
}

interface MockImplementationProps {
  type: Interface;
  canonicalOps?: OperationHttpCanonicalization[];
}

/**
 * Generates a mock implementation class for a business logic interface.
 */
function MockImplementation(props: MockImplementationProps): Children {
  const namePolicy = cs.useCSharpNamePolicy();
  const { $ } = useTsp();
  const interfaceName = `I${namePolicy.getName(props.type.name, "class")}`;
  const className = namePolicy.getName(props.type.name, "class");
  const operations = Array.from(props.type.operations.entries());

  // Build canonical ops map by name
  const canonicalMap = new Map<string, OperationHttpCanonicalization>();
  if (props.canonicalOps) {
    for (const cop of props.canonicalOps) {
      canonicalMap.set(cop.name, cop);
    }
  }

  return (
    <CSharpFile
      path={`${className}.cs`}
      using={[
        "System",
        "System.Net",
        "System.Text.Json",
        "System.Text.Json.Serialization",
        "System.Threading.Tasks",
        "Microsoft.AspNetCore.Mvc",
      ]}
    >
      {code`
        /// <summary>
        /// This is a mock implementation of the business logic interface for
        /// demonstration and early development.  Feel free to overwrite this file.
        /// Or replace it with another implementation, and register that implementation
        /// in the dependency injection container
        /// </summary>
        public class ${className} : ${interfaceName}
        {
          /// <summary>
          /// The controller constructor, using the dependency injection container to satisfy the parameters.
          /// </summary>
          /// <param name="initializer">The initializer class, registered with dependency injection</param>
          /// <param name="accessor">The accessor for the HttpContext, allows your implementation to
          /// get properties of the incoming request and to set properties of the outgoing response.</param>
          public ${className}(IInitializer initializer, IHttpContextAccessor accessor)
          {
            _initializer = initializer;
            HttpContextAccessor = accessor;
          }

          private IInitializer _initializer;

          /// <summary>
          /// Use this property in your implementation to access properties of the incoming HttpRequest
          /// and to set properties of the outgoing HttpResponse
          /// </summary>
          public IHttpContextAccessor HttpContextAccessor { get; }

          ${(<MockMethods operations={operations} program={$.program} canonicalMap={canonicalMap} />)}
        }
      `}
    </CSharpFile>
  );
}

interface MockMethodsProps {
  operations: [string, Operation][];
  program: Program;
  canonicalMap?: Map<string, OperationHttpCanonicalization>;
}

function MockMethods(props: MockMethodsProps): Children {
  const namePolicy = cs.useCSharpNamePolicy();
  return (
    <For each={props.operations} doubleHardline>
      {([name, op]) => {
        const methodName = `${namePolicy.getName(name, "class-method")}Async`;
        const successType = getSuccessReturnType(props.program, op.returnType);

        const returnTypeExpr = successType
          ? code`Task<${(<TypeExpression type={successType} />)}>`
          : code`Task`;

        const bodyPropNames = getGetBodyPropNames(name, props.canonicalMap);

        // Check if this is a multipart operation
        const canonicalOp = props.canonicalMap?.get(name);
        const isMultipart = canonicalOp?.requestParameters.body?.bodyKind === "multipart";
        const multipartBodyPropNames = new Set<string>();
        if (isMultipart && canonicalOp) {
          for (const p of canonicalOp.requestParameters.properties) {
            if (
              p.kind === "body" ||
              p.kind === "bodyRoot" ||
              p.kind === "bodyProperty" ||
              p.kind === "multipartBody"
            ) {
              multipartBodyPropNames.add(p.property.sourceType.name);
            }
            if (p.property.isContentTypeProperty) {
              multipartBodyPropNames.add(p.property.sourceType.name);
            }
          }
        }

        const parameters = Array.from(op.parameters.properties.entries())
          .filter(([pName]) => !bodyPropNames.has(pName))
          .filter(([pName]) => !multipartBodyPropNames.has(pName))
          .map(([pName, prop]) => ({
            name: namePolicy.getName(pName, "parameter"),
            type: <TypeExpression type={prop.type} />,
            optional: prop.optional,
          }))
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

        const paramList = parameters.map(
          (p, i) =>
            code`${p.type}${p.optional ? "?" : ""} ${p.name}${i < parameters.length - 1 ? ", " : ""}`,
        );

        const returnStatement = getMockReturnStatement(props.program, op.returnType);

        return code`public ${returnTypeExpr} ${methodName}(${paramList})
{
  ${returnStatement}
}`;
      }}
    </For>
  );
}
