import { Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { ModelProperty, Type } from "@typespec/compiler";
import { useTsp } from "../../../core/index.js";
import { TypeExpression } from "../type-expression.jsx";
import { getDocComments } from "../utils/doc-comments.jsx";

export interface ClassPropertyProps {
  type: ModelProperty;
}

export function Property(props: ClassPropertyProps): Children {
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
