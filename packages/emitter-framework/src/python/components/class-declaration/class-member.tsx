import { typingModule } from "#python/builtins.js";
import { type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { type ModelProperty, type Operation } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";
import { TypeExpression } from "../type-expression/type-expression.js";
import { Method } from "./class-method.js";
import { PrimitiveInitializer } from "./primitive-initializer.js";

export interface ClassMemberProps {
  type: ModelProperty | Operation;
  doc?: Children;
  optional?: boolean;
  methodType?: "method" | "class" | "static";
  abstract?: boolean;
}

/**
 * Creates the class member for the property.
 * @param props - The props for the class member.
 * @returns The class member.
 */
export function ClassMember(props: ClassMemberProps) {
  const { $ } = useTsp();
  const namer = py.usePythonNamePolicy();
  const name = namer.getName(props.type.name, "class-member");
  const doc = props.doc ?? $.type.getDoc(props.type);

  if ($.modelProperty.is(props.type)) {
    // Map never-typed properties to typing.Never

    const unpackedType = props.type.type;
    const isOptional = props.optional ?? props.type.optional ?? false;
    const defaultValue = props.type.defaultValue;
    const initializer = defaultValue ? (
      <PrimitiveInitializer defaultValue={defaultValue} propertyType={unpackedType} />
    ) : undefined;
    const unpackedTypeNode: Children = <TypeExpression type={unpackedType} />;
    const typeNode = isOptional ? (
      <py.TypeReference
        refkey={typingModule["."].Optional}
        typeArgs={[unpackedTypeNode]}
      ></py.TypeReference>
    ) : (
      unpackedTypeNode
    );

    const classMemberProps = {
      doc,
      name,
      optional: isOptional,
      ...(typeNode ? { type: typeNode } : {}),
      ...(initializer ? { initializer } : {}),
      omitNone: !isOptional,
    };
    return <py.VariableDeclaration {...classMemberProps} />;
  }

  if ($.operation.is(props.type)) {
    return (
      <Method type={props.type} doc={doc} methodType={props.methodType} abstract={props.abstract} />
    );
  }

  // If type is neither ModelProperty nor Operation, return empty fragment
  return <></>;
}
