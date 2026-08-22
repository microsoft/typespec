import { For, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import type { Interface, Model, ModelProperty } from "@typespec/compiler";
import { isVoidType } from "@typespec/compiler";
import { Experimental_OverridableComponent, useTsp } from "../../../core/index.js";
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
  /**
   * The properties to render. Defaults to every property of the model.
   * Only applies when {@link ClassDeclarationProps.type} is a `Model`.
   */
  properties?: ModelProperty[];
  /** Extra members rendered before the type's properties or methods. */
  children?: Children;
}

interface ClassPropertiesProps {
  type: Model;
  properties?: ModelProperty[];
  /** If set the property will add the json serialization attributes(using System.Text.Json). */
  jsonAttributes?: boolean;
}

interface ClassMethodsProps {
  type: Interface;
}

export function ClassDeclaration(props: ClassDeclarationProps): Children {
  return (
    <Experimental_OverridableComponent
      declaration
      type={props.type}
      Declaration={ClassDeclarationBody}
      declarationProps={props}
    >
      <ClassDeclarationBody {...props} />
    </Experimental_OverridableComponent>
  );
}

function ClassDeclarationBody(props: ClassDeclarationProps): Children {
  const { $ } = useTsp();
  const { type, name, jsonAttributes, properties, children, refkey, baseType, ...classProps } =
    props;

  const namePolicy = cs.useCSharpNamePolicy();
  const className = name ?? namePolicy.getName(type.name, "class");

  const refkeys = declarationRefkeys(refkey, type)[0]; // TODO: support multiple refkeys for declarations in alloy

  return (
    <cs.ClassDeclaration
      name={className}
      refkey={refkeys}
      baseType={
        baseType ??
        (type.kind === "Model" && type.baseModel ? (
          <TypeExpression type={type.baseModel} />
        ) : undefined)
      }
      doc={getDocComments($, type)}
      {...classProps}
    >
      {children}
      {type.kind === "Model" && (
        <ClassProperties type={type} properties={properties} jsonAttributes={jsonAttributes} />
      )}
      {type.kind === "Interface" && <ClassMethods type={type} />}
    </cs.ClassDeclaration>
  );
}

function ClassProperties(props: ClassPropertiesProps): Children {
  // Ignore 'void' type properties which is not valid in csharp
  const properties = (props.properties ?? Array.from(props.type.properties.values())).filter(
    (p) => !isVoidType(p.type),
  );
  return (
    <For each={properties} doubleHardline>
      {(property) => <Property type={property} jsonAttributes={props.jsonAttributes} />}
    </For>
  );
}

function ClassMethods(props: ClassMethodsProps): Children {
  const { $ } = useTsp();
  const namePolicy = cs.useCSharpNamePolicy();

  const abstractMethods: Children = [];
  for (const [name, method] of props.type.operations) {
    abstractMethods.push(
      <cs.Method
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
