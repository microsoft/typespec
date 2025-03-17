import { TypeSpecServiceInfo } from "../interfaces.js";
import { generateDocs } from "../utils/docs.js";
import { generateNamespaceName } from "../utils/generate-namespace-name.js";
import { toTspValues } from "../utils/tsp-values.js";

export function generateServiceInformation(serviceInfo: TypeSpecServiceInfo): string {
  const definitions: string[] = [];

  const { name, doc, ...info } = serviceInfo;

  definitions.push(`
    @service(#{
      title: "${name}"
    })
    @info(${toTspValues(info)})
    `);

  if (doc) {
    definitions.push(generateDocs(doc));
  }

  definitions.push(`namespace ${generateNamespaceName(name)};`);

  return definitions.join("\n");
}
