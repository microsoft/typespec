import { OpenAPI3Info } from "../../../../types.js";
import { TypeSpecServiceInfo } from "../interfaces.js";

export function transformServiceInfo(info: OpenAPI3Info): TypeSpecServiceInfo {
  return {
    name: info.title,
    doc: info.description,
    version: info.version,
    contact: info.contact,
    license: info.license,
    termsOfService: info.termsOfService,
    summary: info.summary,
  };
}
