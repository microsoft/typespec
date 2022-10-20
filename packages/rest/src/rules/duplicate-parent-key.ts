import { getKeyName, getServiceNamespace, isDeclaredInNamespace, Model } from "@cadl-lang/compiler";
import { createRule } from "@cadl-lang/lint";
import { reportDiagnostic } from "../lib.js";
import { getParentResource, getResourceTypeKey } from "../resource.js";

export const duplicateParentKey = createRule({
  name: "duplicate-parent-key",
  create({ program }) {
    return {
      model: (context: Model) => {
        // If the model type is defined under the service namespace, check to
        // that the parent resource type(s) don't have the same key name as the
        // current resource type.
        if (isDeclaredInNamespace(context, getServiceNamespace(program))) {
          const keyNameSet = new Set<string>();
          let currentType: Model | undefined = context;
          while (currentType) {
            const resourceKey = getResourceTypeKey(program, currentType);
            if (resourceKey) {
              const keyName = getKeyName(program, resourceKey!.keyProperty);
              if (keyNameSet.has(keyName)) {
                reportDiagnostic(program, {
                  code: "duplicate-parent-key",
                  format: {
                    resourceName: context.name,
                    parentName: currentType.name,
                    keyName,
                  },
                  target: resourceKey!.keyProperty,
                });
                return;
              }

              keyNameSet.add(keyName);
            }

            currentType = getParentResource(program, currentType);
          }
        }
      },
    };
  },
});
