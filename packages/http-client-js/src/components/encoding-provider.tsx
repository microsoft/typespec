/**
 * This file defines the EncodingProvider component which wraps its children with an encoding context.
 * This context includes default values for encoding configurations such as "bytes" and "datetime".
 * The component is useful when you need consistent encoding options across different parts of the emitter
 * or when you want to override the default settings with custom values.
 */

import { Children } from "@alloy-js/core";
import { EncodingContext } from "../context/encoding/encoding-context.jsx";
import { EncodingDefaults } from "../context/encoding/types.js";

/**
 * Interface for the properties accepted by the EncodingProvider component.
 *
 * @property {EncodingDefaults} [defaults] - Optional custom default encoding values that override built-in defaults.
 * @property {Children} [children] - Nested elements/components that will have access to the encoding context.
 */
export interface EncodingProviderProps {
  defaults?: EncodingDefaults;
  children?: Children;
}

/**
 * The EncodingProvider component wraps its children with a context that supplies encoding defaults.
 * It merges user-supplied defaults with built-in default values. If no user defaults are provided, the
 * encoding context will use "none" for 'bytes' and "rfc3339" for 'datetime'.
 *
 * @param {EncodingProviderProps} props - The props for the provider, including potential default values and children.
 * @returns A JSX element that provides the encoding context to its children.
 */
export function EncodingProvider(props: EncodingProviderProps) {
  // Create a merged defaults object: built-in values are used unless overridden by props.defaults.
  const defaults: EncodingDefaults = {
    bytes: "none",
    datetime: "rfc3339",
    ...props.defaults,
  };

  // Wrap children with the EncodingContext.Provider to ensure they receive the defined defaults.
  return <EncodingContext.Provider value={defaults}>{props.children}</EncodingContext.Provider>;
}
