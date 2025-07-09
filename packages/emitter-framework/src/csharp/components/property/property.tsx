import { type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Attribute } from "@alloy-js/csharp";
import { type ModelProperty, resolveEncodedName, type Type } from "@typespec/compiler";
import { useTsp } from "../../../core/index.js";
import { TypeExpression } from "../type-expression.jsx";
import { getDocComments } from "../utils/doc-comments.jsx";

export interface PropertyProps {
  type: ModelProperty;
  /** If set the property will add the json serialization attributes(using System.Text.Json). */
  jsonAttributes?: boolean;
}

/**
 * Create a C# property declaration from a TypeSpec property type.
 */
export function Property(props: PropertyProps): Children {
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
      attributes={props.jsonAttributes ? [<JsonNameAttribute type={props.type} />] : undefined}
      get
      set
    />
  );
}

export interface JsonNameAttributeProps {
  type: ModelProperty;
}

function JsonNameAttribute(props: JsonNameAttributeProps): Children {
  const { program } = useTsp();
  const jsonName = resolveEncodedName(program, props.type, "application/json");
  return <Attribute name="System.Text.Json.JsonPropertyName" args={[JSON.stringify(jsonName)]} />;
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
