import { SerializationFormat } from "@autorest/codemodel";

export interface XmlSerializationFormat extends SerializationFormat {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute: boolean;
  wrapped: boolean;
  text: boolean;
  // name/namespace/prefix on items, when wrapped=true (this type is an array)
  itemsName?: string;
  itemsNamespace?: string;
  itemsPrefix?: string;
}
