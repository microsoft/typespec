import * as ay from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Interface, Model } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { TypeExpression } from "./type-expression.jsx";
import { declarationRefkeys } from "./utils/refkey.js";

export interface ClassDeclarationProps extends Omit<cs.ClassProps, "name"> {
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
      <cs.Class name={className} accessModifier={props.accessModifier} refkey={refkeys}>
        {$.model.is(props.type) && <ClassProperties type={props.type} />}
        {props.type.kind === "Interface" && <ClassMethods type={props.type} />}
      </cs.Class>
    </>
  );
}

function ClassProperties(props: ClassPropertiesProps): ay.Children {
  const namePolicy = cs.useCSharpNamePolicy();

  const classProperties: ay.Children = [];
  for (const [name, prop] of props.type.properties) {
    classProperties.push(
      <>
        <cs.ClassMember
          name={namePolicy.getName(name, "class-member-public")}
          type={<TypeExpression type={prop.type} />}
          accessModifier="public"
        />{" "}
        <ay.Block newline>
          <ay.StatementList children={["get", "set"]} />
        </ay.Block>
      </>,
    );
  }

  return (
    <ay.For each={classProperties} hardline>
      {(c) => c}
    </ay.For>
  );
}

function ClassMethods(props: ClassMethodsProps): ay.Children {
  const namePolicy = cs.useCSharpNamePolicy();

  const abstractMethods: ay.Children = [];
  for (const [name, prop] of props.type.operations) {
    abstractMethods.push(
      <cs.ClassMethod
        name={namePolicy.getName(name, "class-method")}
        methodModifier="abstract"
        parameters={[...prop.parameters.properties.entries()].map(([name, prop]) => {
          return {
            name: namePolicy.getName(name, "type-parameter"),
            type: <TypeExpression type={prop.type} />,
          };
        })}
        accessModifier="public"
        returns={<TypeExpression type={prop.returnType} />}
      />,
    );
  }

  return <>{abstractMethods}</>;
}
