import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, ModelProperty } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { getJsonRecordTransformRefkey } from "./json-record-transform.jsx";

export interface JsonAdditionalPropertiesTransformProps {
  itemRef: ay.Children;
  type: Model;
  target: "transport" | "application";
}

export function JsonAdditionalPropertiesTransform(props: JsonAdditionalPropertiesTransformProps) {
  const { $ } = useTsp();
  const additionalProperties = $.model.getAdditionalPropertiesRecord(props.type);

  if (!additionalProperties) {
    return null;
  }

  if (props.target === "application") {
    const properties = new Map<string, ModelProperty>();
    for (const [key, value] of $.model.getProperties(props.type, { includeExtended: true })) {
      if (
        !$.type.isNever(value.type) &&
        !$.modelProperty.isHttpHeader(value) &&
        !$.modelProperty.isHttpPathParam(value) &&
        !$.modelProperty.isHttpQueryParam(value)
      ) {
        continue;
      }
      properties.set(key, value);
    }

    const destructuredProperties = ay.mapJoin(
      () => properties,
      (name) => name,
      {
        joiner: ",",
        ender: ",",
      },
    );

    // Inline destructuring that extracts the properties and passes the rest to jsonRecordUnknownToApplicationTransform_2
    const inlineDestructure = ay.code`
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

  const itemRef = ay.code`${props.itemRef}.additionalProperties`;

  return (
    <>
      ...({getJsonRecordTransformRefkey(additionalProperties, props.target)}({itemRef}) ),
    </>
  );
}
