import { TypeSpecNamespace } from "../interfaces.js";
import { generateModel } from "./generate-model.js";
import { generateOperation } from "./generate-operation.js";

export function generateNamespace(name: string, namespace: TypeSpecNamespace): string {
  const definitions: string[] = [];
  definitions.push(`namespace ${name} {`);

  definitions.push(...namespace.models.map(generateModel));
  definitions.push(...namespace.operations.map(generateOperation));

  for (const [namespaceName, nestedNamespace] of Object.entries(namespace.namespaces)) {
    definitions.push(generateNamespace(namespaceName, nestedNamespace));
  }

  definitions.push("}");
  return definitions.join("\n");
}
