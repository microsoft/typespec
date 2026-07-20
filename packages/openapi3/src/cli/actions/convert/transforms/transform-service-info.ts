import { License } from "@typespec/openapi";
import { OpenAPI3Info } from "../../../../types.js";
import { TypeSpecServiceInfo } from "../interfaces.js";

export function transformServiceInfo(info: OpenAPI3Info): TypeSpecServiceInfo {
  let license = info.license;
  if (license) {
    // Handle x-oai-license-identifier extension from OpenAPI 3.0
    const licenseRecord = license as unknown as Record<string, unknown>;
    const xOaiIdentifier = licenseRecord["x-oai-license-identifier"] as string | undefined;
    if (xOaiIdentifier !== undefined) {
      const { "x-oai-license-identifier": _, ...rest } = licenseRecord;
      license = { ...(rest as unknown as License), identifier: xOaiIdentifier };
    }
  }

  return {
    name: info.title,
    doc: info.description,
    version: info.version,
    contact: info.contact,
    license,
    termsOfService: info.termsOfService,
    summary: info.summary,
  };
}
