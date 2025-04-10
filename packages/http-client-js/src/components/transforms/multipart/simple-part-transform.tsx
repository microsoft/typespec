/**
 * This file defines a React component that transforms an HTTP multipart operation part
 * using Alloy and TypeSpec libraries. It converts the part into a JSON transport format
 * by applying a JSON transformation on the body of the part. The component handles
 * naming policies and content type validations.
 */

import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
import { HttpOperationPart } from "@typespec/http";
import { reportDiagnostic } from "../../../lib.js";
import { JsonTransform } from "../json/json-transform.jsx";

/**
 * Props for the SimplePartTransform component.
 *
 * @property {HttpOperationPart} part - The HTTP operation part to be transformed.
 * @property {ay.Children} itemRef - A reference to the container or context in which the part exists.
 */
export interface SimplePartTransformProps {
  part: HttpOperationPart;
  itemRef: ay.Children;
}

/**
 * React component that transforms a simple HTTP multipart part into a JSON transport format.
 * It validates the part's content type and constructs expressions to reference the part's body,
 * potentially handling nested properties.
 *
 * @param {SimplePartTransformProps} props - The component properties.
 * @returns {JSX.Element} - A TS Object Expression containing transformed properties.
 */
export function SimplePartTransform(props: SimplePartTransformProps) {
  // Retrieve the naming policy from the TypeScript utilities, used to generate a standardized name.
  const namePolicy = ts.useTSNamePolicy();
  // Generate a JavaScript safe variable name for the part.
  const applicationName = namePolicy.getName(props.part.name!, "variable");
  // Create a value expression for the part name to be used in the generated code.
  const partName = ts.ValueExpression({ jsValue: props.part.name });
  // Determine the content type of the part's body; defaults to "application/json" if none provided.
  const partContentType = props.part.body.contentTypes[0] ?? "application/json";
  // Get a reference to the part based on the application name and the provided itemRef.
  const partRef = getPartRef(props.itemRef, applicationName);
  // Initialize body reference as the part reference (this might be updated later if nested property is specified).
  let bodyRef = ay.code`${partRef}`;

  // If a specific property is defined in the part's body, update the body reference accordingly.
  if (props.part.body.property) {
    bodyRef = ay.code`${partRef}.${props.part.body.property.name}`;
  }

  // Validate the content type: report an error for content types not starting with "application/json".
  if (!partContentType.startsWith("application/json")) {
    reportDiagnostic($.program, {
      code: "unsupported-content-type",
      target: props.part.body.type,
      message: `Unsupported content type: ${partContentType}`,
    });
  }

  // Render an object expression that includes the transformed part information.
  return (
    <ts.ObjectExpression>
      <ay.List comma line>
        <ts.ObjectProperty name="name" jsValue={partName} />
        <ts.ObjectProperty
          name="body"
          value={<JsonTransform itemRef={bodyRef} target="transport" type={props.part.body.type} />}
        />
      </ay.List>
    </ts.ObjectExpression>
  );
}

/**
 * Helper function to generate a reference for a part, combining the container reference
 * and the part name if a container exists.
 *
 * @param {ay.Children} itemRef - The container reference that may hold the part.
 * @param {string} partName - The standardized name for the part.
 * @returns {string|any} - A code expression representing the part reference.
 */
function getPartRef(itemRef: ay.Children, partName: string) {
  // If no container reference is provided, the part reference is simply its name.
  if (itemRef === null) {
    return partName;
  }

  // Otherwise, construct a reference by accessing the part property on the container.
  return ay.code`${itemRef}.${partName}`;
}
