import { FullOpenAPI3Info, TypeSpecServiceInfo } from "../interfaces.js";

export function transformServiceInfo(info: FullOpenAPI3Info): TypeSpecServiceInfo {
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
