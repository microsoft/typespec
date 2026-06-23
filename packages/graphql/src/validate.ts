import { type Namespace, navigateTypesInNamespace, type Program } from "@typespec/compiler";
import { reportDiagnostic } from "./lib.js";
import { getOperationKind } from "./lib/operation-kind.js";
import { listSchemas } from "./lib/schema.js";

export function $onValidate(program: Program) {
  const schemas = listSchemas(program);

  // Only validate if there are explicit @schema decorators
  // Tests and other usages without @schema should not trigger validation warnings
  if (schemas.length === 0) {
    return;
  }

  for (const schema of schemas) {
    validateSchema(program, schema.type);
  }
}

function validateSchema(program: Program, ns: Namespace) {
  let hasGraphQLOps = false;

  navigateTypesInNamespace(ns, {
    operation(op) {
      if (getOperationKind(program, op) !== undefined) {
        hasGraphQLOps = true;
      }
    },
  });

  if (!hasGraphQLOps) {
    reportDiagnostic(program, {
      code: "empty-schema",
      target: ns,
    });
  }
}
