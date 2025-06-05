import * as ay from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Interface, Model } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { TypeExpression } from "./type-expression.jsx";

export interface ClassDeclarationProps extends Omit<cs.ClassProps, "name"> {
  name?: string;
  type: Model | Interface;
}

export function ClassDeclaration(props: ClassDeclarationProps): ay.Children {
  const { $ } = useTsp();

  const namePolicy = cs.useCSharpNamePolicy();
  const className = namePolicy.getName(props.name ?? props.type.name, "class");

  const classProperties: ay.Children = [];
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
  }

  return (
    <>
      <cs.Class name={className}>
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
      </cs.Class>
    </>
  );
}
