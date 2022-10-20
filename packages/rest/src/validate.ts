import {
  getKeyName,
  getServiceNamespace,
  Model,
  navigateTypesInNamespace,
  Program,
} from "@cadl-lang/compiler";
import { getAllHttpServices } from "./http/operations.js";
import { reportDiagnostic } from "./lib.js";
import { getParentResource, getResourceTypeKey } from "./resource.js";

function checkForDuplicateResourceKeyNames(program: Program, model: Model) {
  // If the model type is defined under the service namespace, check to
  // that the parent resource type(s) don't have the same key name as the
  // current resource type.
  const keyNameSet = new Set<string>();
  let currentType: Model | undefined = model;
  while (currentType) {
    const resourceKey = getResourceTypeKey(program, currentType);
    if (resourceKey) {
      const keyName = getKeyName(program, resourceKey!.keyProperty);
      if (keyNameSet.has(keyName)) {
        reportDiagnostic(program, {
          code: "duplicate-parent-key",
          format: {
            resourceName: model.name,
            parentName: currentType.name,
            keyName,
          },
          target: resourceKey.keyProperty,
        });
        return;
      }

      keyNameSet.add(keyName);
    }

    currentType = getParentResource(program, currentType);
  }
}

export function $onValidate(program: Program) {
  // Make sure any defined resource types don't have any conflicts with parent
  // resource type key names
  navigateTypesInNamespace(getServiceNamespace(program), {
    model: (model) => checkForDuplicateResourceKeyNames(program, model),
  });

  // Pass along any diagnostics that might be returned from the HTTP library
  const [, diagnostics] = getAllHttpServices(program);
  if (diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics);
  }
}
