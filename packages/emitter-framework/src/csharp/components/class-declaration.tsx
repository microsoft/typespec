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

export function ClassDeclaration(props: ClassDeclarationProps): ay.Children {
  const { $ } = useTsp();

  const namePolicy = cs.useCSharpNamePolicy();
  const className = props.name ?? namePolicy.getName(props.type.name, "class");

  const refkeys = declarationRefkeys(props.refkey, props.type)[0]; // TODO: support multiple refkeys for declarations in alloy

  const classProperties: ay.Children = [];
  const abstractMethods: ay.Children = [];
  if ($.model.is(props.type)) {
    for (const [name, prop] of props.type.properties) {
      classProperties.push(
        <cs.ClassMember
          name={namePolicy.getName(name, "class-member-public")} // todo: private
          type={<TypeExpression type={prop.type} />}
          accessModifier="public"
        />,
      );
    }
  } else if (props.type.kind === "Interface") {
    for (const [name, prop] of props.type.operations) {
      abstractMethods.push(
        <cs.ClassMethod
          name={namePolicy.getName(name, "class-method")} // todo: private
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
  }

  return (
    <>
      <cs.Class name={className} accessModifier={props.accessModifier} refkey={refkeys}>
        <ay.For each={classProperties} line>
          {(c) => (
            <>
              {c}{" "}
              <ay.Block newline>
                <ay.StatementList children={["get", "set"]} />
              </ay.Block>
            </>
          )}
        </ay.For>
        {abstractMethods}
      </cs.Class>
    </>
  );
}
