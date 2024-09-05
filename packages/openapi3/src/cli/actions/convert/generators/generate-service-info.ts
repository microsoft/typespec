import { TypeSpecServiceInfo } from "../interfaces.js";
import { generateDocs } from "../utils/docs.js";
import { generateNamespaceName } from "../utils/generate-namespace-name.js";

export function generateServiceInformation(serviceInfo: TypeSpecServiceInfo): string {
  const definitions: string[] = [];

  const { name, doc, ...info } = serviceInfo;

  definitions.push(`
    @service({
      title: "${name}"
    })
    @info(${JSON.stringify(info)})
    `);

  if (doc) {
    definitions.push(generateDocs(doc));
  }

  definitions.push(`namespace ${generateNamespaceName(name)};`);

  return definitions.join("\n");
}
