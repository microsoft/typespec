/**
 * This file contains the ScalarDataTransform component.
 * The component is responsible for applying the appropriate transformation
 * on scalar or model property types based on the target context ("transport" or "application").
 * The transformation is determined by the encoding associated with the scalar value.
 */

import { Children, Refkey } from "@alloy-js/core";
import { EncodeData, ModelProperty, Scalar } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { reportDiagnostic } from "../../lib.js";
import { unpackProperty } from "../utils/unpack-model-property.js";
import { getScalarTransformer } from "./scalar-transform.jsx";

/**
 * Interface defining the properties for the ScalarDataTransform component.
 *
 * @property {Refkey | Children} itemRef - A reference or children element that represents the item to be transformed.
 * @property {Scalar | ModelProperty} type - The type information provided; can be a scalar type or a model property.
 * @property {"transport" | "application"} target - The target context for the transformation. Determines
 *   whether to apply toTransport or toApplication transformation.
 */
export interface ScalarDataTransformProps {
  itemRef: Refkey | Children;
  type: Scalar | ModelProperty;
  target: "transport" | "application";
}

/**
 * Transforms scalar data or a scalar value embedded in a model property depending on the target context.
 *
 * The function checks whether the provided type is a scalar or a model property wrapping a scalar.
 * If a model property is provided, it unpacks it to extract the scalar type and retrieves the encoding.
 * In case the underlying type is not scalar, a diagnostic is reported.
 *
 * The transformation function (either toTransport or toApplication) is obtained via getScalarTransformer.
 * The component then applies the corresponding transformation based on the target.
 *
 * @param {ScalarDataTransformProps} props - The transformation properties.
 * @returns The transformed item based on the specified target context, or null if an error occurs.
 */
export function ScalarDataTransform(props: ScalarDataTransformProps) {
  let scalar: Scalar;
  let encoding: EncodeData | undefined;

  // Check if the provided type is a model property and extract the underlying scalar type.
  if ($.modelProperty.is(props.type)) {
    // Unpack the model property to get the value type.
    const valueType = unpackProperty(props.type);

    // If the unpacked type is not a scalar, report a diagnostic error and halt further processing.
    if (!$.scalar.is(valueType)) {
      reportDiagnostic($.program, {
        code: "unexpected-non-scalar-type",
        target: props.type,
      });
      return null;
    }
    // Set the scalar value and the associated encoding from the model property.
    scalar = valueType;
    encoding = $.modelProperty.getEncoding(props.type);
  } else {
    // If type is directly a scalar, assign it and retrieve its encoding.
    scalar = props.type;
    encoding = $.scalar.getEncoding(scalar);
  }

  const { toApplication, toTransport } = getScalarTransformer(scalar);

  // Determine the transformation based on the target context.
  // If target is "transport", apply the toTransport transformation; otherwise, use toApplication.
  return props.target === "transport"
    ? toTransport(props.itemRef, encoding)
    : toApplication(props.itemRef, encoding);
}
