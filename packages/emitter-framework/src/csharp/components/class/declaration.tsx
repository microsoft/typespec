import * as ay from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Interface, Model } from "@typespec/compiler";
import { useTsp } from "../../../core/index.js";
import { Property } from "../property/property.jsx";
import { TypeExpression } from "../type-expression.jsx";
import { getDocComments } from "../utils/doc-comments.jsx";
import { declarationRefkeys } from "../utils/refkey.js";

export interface ClassDeclarationProps extends Omit<cs.ClassDeclarationProps, "name"> {
  name?: string;
  type: Model | Interface;
}

interface ClassPropertiesProps {
  type: Model;
}

interface ClassMethodsProps {
  type: Interface;
}

export function ClassDeclaration(props: ClassDeclarationProps): ay.Children {
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
        doc={getDocComments($, props.type)}
      >
        {$.model.is(props.type) && <ClassProperties type={props.type} />}
        {props.type.kind === "Interface" && <ClassMethods type={props.type} />}
      </cs.ClassDeclaration>
    </>
  );
}

function ClassProperties(props: ClassPropertiesProps): ay.Children {
  return (
    <ay.For each={props.type.properties.entries()} hardline>
      {([name, property]) => <Property type={property} />}
    </ay.For>
  );
}

function ClassMethods(props: ClassMethodsProps): ay.Children {
  const { $ } = useTsp();
  const namePolicy = cs.useCSharpNamePolicy();

  const abstractMethods: ay.Children = [];
  for (const [name, method] of props.type.operations) {
    abstractMethods.push(
      <cs.ClassMethod
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
