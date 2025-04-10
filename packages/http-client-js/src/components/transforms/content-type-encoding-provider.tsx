/**
 * This file defines a component that provides encoding defaults based on the MIME content type.
 * It determines the default encoding settings (such as "base64" for bytes when using JSON) and passes them to an EncodingProvider component.
 */
import { Children } from "@alloy-js/core";
import { EncodingDefaults } from "../../context/encoding/types.js";
import { EncodingProvider } from "../encoding-provider.jsx";

/**
 * Interface for the props accepted by the ContentTypeEncodingProvider component.
 *
 * @property {string} [contentType] - Optional MIME type string to determine encoding configurations.
 * @property {Children} [children] - Child elements/components to be rendered within the provider.
 */
export interface ContentTypeEncodingProviderProps {
  contentType?: string;
  children?: Children;
}

/**
 * A component that selects encoding defaults based on the provided content type.
 * If the content type indicates a JSON-structured syntax, it assigns specialized encoding rules.
 *
 * @param {ContentTypeEncodingProviderProps} props - Properties for content type and child components.
 * @returns An EncodingProvider wrapper with the determined encoding defaults.
 */
export function ContentTypeEncodingProvider(props: ContentTypeEncodingProviderProps) {
  // Use the provided contentType or default to "application/json" if undefined
  const contentType = props.contentType ?? "application/json";

  // Set initial default encoding values:
  // - bytes: "none" (no encoding applied)
  // - datetime: "rfc3339" for standardized datetime format
  let defaults: EncodingDefaults = {
    bytes: "none",
    datetime: "rfc3339",
  };

  // Check if the contentType represents a JSON structured syntax.
  // This follows the media type convention from RFC 6838 section 4.2.8 for the "+json" suffix.
  // The condition checks whether the contentType contains "application/json" or ends with "+json".
  if (contentType?.includes("application/json") || contentType.trim()?.endsWith("+json")) {
    // For JSON content types, adjust encoding:
    // Set bytes encoding to "base64" to properly handle binary data embedded in JSON.
    defaults = {
      bytes: "base64",
      datetime: "rfc3339",
    };
  }

  // Wrap child components within the EncodingProvider, applying the determined encoding defaults.
  return <EncodingProvider defaults={defaults}>{props.children}</EncodingProvider>;
}
