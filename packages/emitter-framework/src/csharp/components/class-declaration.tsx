import * as ay from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Interface, Model, ModelProperty, Type } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
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

function preprocessPropertyType(type: Type): { type: Type; nullable: boolean } {
  const { $ } = useTsp();

  if (type.kind === "Union") {
    const variants = type.variants;
    const nonNullVariant = [...variants.values()].find((v) => v.type !== $.intrinsic.null);
    const nullVariant = [...variants.values()].find((v) => v.type !== $.intrinsic.null);
    if (nonNullVariant && nullVariant && variants.size === 2) {
      return { type: nonNullVariant.type, nullable: true };
    } else {
      return { type, nullable: false };
    }
  } else {
    return { type, nullable: false };
  }
}

function ClassProperties(props: ClassPropertiesProps): ay.Children {
  return (
    <ay.For each={props.type.properties.entries()} hardline>
      {([name, property]) => <ClassProperty type={property} />}
    </ay.For>
  );
}

export interface ClassPropertyProps {
  type: ModelProperty;
}

function ClassProperty(props: ClassPropertyProps): ay.Children {
  const result = preprocessPropertyType(props.type.type);
  const { $ } = useTsp();

  return (
    <cs.Property
      name={props.type.name}
      type={<TypeExpression type={result.type} />}
      public
      required={!props.type.optional}
      nullable={result.nullable}
      doc={getDocComments($, props.type)}
      get
      set
    />
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
