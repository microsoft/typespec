import { code, REFKEYABLE, type Children, type Namekey } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Attribute } from "@alloy-js/csharp";
import { Serialization } from "@alloy-js/csharp/global/System/Text/Json";
import {
  getEncode,
  getProperty,
  resolveEncodedName,
  type ModelProperty,
  type Type,
} from "@typespec/compiler";
import { Experimental_OverridableComponent, useTsp } from "../../../core/index.js";
import { useJsonConverterResolver } from "../json-converter/json-converter-resolver.jsx";
import { TypeExpression } from "../type-expression.jsx";
import { getDocComments } from "../utils/doc-comments.jsx";
import { getNullableUnionInnerType } from "../utils/nullable-util.js";

export interface PropertyProps extends Omit<cs.PropertyProps, "name" | "type"> {
  /** The TypeSpec property to create the C# property from. */
  type: ModelProperty;
  /** Set an alternative name for the property. Otherwise default to the TypeSpec property name. */
  name?: Namekey | string;
  /**
   * Set an alternative C# type for the property. Otherwise default to rendering
   * {@link PropertyProps.type}, unwrapping a nullable union if there is one.
   */
  csharpType?: Children;
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
  return (
    <Experimental_OverridableComponent
      declaration
      type={props.type}
      Declaration={PropertyBody}
      declarationProps={props}
    >
      <PropertyBody {...props} />
    </Experimental_OverridableComponent>
  );
}

function PropertyBody(props: PropertyProps): Children {
  const { $ } = useTsp();
  const { type: tspProperty, name, csharpType, jsonAttributes, ...propertyProps } = props;
  const result = preprocessPropertyType(tspProperty);

  let overrideType: "" | "override" | "new" = "";
  let isVirtual = false;
  if (tspProperty.model) {
    if (tspProperty.model.baseModel) {
      const base = tspProperty.model.baseModel;
      const baseProperty = getProperty(base, tspProperty.name);
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
      tspProperty.model.derivedModels &&
      tspProperty.model.derivedModels.length > 0
    ) {
      isVirtual = tspProperty.model.derivedModels.some((derived) => {
        const derivedProperty = derived.properties.get(tspProperty.name);
        if (derivedProperty) {
          const derivedResult = preprocessPropertyType(derivedProperty);
          return derivedResult.nullable === result.nullable && derivedResult.type === result.type;
        }
      });
    }
  }
  const attributes = [];
  if (jsonAttributes) {
    attributes.push(<JsonNameAttribute type={tspProperty} />);
    const encodeData = getEncode($.program, tspProperty);
    if (encodeData) {
      const JsonConverterResolver = useJsonConverterResolver();
      if (JsonConverterResolver) {
        const converter = JsonConverterResolver.resolveJsonConverter(result.type, encodeData);
        if (converter) {
          attributes.push(
            <JsonConverterAttribute type={<cs.Reference refkey={converter.namekey} />} />,
          );
        }
      }
    }
  }

  return (
    <cs.Property
      name={name ?? tspProperty.name}
      type={csharpType ?? <TypeExpression type={result.type} />}
      override={overrideType === "override"}
      new={overrideType === "new"}
      public
      virtual={isVirtual}
      required={!tspProperty.optional}
      nullable={result.nullable}
      doc={getDocComments($, tspProperty)}
      attributes={attributes}
      get
      set
      {...propertyProps}
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
    <Attribute
      name={Serialization.JsonPropertyNameAttribute[REFKEYABLE]()}
      args={[JSON.stringify(jsonName)]}
    />
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
      name={Serialization.JsonConverterAttribute[REFKEYABLE]()}
      args={[code`typeof(${props.type})`]}
    />
  );
}
