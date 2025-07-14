import { SerializationFormat } from "@autorest/codemodel";

export interface XmlSerializationFormat extends SerializationFormat {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute: boolean;
  wrapped: boolean;
  text: boolean;
}
