import {
  DuplicateTracker,
  getKeyName,
  getTypeName,
  listServices,
  Model,
  navigateTypesInNamespace,
  Program,
} from "@typespec/compiler";
import { reportDiagnostic } from "./lib.js";
import { getParentResource, getResourceTypeKey, ResourceKey } from "./resource.js";

function checkForDuplicateResourceKeyNames(program: Program) {
  const seenTypes = new Set<string>();

  function checkResourceModelKeys(model: Model) {
    if (model.name === "") {
      return;
    }
    let currentType: Model | undefined = model;
    const keyProperties = new DuplicateTracker<string, ResourceKey>();
    while (currentType) {
      const resourceKey = getResourceTypeKey(program, currentType);
      if (resourceKey) {
        const keyName = getKeyName(program, resourceKey.keyProperty);
        keyProperties.track(keyName, resourceKey);
      }

      currentType = getParentResource(program, currentType);
    }

    // Report a diagnostic for each duplicate key
    for (const [keyName, dupes] of keyProperties.entries()) {
      for (const key of dupes) {
        // Make sure we don't report a duplicate for a particular
        // resource type and key name more than once
        const fullName = `${getTypeName(key.resourceType)}.${keyName}`;
        if (!seenTypes.has(fullName)) {
          seenTypes.add(fullName);
          reportDiagnostic(program, {
            code: "duplicate-parent-key",
            format: {
              resourceName: key.resourceType.name,
              keyName,
            },
            target: key.keyProperty,
          });
        }
      }
    }
  }

  for (const service of listServices(program)) {
    // If the model type is defined under the service namespace, check that the
    // parent resource type(s) don't have the same key name as the
    // current resource type.
    navigateTypesInNamespace(service.type, {
      model: (model) => checkResourceModelKeys(model),
    });
  }
}

export function $onValidate(program: Program) {
  // Make sure any defined resource types don't have any conflicts with parent
  // resource type key names
  checkForDuplicateResourceKeyNames(program);
}
