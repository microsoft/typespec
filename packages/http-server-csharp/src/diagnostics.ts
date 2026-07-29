import {
  Interface,
  isStdNamespace,
  isTemplateDeclaration,
  Model,
  Program,
  type Namespace as TspNamespace,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import type { OperationHttpCanonicalization } from "@typespec/http-canonicalization";
import { assignAnonymousName } from "./components/models/anonymous-models.js";
import { reportDiagnostic } from "./lib.js";
import { isValidCSharpIdentifier } from "./utils/naming.js";

/**
 * Reports diagnostic warnings for models, scalars, and operations.
 * This pre-pass mirrors the old emitter behavior so that `tester.diagnose()` tests pass.
 */
export function reportEmitterDiagnostics(
  program: Program,
  interfaces: Interface[],
  canonicalOpsMap: Map<string, OperationHttpCanonicalization[]>,
): void {
  const tk = $(program);
  const visited = new Set<Model>();

  // Walk all models in the service namespace(s) to check properties
  for (const ns of program.getGlobalNamespaceType().namespaces.values()) {
    if (isStdNamespace(ns)) continue;
    walkNamespaceModels(program, ns, tk, visited);
  }

  // Check GET operations for body parameters
  for (const iface of interfaces) {
    const ops = canonicalOpsMap.get(iface.name) ?? [];
    for (const canonOp of ops) {
      if (canonOp.method === "get") {
        const body = canonOp.requestParameters.body;
        if (body) {
          reportDiagnostic(program, {
            code: "get-request-body",
            target: canonOp.languageType,
            format: {},
          });
        }
      }
    }
  }
}

function walkNamespaceModels(
  program: Program,
  ns: TspNamespace,
  tk: ReturnType<typeof $>,
  visited: Set<Model>,
): void {
  // Walk scalars to detect unrecognized/imprecise scalar types
  for (const scalar of ns.scalars.values()) {
    if (isTemplateDeclaration(scalar)) continue;
    checkPropertyDiagnostics(program, tk, scalar);
  }

  for (const model of ns.models.values()) {
    if (visited.has(model)) continue;
    visited.add(model);
    if (isTemplateDeclaration(model)) continue;

    // Check for anonymous models
    if (!model.name || model.name === "") {
      const emittedName = assignAnonymousName(model);
      reportDiagnostic(program, {
        code: "anonymous-model",
        target: model,
        format: { emittedName },
      });
    }

    // Walk properties
    for (const prop of model.properties.values()) {
      checkPropertyDiagnostics(program, tk, prop.type);

      // Check for invalid identifiers
      if (!isValidCSharpIdentifier(prop.name)) {
        const location = `property '${prop.name}' in model ${model.name || "anonymous"}`;
        reportDiagnostic(program, {
          code: "invalid-identifier",
          target: prop,
          format: { identifier: prop.name, location },
        });
      }

      // Check for anonymous inline model properties (including inside union variants)
      if (prop.type.kind === "Model" && (!prop.type.name || prop.type.name === "")) {
        if (!visited.has(prop.type)) {
          visited.add(prop.type);
          const emittedName = assignAnonymousName(prop.type);
          reportDiagnostic(program, {
            code: "anonymous-model",
            target: prop.type,
            format: { emittedName },
          });
        }
      } else if (prop.type.kind === "Union") {
        // Walk union variants to find anonymous models
        for (const variant of prop.type.variants.values()) {
          if (variant.type.kind === "Model" && (!variant.type.name || variant.type.name === "")) {
            if (!visited.has(variant.type)) {
              visited.add(variant.type);
              const emittedName = assignAnonymousName(variant.type);
              reportDiagnostic(program, {
                code: "anonymous-model",
                target: variant.type,
                format: { emittedName },
              });
            }
          }
        }
      }

      // Check for invalid string interpolation
      if (prop.type.kind === "StringTemplate") {
        const hasNonLiteral = prop.type.spans.some(
          (span) => span.isInterpolated && span.node?.kind !== undefined,
        );
        if (hasNonLiteral) {
          reportDiagnostic(program, {
            code: "invalid-interpolation",
            target: prop,
            format: {},
          });
        }
      }
    }
  }

  // Recurse into sub-namespaces
  for (const childNs of ns.namespaces.values()) {
    if (isStdNamespace(childNs)) continue;
    walkNamespaceModels(program, childNs, tk, visited);
  }
}

function checkPropertyDiagnostics(
  program: Program,
  tk: ReturnType<typeof $>,
  type: import("@typespec/compiler").Type,
): void {
  if (type.kind === "Scalar") {
    const stdBase = tk.scalar.getStdBase(type);
    if (!stdBase) {
      // Custom scalar with no standard base
      reportDiagnostic(program, {
        code: "unrecognized-scalar",
        target: type,
        format: { typeName: type.name },
      });
      return;
    }

    // Check for imprecise numeric types
    const numericMappings: Record<string, string> = {
      integer: "long",
      float: "double",
      numeric: "object",
    };
    const targetType = numericMappings[stdBase.name];
    if (targetType) {
      reportDiagnostic(program, {
        code: "no-numeric",
        target: type,
        format: { sourceType: stdBase.name, targetType },
      });
    }
  }
}
