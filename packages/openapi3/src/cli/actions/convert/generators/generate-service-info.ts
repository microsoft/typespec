import { TypeSpecServiceInfo } from "../interfaces.js";
import { generateDocs } from "../utils/docs.js";

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

function generateNamespaceName(name: string): string {
  return name.replaceAll(/[^\w^\d_]+/g, "");
}
