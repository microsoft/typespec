import { Children, code, mapJoin } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Model } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { getJsonRecordTransformRefkey } from "./json-record-transform.jsx";

export interface JsonAdditionalPropertiesTransformProps {
  itemRef: Children;
  type: Model;
  target: "transport" | "application";
}

/**
 * Determines whether a model uses the `additionalProperties` wrapper property
 * (instead of flat spreading). This is true when the model has a record index type
 * from spreads but the named properties are not all assignable to the element type,
 * or when an ancestor model uses the wrapper approach.
 */
function usesWrappedAdditionalProperties($: ReturnType<typeof useTsp>["$"], type: Model): boolean {
  const indexType = $.model.getIndexType(type);
  if (indexType && $.record.is(indexType)) {
    const elementType = indexType.indexer!.value;
    const properties = $.model.getProperties(type);
    const allCompatible = Array.from(properties.values()).every((prop) =>
      $.modelProperty.is(prop) ? $.type.isAssignableTo(prop.type, elementType) : true,
    );
    return !allCompatible;
  }

  // Direct base is a record (extends Record<T>) → always flat
  if (type.baseModel && $.record.is(type.baseModel)) {
    return false;
  }

  // Recurse into base model to check if the wrapper comes from inheritance
  if (type.baseModel) {
    return usesWrappedAdditionalProperties($, type.baseModel);
  }

  return false;
}

export function JsonAdditionalPropertiesTransform(props: JsonAdditionalPropertiesTransformProps) {
  const { $ } = useTsp();
  const additionalProperties = $.model.getAdditionalPropertiesRecord(props.type);

  if (!additionalProperties) {
    return null;
  }

  const properties = $.model.getProperties(props.type, { includeExtended: true });
  const destructuredProperties = mapJoin(
    () => properties,
    (name) => name,
    {
      joiner: ",",
      ender: ",",
    },
  );

  if (usesWrappedAdditionalProperties($, props.type)) {
    // Incompatible case: use additionalProperties wrapper property
    if (props.target === "application") {
      const inlineDestructure = code`
      ${getJsonRecordTransformRefkey(additionalProperties, props.target)}(
        (({ ${destructuredProperties} ...rest }) => rest)(${props.itemRef})
      ),
      `;

      return (
        <>
          <ts.ObjectProperty name="additionalProperties">{inlineDestructure}</ts.ObjectProperty>
        </>
      );
    }

    const itemRef = code`${props.itemRef}.additionalProperties`;

    return (
      <>
        ...({getJsonRecordTransformRefkey(additionalProperties, props.target)}({itemRef}) ),
      </>
    );
  }

  // Compatible case: spread additional properties directly onto the object
  const restExpr = code`(({ ${destructuredProperties} ...rest }) => rest)(${props.itemRef})`;

  return (
    <>
      ...({getJsonRecordTransformRefkey(additionalProperties, props.target)}({restExpr}) ),
    </>
  );
}
