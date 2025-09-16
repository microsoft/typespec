import { code, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Attribute } from "@alloy-js/csharp";
import { Serialization } from "@alloy-js/csharp/global/System/Text/Json/index.js";
import {
  getEncode,
  getProperty,
  resolveEncodedName,
  type ModelProperty,
  type Type,
} from "@typespec/compiler";
import { useTsp } from "../../../core/index.js";
import { useJsonConverterResolver } from "../json-converter/json-converter-resolver.jsx";
import { TypeExpression } from "../type-expression.jsx";
import { getDocComments } from "../utils/doc-comments.jsx";
import { getNullableUnionInnerType } from "../utils/nullable-util.js";

export interface PropertyProps {
  type: ModelProperty;
  /** If set the property will add the json serialization attributes(using System.Text.Json.Serialization).
   *  - the JsonPropertyName attribute
   *  - the JsonConverter attribute if the property has encoding and a JsonConverterResolver context is available
   * */
  jsonAttributes?: boolean;
}

/**
 * Create a C# property declaration from a TypeSpec property type.
 */
export function Property(props: PropertyProps): Children {
  const { $ } = useTsp();
  const result = preprocessPropertyType(props.type);

  let overrideType: "" | "override" | "new" = "";
  let isVirtual = false;
  if (props.type.model) {
    if (props.type.model.baseModel) {
      const base = props.type.model.baseModel;
      const baseProperty = getProperty(base, props.type.name);
      if (baseProperty) {
        const baseResult = preprocessPropertyType(baseProperty);
        if (baseResult.nullable === result.nullable && baseResult.type === result.type) {
          overrideType = "override";
        } else {
          overrideType = "new";
        }
      }
    }
    if (
      overrideType === "" &&
      props.type.model.derivedModels &&
      props.type.model.derivedModels.length > 0
    ) {
      isVirtual = props.type.model.derivedModels.some((derived) => {
        const derivedProperty = derived.properties.get(props.type.name);
        if (derivedProperty) {
          const derivedResult = preprocessPropertyType(derivedProperty);
          return derivedResult.nullable === result.nullable && derivedResult.type === result.type;
        }
      });
    }
  }
  const attributes = [];
  if (props.jsonAttributes) {
    attributes.push(<JsonNameAttribute type={props.type} />);
    const encodeData = getEncode($.program, props.type);
    if (encodeData) {
      const JsonConverterResolver = useJsonConverterResolver();
      if (JsonConverterResolver) {
        const converter = JsonConverterResolver.resolveJsonConverter(result.type, encodeData);
        if (converter) {
          attributes.push(
            <JsonConverterAttribute type={<cs.Reference refkey={converter.nameKey} />} />,
          );
        }
      }
    }
  }

  return (
    <cs.Property
      name={props.type.name}
      type={<TypeExpression type={result.type} />}
      override={overrideType === "override"}
      new={overrideType === "new"}
      public
      virtual={isVirtual}
      required={!props.type.optional}
      nullable={result.nullable}
      doc={getDocComments($, props.type)}
      attributes={attributes}
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
  return (
    <Attribute name={Serialization.JsonPropertyNameAttribute} args={[JSON.stringify(jsonName)]} />
  );
}

function preprocessPropertyType(prop: ModelProperty): { type: Type; nullable: boolean } {
  const type = prop.type;

  if (type.kind === "Union") {
    const innerType = getNullableUnionInnerType(type);
    if (innerType) {
      return { type: innerType, nullable: true };
    } else {
      return { type, nullable: prop.optional };
    }
  } else {
    return { type, nullable: prop.optional };
  }
}

function JsonConverterAttribute(props: { type: Children }): Children {
  return (
    <Attribute
      name={code`${Serialization.JsonConverterAttribute}`}
      args={[code`typeof(${props.type})`]}
    />
  );
}
