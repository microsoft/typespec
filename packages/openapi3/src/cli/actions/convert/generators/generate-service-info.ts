import { TypeSpecServiceInfo } from "../interfaces.js";
import { generateDocs } from "../utils/docs.js";
import { generateNamespaceName } from "../utils/generate-namespace-name.js";

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

function toTspValues(item: unknown): string {
  if (typeof item === "object") {
    if (Array.isArray(item)) {
      return `#[${item.map(toTspValues).join(", ")}]`;
    } else {
      const content = Object.entries(item!)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => {
          if (typeof value === "string") {
            return `${key}: "${value}"`;
          }

          return `${key}: ${toTspValues(value)}`;
        })
        .join(", ");

      return `#{${content}}`;
    }
  } else {
    return JSON.stringify(item);
  }
}
