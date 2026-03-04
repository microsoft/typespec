import { Children, code, mapJoin } from "@alloy-js/core";
import type { Model } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { getJsonRecordTransformRefkey } from "./json-record-transform.jsx";

export interface JsonAdditionalPropertiesTransformProps {
  itemRef: Children;
  type: Model;
  target: "transport" | "application";
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

  // Extract additional properties by destructuring known properties and spreading the rest
  const restExpr = code`(({ ${destructuredProperties} ...rest }) => rest)(${props.itemRef})`;

  // Spread additional properties directly onto the object (not wrapped in additionalProperties)
  return (
    <>
      ...({getJsonRecordTransformRefkey(additionalProperties, props.target)}({restExpr}) ),
    </>
  );
}
