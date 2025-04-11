/**
 * This file provides JSON transformation components for converting between transport and application
 * representations.
 * It supports transformations for Models, Arrays, Records, Unions, Scalar types and Model properties.
 */

import * as ay from "@alloy-js/core";
import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { ScalarDataTransform } from "../data-transform.jsx";
import {
  getJsonArrayTransformRefkey,
  JsonArrayTransform,
  JsonArrayTransformDeclaration,
} from "./json-array-transform.jsx";
import { JsonModelPropertyTransform } from "./json-model-property-transform.jsx";
import {
  getJsonModelTransformRefkey,
  JsonModelTransform,
  JsonModelTransformDeclaration,
} from "./json-model-transform.jsx";
import {
  getJsonRecordTransformRefkey,
  JsonRecordTransform,
  JsonRecordTransformDeclaration,
} from "./json-record-transform.jsx";
import {
  getJsonUnionTransformRefkey,
  JsonUnionTransform,
  JsonUnionTransformDeclaration,
} from "./union-transform.jsx";

/**
 * Props for the JsonTransform component.
 * @property itemRef - A reference to or the children representing the item to be transformed.
 * @property type - The Typespec type information to base the transformation on.
 * @property target - Determines if the target layer is 'transport' or 'application'.
 */
export interface JsonTransformProps {
  itemRef: ay.Refkey | ay.Children;
  type: Type;
  target: "transport" | "application";
}

/**
 * Returns the appropriate JSON transformation based on the provided type.
 * It first checks for a declared transform reference and if not found, it switches based on the type kind.
 *
 * @param props - The JsonTransformProps containing itemRef, type, and target.
 * @returns Either a transformation call (via ay.code template literal) or a JSX element specifically for the type.
 */
export function JsonTransform(props: JsonTransformProps) {
  // Unpack the HTTP part from the type if possible, otherwise use the provided type
  const type = $.httpPart.unpack(props.type) ?? props.type;
  // Attempt to retrieve a declared transform reference for the given type and target
  const declaredTransform = getTransformReference(type, props.target);

  if (declaredTransform) {
    // If a transform is declared, call it with the given itemRef
    return ay.code`${declaredTransform}(${props.itemRef})`;
  }

  // Determine transformation based on the kind of the type
  switch (type.kind) {
    case "Model": {
      // If the type is an array model, delegate to JsonArrayTransform
      if ($.array.is(type)) {
        return <JsonArrayTransform type={type} itemRef={props.itemRef} target={props.target} />;
      }

      // If the type is a record, delegate to JsonRecordTransform
      if ($.record.is(type)) {
        return <JsonRecordTransform type={type} itemRef={props.itemRef} target={props.target} />;
      }

      // Otherwise, use the default model transform
      return <JsonModelTransform type={type} itemRef={props.itemRef} target={props.target} />;
    }
    case "Union":
      // For union types, delegate to the JsonUnionTransform component
      return <JsonUnionTransform type={type} itemRef={props.itemRef} target={props.target} />;
    case "ModelProperty": {
      // For model properties, use a specific transform for model properties
      return (
        <JsonModelPropertyTransform type={type} itemRef={props.itemRef} target={props.target} />
      );
    }
    case "Scalar": {
      // For scalar types, use the generic scalar data transform
      return <ScalarDataTransform type={type} itemRef={props.itemRef} target={props.target} />;
    }
    default:
      // Default case: return the item reference without any transformation
      return props.itemRef;
  }
}

/**
 * Props for the JsonTransformDeclaration component.
 * @property type - The Typespec type for which a transformation declaration should be generated.
 * @property target - Determines if the target layer is 'transport' or 'application'.
 */
export interface JsonTransformDeclarationProps {
  type: Type;
  target: "transport" | "application";
}

/**
 * Provides declarations for JSON transforms for Model and Union types.
 * For non-Model or non-Union types, it renders nothing.
 *
 * @param props - The JsonTransformDeclarationProps containing type and target.
 * @returns A JSX element containing the transformation declaration or null.
 */
export function JsonTransformDeclaration(props: JsonTransformDeclarationProps) {
  // Only process Model or Union types; otherwise, render nothing.
  if (!$.model.is(props.type) && !$.union.is(props.type)) {
    return null;
  }

  // Handle Model types
  if ($.model.is(props.type)) {
    // If the type is an array model, use the array transform declaration
    if ($.array.is(props.type)) {
      return <JsonArrayTransformDeclaration target={props.target} type={props.type} />;
    }

    // If the type is a record, use the record transform declaration
    if ($.record.is(props.type)) {
      return <JsonRecordTransformDeclaration target={props.target} type={props.type} />;
    }

    // Default model transform declaration
    return <JsonModelTransformDeclaration type={props.type} target={props.target} />;
  }

  // Handle Union type declarations
  if ($.union.is(props.type)) {
    return <JsonUnionTransformDeclaration target={props.target} type={props.type} />;
  }
}

/**
 * Helper function to get a transform reference for a given type.
 * It returns a reference key if the type is a named model or union.
 *
 * @param type - The Typespec type for transformation.
 * @param target - The target layer, either 'transport' or 'application'.
 * @returns A transformation reference key or undefined if not applicable.
 */
function getTransformReference(
  type: Type,
  target: "transport" | "application",
): ay.Refkey | undefined {
  // For named models, attempt to retrieve a transform reference based on whether they are arrays or records.
  if (type.kind === "Model" && Boolean(type.name)) {
    if ($.array.is(type)) {
      return getJsonArrayTransformRefkey(type, target);
    }

    if ($.record.is(type)) {
      return getJsonRecordTransformRefkey(type, target);
    }
    // Default model transform reference key
    return getJsonModelTransformRefkey(type, target);
  }

  // For named union types, retrieve the union transform reference key.
  if (type.kind === "Union" && Boolean(type.name)) {
    return getJsonUnionTransformRefkey(type, target);
  }

  // If none of the above conditions match, no transform reference is available.
  return undefined;
}
