import * as ay from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Interface, Model } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { ClassMethod } from "./class-method.jsx";
import { TypeExpression } from "./type-expression.jsx";
import { getDocComments } from "./utils/doc-comments.jsx";
import { declarationRefkeys } from "./utils/refkey.js";

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

  const [efProps, updateProps, forwardProps] = ay.splitProps(props, ["type"], ["name", "refkey"]);

  const namePolicy = cs.useCSharpNamePolicy();
  const className = updateProps.name ?? namePolicy.getName(efProps.type.name, "class");

  const refkeys = declarationRefkeys(updateProps.refkey, props.type)[0]; // TODO: support multiple refkeys for declarations in alloy

  return (
    <>
      <cs.ClassDeclaration
        {...forwardProps}
        name={className}
        refkey={refkeys}
        doc={getDocComments($, props.type)}
      >
        {$.model.is(efProps.type) && <ClassProperties type={efProps.type} />}
        {efProps.type.kind === "Interface" && <ClassMethods type={efProps.type} />}
      </cs.ClassDeclaration>
    </>
  );
}

function ClassProperties(props: ClassPropertiesProps): ay.Children {
  const { $ } = useTsp();
  const namePolicy = cs.useCSharpNamePolicy();

  const classProperties: ay.Children = [];
  for (const [name, property] of props.type.properties) {
    classProperties.push(
      <>
        <cs.ClassMember
          name={namePolicy.getName(name, "class-member-public")}
          type={<TypeExpression type={property.type} />}
          public
          doc={getDocComments($, property)}
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
  const operations = Array.from(props.type.operations.values());

  return operations.map((o) => <ClassMethod type={o} />);
}
