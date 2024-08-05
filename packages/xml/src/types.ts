import type { EncodeData, Scalar } from "@typespec/compiler";

export interface XmlNamespace {
  readonly namespace: string;
  readonly prefix: string;
}

/**
 * Known Xml encodings
 */
export type XmlEncoding =
  /** Corespond to a field of schema 	xs:dateTime */
  | "TypeSpec.Xml.Encoding.xmlDateTime"
  /** Corespond to a field of schema 	xs:date */
  | "TypeSpec.Xml.Encoding.xmlDate"
  /** Corespond to a field of schema 	xs:time */
  | "TypeSpec.Xml.Encoding.xmlTime"
  /** Corespond to a field of schema 	xs:duration */
  | "TypeSpec.Xml.Encoding.xmlDuration"
  /** Corespond to a field of schema 	xs:base64Binary */
  | "TypeSpec.Xml.Encoding.xmlBase64Binary";

export interface XmlEncodeData extends EncodeData {
  encoding?: XmlEncoding | EncodeData["encoding"];
  type: Scalar;
}
