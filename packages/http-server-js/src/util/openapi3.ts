import { Program, Service } from "@typespec/compiler";
import type { OpenAPI3ServiceRecord, SupportedOpenAPIDocuments } from "@typespec/openapi3";

/**
 * Attempts to import the OpenAPI 3 emitter if it is installed.
 *
 * @returns the OpenAPI 3 emitter module or undefined
 */
export function getOpenApi3Emitter(): Promise<typeof import("@typespec/openapi3") | undefined> {
  return import("@typespec/openapi3").catch(() => undefined);
}

/**
 * Gets the OpenAPI 3 service record for a given service.
 *
 * @param program - the program in which the service occurs
 * @param service - the service to check
 */
export async function getOpenApi3ServiceRecord(
  program: Program,
  service: Service,
): Promise<OpenAPI3ServiceRecord | undefined> {
  const openapi3 = await getOpenApi3Emitter();

  if (!openapi3) return undefined;

  const serviceRecords = await openapi3.getOpenAPI3(program, {
    "include-x-typespec-name": "never",
    "omit-unreachable-types": true,
    "safeint-strategy": "int64",
  });

  return serviceRecords.find((r) => r.service === service);
}

/**
 * Determines if an OpenAPI3 document can be generated for the given service.
 *
 * @param program - the program in which the service occurs
 * @param service - the service to check
 */
export async function tryGetOpenApi3(
  program: Program,
  service: Service,
): Promise<SupportedOpenAPIDocuments | undefined> {
  const serviceRecord = await getOpenApi3ServiceRecord(program, service);

  if (!serviceRecord) return undefined;

  if (serviceRecord.versioned) return undefined;

  return serviceRecord.document;
}
