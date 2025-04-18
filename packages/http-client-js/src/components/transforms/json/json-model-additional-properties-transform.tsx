/**
 * This file defines a component that transforms JSON additional properties
 * for a given model type based on the target context ("transport" or "application").
 * It uses Alloy and TypeSpec utilities to access model metadata and generate inline code transforms.
 */

import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { getJsonRecordTransformRefkey } from "./json-record-transform.jsx";

/**
 * Interface defining the properties for the JsonAdditionalPropertiesTransform component
 */

export interface JsonAdditionalPropertiesTransformProps {
  // Code fragment or children to be transformed
  itemRef: ay.Children;
  // TypeSpec model to extract additional property details from
  type: Model;
  // Target context for the transformation ("transport" or "application")
  target: "transport" | "application";
}

/**
 * A component that applies a transformation to JSON additional properties.
 *  Additional properties are put within the "additionalProperties" envelope to improve
 *  how the generated client can serialize deserialize and correctly represent the intent.
 *  On deserialization we put the additional properties in a separate envelope
 *  On serialization we extract the additional properties from the envelope and put them
 *  on the top level of the object.
 *
 * Based on the provided model, retrieves the additional properties metadata.
 * If additional properties exist, it creates a transformation for them:
 *   - For "application" target: extracts known properties via destructuring and passes the remaining
 *     properties (rest) to the additional properties transformer.
 *   - For "transport" target: directly references the additionalProperties field and applies the transformer.
 *
 * @param props - Properties for the transformation including itemRef, type, and target context.
 * @returns Component with an ObjectProperty for the additional properties or transport-specific code.
 */
export function JsonAdditionalPropertiesTransform(props: JsonAdditionalPropertiesTransformProps) {
  // Retrieve the additional properties record defined on the model type.
  const additionalProperties = $.model.getAdditionalPropertiesRecord(props.type);

  // If there are no additional properties defined, nothing is rendered.
  if (!additionalProperties) {
    return null;
  }

  // If target is "application", process known properties and extract unknown rest properties.
  if (props.target === "application") {
    // Get all properties for the type, including any extended properties.
    const properties = $.model.getProperties(props.type, { includeExtended: true });

    // Create a comma-separated list of property names for use in inline destructuring.
    const destructuredProperties = ay.mapJoin(
      () => properties,
      (name) => name,
      {
        joiner: ",",
        ender: ",",
      },
    );

    // Create inline code for destructuring: extract known properties and capture the remaining
    // unknown properties into 'rest', then pass them to the additional properties transformer.
    const inlineDestructure = ay.code`
    ${getJsonRecordTransformRefkey(additionalProperties, props.target)}(
      (({ ${destructuredProperties} ...rest }) => rest)(${props.itemRef})
    ),
    `;

    // Render the result as an ObjectProperty with the additionalProperties key.
    return (
      <>
        <ts.ObjectProperty name="additionalProperties">{inlineDestructure}</ts.ObjectProperty>
      </>
    );
  }

  // For target "transport", simply reference the 'additionalProperties' field on the itemRef.
  const itemRef = ay.code`${props.itemRef}.additionalProperties`;

  // Render inline transformation code that wraps the additionalProperties field using the transformer.
  return (
    <>
      ...({getJsonRecordTransformRefkey(additionalProperties, props.target)}({itemRef}) ),
    </>
  );
}
