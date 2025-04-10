// This file defines a component that transforms an HTTP operation part into its corresponding JSX component.
// Depending on properties of the HTTP operation part, the component delegates rendering to one of three sub-components:
// - ArrayPartTransform: used for parts that represent multiple values (multi-part).
// - FilePartTransform: used for parts with an associated filename (file upload).
// - SimplePartTransform: used for all other simple parts.

import * as ay from "@alloy-js/core";
import { HttpOperationPart } from "@typespec/http";
import { ArrayPartTransform } from "./array-part-transform.jsx";
import { FilePartTransform } from "./file-part-transform.jsx";
import { SimplePartTransform } from "./simple-part-transform.jsx";

/**
 * Props for the HttpPartTransform component.
 *
 * @property part - An HTTP operation part object that contains information on how to transform the part.
 * @property itemRef - A reference to the rendered child element (from alloy-js) that will be updated.
 */
export interface HttpPartTransformProps {
  part: HttpOperationPart;
  itemRef: ay.Children;
}

/**
 * Transforms an HTTP operation part into a JSX element based on its properties.
 *
 * This component checks the `multi` and `filename` properties of the part to decide:
 * 1. If `multi` is true, it renders the ArrayPartTransform to handle multiple values.
 * 2. If `filename` is defined (indicating a file), it renders the FilePartTransform.
 * 3. Otherwise, it renders the SimplePartTransform for standard parts.
 *
 * @param props - The props for the transformation, including the part and a reference to the item.
 * @returns JSX element for the transformed HTTP operation part.
 */
export function HttpPartTransform(props: HttpPartTransformProps) {
  // Check if the part represents a collection of values
  if (props.part.multi) {
    return <ArrayPartTransform part={props.part} itemRef={props.itemRef} />;
  }

  // Check if the part represents a file (has an associated filename)
  if (props.part.filename) {
    return <FilePartTransform part={props.part} itemRef={props.itemRef} />;
  }

  // Default to a simple part transformation for parts without special properties
  return <SimplePartTransform part={props.part} itemRef={props.itemRef} />;
}
