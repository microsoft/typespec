import * as ay from "@alloy-js/core";
import { Model } from "@typespec/compiler";
import { JsonTransform } from "./json-transform.jsx";

export interface JsonModelBaseTransformProps {
  /**
   * A reference to child components.
   */
  itemRef: ay.Children;
  /**
   * The TypeSpec model to be transformed, which may include a base model.
   */
  type: Model;
  /**
   * Specifies the transformation target, either for transport or application level.
   */
  target: "transport" | "application";
}

/**
 * Component that generates code that transforms a JSON model based on its base model.
 *
 * This component checks if the provided model (props.type) has a base model defined.
 * If a base model exists, it leverages the JsonTransform component to apply the transformation
 * on the base model. If no base model is found, it returns null (rendering nothing).
 *
 * @param {JsonModelBaseTransformProps} props - The properties to control how the model is transformed.
 * @returns a component containing the transformed JSON model content, or null if no base model exists.
 */
export function JsonModelBaseTransform(props: JsonModelBaseTransformProps) {
  // Extract the base model from the provided model property.
  const baseModel = props.type.baseModel;

  // If there is no base model, return null to render nothing.
  if (!baseModel) {
    return null;
  }

  return (
    <>
      ...
      <JsonTransform {...props} type={baseModel} />,
    </>
  );
}
