import { useTSNamePolicy } from "@alloy-js/typescript";
import { ModelProperty } from "@typespec/compiler";
import { HttpOperation, HttpProperty } from "@typespec/http";

interface OperationParameters {
  positionalParameters: HttpProperty[];
  accessPaths: Map<ModelProperty, string>;
}

const OPTIONS_BAG = "options";

export function resolveHttpParameters(httpOperation: HttpOperation): OperationParameters {
  const httpProperties = httpOperation.parameters.properties;
  const namePolicy = useTSNamePolicy();

  const positionalParameters = httpProperties.filter(
    (p) => p.path.length === 1 && !p.property.optional
  );

  const positionalParamMap = new Map<string | number, HttpProperty>();
  for (const p of positionalParameters) {
    positionalParamMap.set(p.path[0], p);
  }

  const accessPaths = new Map<ModelProperty, string>();

  for (const { property, path } of httpProperties) {
    const root = path[0];
    const isTopLevel = path.length === 1;
    const isOptional = property.optional;
    const rootName = formatAccess(root);

    if (isTopLevel) {
      const access = isOptional ? `${OPTIONS_BAG}?.${rootName}` : rootName;
      accessPaths.set(property, access);
      continue;
    }

    const rootParam = positionalParamMap.get(root);
    const rootIsOptional = rootParam?.property.optional ?? false;
    const base = rootIsOptional ? `${OPTIONS_BAG}?.${rootName}` : rootName;

    const accessPath = path.slice(1).reduce((acc: string, p) => {
      if (typeof p === "number") {
        return `${acc}[${p}]`;
      }
      return `${acc}.${namePolicy.getName(p, "object-member-data")}`;
    }, base);

    accessPaths.set(property, accessPath);
  }

  return { positionalParameters, accessPaths };
}

function formatAccess(p: string | number): string {
  return typeof p === "number" ? `[${p}]` : p;
}
