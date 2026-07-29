/**
 * Generates an operationId when one is missing from the OpenAPI operation.
 * @param method The HTTP method (GET, POST, etc.)
 * @param path The path pattern from the OpenAPI spec
 * @param usedIds Set of already used operation IDs to ensure uniqueness
 * @returns A generated operationId
 */
export function generateOperationId(method: string, path: string, usedIds: Set<string>): string {
  // Remove leading slash and clean path
  const cleanPath = path
    .replace(/^\//, "")
    .replace(/\//g, "_")
    .replace(/[{}]/g, "")
    .replace(/[^a-zA-Z0-9_]/g, "_");

  // Combine method and path
  const baseId = `${method.toLowerCase()}_${cleanPath || "root"}`;

  // Remove consecutive underscores and trailing underscores
  let operationId = baseId.replace(/_+/g, "_").replace(/_$/, "");

  // Ensure uniqueness by adding suffix if needed
  let suffix = 1;
  const originalId = operationId;
  while (usedIds.has(operationId)) {
    operationId = `${originalId}_${suffix}`;
    suffix++;
  }

  usedIds.add(operationId);
  return operationId;
}
