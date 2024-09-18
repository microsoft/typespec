import { TypeSpecNamespace } from "../interfaces.js";
import { Context } from "../utils/context.js";
import { generateDataType } from "./generate-model.js";
import { generateOperation } from "./generate-operation.js";

export function generateNamespace(
  name: string,
  namespace: TypeSpecNamespace,
  context: Context,
): string {
  const definitions: string[] = [];
  definitions.push(`namespace ${name} {`);

  definitions.push(...namespace.types.map((t) => generateDataType(t, context)));
  definitions.push(...namespace.operations.map((o) => generateOperation(o, context)));

  for (const [namespaceName, nestedNamespace] of Object.entries(namespace.namespaces)) {
    definitions.push(generateNamespace(namespaceName, nestedNamespace, context));
  }

  definitions.push("}");
  return definitions.join("\n");
}
