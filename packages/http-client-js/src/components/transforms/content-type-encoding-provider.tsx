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
  if (isJsonMediaType(contentType)) {
    defaults = {
      bytes: "base64",
      datetime: "rfc3339",
    };
  }

  return <EncodingProvider defaults={defaults}>{props.children}</EncodingProvider>;
}

export function isJsonMediaType(mediaType: string) {
  if (mediaType) {
    const parsed =
      /(application|audio|font|example|image|message|model|multipart|text|video|x-(?:[0-9A-Za-z!#$%&'*+.^_`|~-]+))\/([0-9A-Za-z!#$%&'*.^_`|~-]+)\s*(?:\+([0-9A-Za-z!#$%&'*.^_`|~-]+))?\s*(?:;.\s*(\S*))?/g.exec(
        mediaType,
      );
    if (parsed) {
      const mediaType = {
        type: parsed[1],
        subtype: parsed[2],
        suffix: parsed[3],
        parameter: parsed[4],
      };
      if (
        (mediaType.subtype === "json" || mediaType.suffix === "json") &&
        (mediaType.type === "application" || mediaType.type === "text")
      ) {
        return true;
      }
    }
  }
  return false;
}
