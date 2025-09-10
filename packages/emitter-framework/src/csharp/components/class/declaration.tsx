import { For, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Method } from "@alloy-js/csharp";
import { isVoidType, type Interface, type Model } from "@typespec/compiler";
import { useTsp } from "../../../core/index.js";
import { Property } from "../property/property.jsx";
import { TypeExpression } from "../type-expression.jsx";
import { getDocComments } from "../utils/doc-comments.jsx";
import { declarationRefkeys } from "../utils/refkey.js";

export interface ClassDeclarationProps extends Omit<cs.ClassDeclarationProps, "name"> {
  /** Set an alternative name for the class. Otherwise default to the type name. */
  name?: string;
  /** Type to use to create this class. */
  type: Model | Interface;
  /** If set the property will add the json serialization attributes(using System.Text.Json). */
  jsonAttributes?: boolean;
}

interface ClassPropertiesProps {
  type: Model;
  /** If set the property will add the json serialization attributes(using System.Text.Json). */
  jsonAttributes?: boolean;
}

interface ClassMethodsProps {
  type: Interface;
}

export function ClassDeclaration(props: ClassDeclarationProps): Children {
  const { $ } = useTsp();

  const namePolicy = cs.useCSharpNamePolicy();
  const className = props.name ?? namePolicy.getName(props.type.name, "class");

  const refkeys = declarationRefkeys(props.refkey, props.type)[0]; // TODO: support multiple refkeys for declarations in alloy

  return (
    <>
      <cs.ClassDeclaration
        {...props}
        name={className}
        refkey={refkeys}
        baseType={
          props.baseType ??
          (props.type.kind === "Model" && props.type.baseModel ? (
            <TypeExpression type={props.type.baseModel} />
          ) : undefined)
        }
        doc={getDocComments($, props.type)}
      >
        {props.type.kind === "Model" && (
          <ClassProperties type={props.type} jsonAttributes={props.jsonAttributes} />
        )}
        {props.type.kind === "Interface" && <ClassMethods type={props.type} />}
      </cs.ClassDeclaration>
    </>
  );
}

function ClassProperties(props: ClassPropertiesProps): Children {
  // Ignore 'void' type properties which is not valid in csharp
  const properties = Array.from(props.type.properties.entries()).filter(
    ([_, p]) => !isVoidType(p.type),
  );
  return (
    <For each={properties} doubleHardline>
      {([name, property]) => <Property type={property} jsonAttributes={props.jsonAttributes} />}
    </For>
  );
}

function ClassMethods(props: ClassMethodsProps): Children {
  const { $ } = useTsp();
  const namePolicy = cs.useCSharpNamePolicy();

  const abstractMethods: Children = [];
  for (const [name, method] of props.type.operations) {
    abstractMethods.push(
      <Method
        name={namePolicy.getName(name, "class-method")}
        abstract
        parameters={[...method.parameters.properties.entries()].map(([name, prop]) => {
          return {
            name: namePolicy.getName(name, "type-parameter"),
            type: <TypeExpression type={prop.type} />,
          };
        })}
        public
        doc={getDocComments($, method)}
        returns={<TypeExpression type={method.returnType} />}
      />,
    );
  }

  return <>{abstractMethods}</>;
}
