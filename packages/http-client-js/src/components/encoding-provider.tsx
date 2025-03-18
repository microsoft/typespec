import { Children } from "@alloy-js/core";
import { EncodingContext } from "../context/encoding/encoding-context.jsx";
import { EncodingDefaults } from "../context/encoding/types.js";
export interface EncodingProviderProps {
  defaults?: EncodingDefaults;
  children?: Children;
}

export function EncodingProvider(props: EncodingProviderProps) {
  const defaults: EncodingDefaults = {
    bytes: "none",
    datetime: "rfc3339",
    ...props.defaults,
  };

  return <EncodingContext.Provider value={defaults}>{props.children}</EncodingContext.Provider>;
}
