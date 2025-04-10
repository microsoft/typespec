/*
 * This file contains a React component that transforms an HTTP operation multipart body
 * into an array representation of multipart parts. Each part is transformed individually
 * using the HttpPartTransform component.
 */

import * as ay from "@alloy-js/core";
import { $ } from "@typespec/compiler/experimental/typekit";
import { useTransformNamePolicy } from "@typespec/emitter-framework";
import { HttpOperationMultipartBody } from "@typespec/http";
import { reportDiagnostic } from "../../../lib.js";
import { HttpPartTransform } from "./part-transform.jsx";

// Define the shape of the props for the MultipartTransform component.
/**
 * @typedef {Object} MultipartTransformProps
 * @property {HttpOperationMultipartBody} body - The multipart HTTP body containing parts to be transformed.
 */
export interface MultipartTransformProps {
  body: HttpOperationMultipartBody;
}

// Define the MultipartTransform component that processes multipart HTTP requests.
/**
 * A component that transforms an HTTP multipart body into a JSX representation.
 * It checks for the presence of parts, applies a transformation to each part using HttpPartTransform,
 * and wraps the results in an array literal.
 *
 * @param {MultipartTransformProps} props - The properties for the component.
 * @returns {JSX.Element} The JSX element that represents the transformed multipart parts.
 */
export function MultipartTransform(props: MultipartTransformProps) {
  // Retrieve the naming policy utility for transforming property names.
  const transportNamer = useTransformNamePolicy();

  // Extract the parts from the provided HTTP multipart body.
  const httpParts = props.body.parts;

  // Handle the edge case where no parts are defined by reporting a diagnostic error.
  if (httpParts.length === 0) {
    reportDiagnostic($.program, { code: "missing-http-parts", target: props.body.property });
    // Return an empty array representation since no parts are available.
    return <>[]</>;
  }

  // Generate a reference name for the multipart item based on its property.
  const itemRef = transportNamer.getApplicationName(props.body.property);

  // Create the transformed parts by iterating over each multipart part.
  // The ay.For component is used to iterate and render each part transformation.
  const partTransform = (
    <ay.For each={httpParts} comma line>
      {(part) => <HttpPartTransform part={part} itemRef={itemRef} />}
    </ay.For>
  );

  // Wrap the list of transformed parts in array notation and return the JSX.
  return <>[{partTransform}]</>;
}
