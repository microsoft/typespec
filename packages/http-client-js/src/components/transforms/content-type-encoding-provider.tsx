import { Children } from "@alloy-js/core";
import { EncodingDefaults } from "../../context/encoding/types.js";
import { EncodingProvider } from "../encoding-provider.jsx";

export interface ContentTypeEncodingProviderProps {
  contentType?: string;
  children?: Children;
}

export function ContentTypeEncodingProvider(props: ContentTypeEncodingProviderProps) {
  const contentType = props.contentType ?? "application/json";
  let defaults: EncodingDefaults = {
    bytes: "none",
    datetime: "rfc3339",
  };

  // Follows the media type conventions from RFC 6838 section 4.2.8, which standardizes the +json suffix for JSON-structured syntaxes.
  if (contentType?.includes("application/json") || contentType.trim()?.endsWith("+json")) {
    defaults = {
      bytes: "base64",
      datetime: "rfc3339",
    };
  }

  return <EncodingProvider defaults={defaults}>{props.children}</EncodingProvider>;
}
