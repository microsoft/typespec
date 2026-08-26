import { For, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Attribute } from "@alloy-js/csharp";
import { isVoidType } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import type { OperationHttpCanonicalization } from "@typespec/http-canonicalization";
import { JsonSerialization } from "../utils/csharp-libs.jsx";
import { getDocComments } from "../utils/doc-comments.jsx";
import { CSharpFile } from "./csharp-file.jsx";
import { TypeExpression } from "./type-expression/type-expression.jsx";

export interface RequestModelInfo {
  name: string;
  op: OperationHttpCanonicalization;
  ifaceName: string;
}

const requestModelUsings = [
  "System",
  "System.Text.Json",
  "System.Text.Json.Nodes",
  "TypeSpec.Helpers",
  "TypeSpec.Helpers.JsonConverters",
];

export interface RequestModelsProps {
  requestModels: RequestModelInfo[];
}

/**
 * Generates request model classes for operations with unnamed body types.
 */
export function RequestModels(props: RequestModelsProps): Children {
  return (
    <For each={props.requestModels}>
      {(rm) => {
        const body = rm.op.requestParameters.body;
        if (!body || body.bodyKind !== "single" || body.bodies.length === 0) return undefined;

        const bodyType = body.bodies[0].type.sourceType;
        if (bodyType.kind !== "Model") return undefined;

        const properties = Array.from(bodyType.properties.entries()).filter(
          ([_, p]) => !isVoidType(p.type),
        );

        return (
          <CSharpFile path={`${rm.name}.cs`} using={requestModelUsings}>
            <RequestModelClass name={rm.name} properties={properties} />
          </CSharpFile>
        );
      }}
    </For>
  );
}

interface RequestModelClassProps {
  name: string;
  properties: [string, import("@typespec/compiler").ModelProperty][];
}

function RequestModelClass(props: RequestModelClassProps): Children {
  const { $ } = useTsp();
  const namePolicy = cs.useCSharpNamePolicy();

  return (
    <cs.ClassDeclaration name={props.name} public partial>
      <For each={props.properties} doubleHardline>
        {([_, property]) => {
          const propName = namePolicy.getName(property.name, "class-property");
          const attrs: Children[] = [];
          if (propName !== property.name) {
            attrs.push(
              <Attribute
                name={JsonSerialization.JsonPropertyNameAttribute}
                args={[`"${property.name}"`]}
              />,
            );
          }
          return (
            <cs.Property
              name={propName}
              type={<TypeExpression type={property.type} />}
              public
              get
              set
              doc={getDocComments($, property)}
              attributes={attrs.length > 0 ? attrs : undefined}
            />
          );
        }}
      </For>
    </cs.ClassDeclaration>
  );
}
