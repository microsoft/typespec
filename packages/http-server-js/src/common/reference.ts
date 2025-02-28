// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import {
  DiagnosticTarget,
  IntrinsicType,
  LiteralType,
  Namespace,
  NoTarget,
  Type,
  compilerAssert,
  getEffectiveModelType,
  getFriendlyName,
  isArrayModelType,
} from "@typespec/compiler";
import { JsContext, Module, isImportableType } from "../ctx.js";
import { reportDiagnostic } from "../lib.js";
import { parseCase } from "../util/case.js";
import { asArrayType, getArrayElementName } from "../util/pluralism.js";
import { emitModelLiteral, emitWellKnownModel, isWellKnownModel } from "./model.js";
import { createOrGetModuleForNamespace } from "./namespace.js";
import { getJsScalar } from "./scalar.js";
import { emitUnionType } from "./union.js";

export type NamespacedType = Extract<Type, { namespace?: Namespace }>;

/**
 * Options for emitting a type reference.
 */
export interface EmitTypeReferenceOptions {
  /**
   * An optional alternative name to use for the type if it is not named.
   */
  altName?: string;

  /**
   * Require a declaration for types that may be represented anonymously.
   */
  requireDeclaration?: boolean;
}

/**
 * Emits a reference to a host type.
 *
 * This function will automatically ensure that the referenced type is included in the emit graph, and will import the
 * type into the current module if necessary.
 *
 * Optionally, a `preferredAlternativeName` may be supplied. This alternative name will be used if a declaration is
 * required, but the type is anonymous. The alternative name can only be set once. If two callers provide different
 * alternative names for the same anonymous type, the first one is used in all cases. If a declaration _is_ required,
 * and no alternative name is supplied (or has been supplied in a prior call to `emitTypeReference`), this function will
 * throw an error. Callers must be sure to provide an alternative name if the type _may_ have an unknown name. However,
 * callers may know that they have previously emitted a reference to the type and provided an alternative name in that
 * call, in which case the alternative name may be safely omitted.
 *
 * @param ctx - The emitter context.
 * @param type - The type to emit a reference to.
 * @param position - The syntactic position of the reference, for diagnostics.
 * @param module - The module that the reference is being emitted into.
 * @param preferredAlternativeName - An optional alternative name to use for the type if it is not named.
 * @returns a string containing a reference to the TypeScript type that represents the given TypeSpec type.
 */
export function emitTypeReference(
  ctx: JsContext,
  type: Type,
  position: DiagnosticTarget | typeof NoTarget,
  module: Module,
  options: EmitTypeReferenceOptions = {},
): string {
  switch (type.kind) {
    case "Scalar":
      // Get the scalar and return it directly, as it is a primitive.
      return getJsScalar(ctx.program, type, position);
    case "Model": {
      // First handle arrays.
      if (isArrayModelType(ctx.program, type)) {
        const argumentType = type.indexer.value;

        const argTypeReference = emitTypeReference(ctx, argumentType, position, module, {
          altName: options.altName && getArrayElementName(options.altName),
        });

        if (isImportableType(ctx, argumentType) && argumentType.namespace) {
          module.imports.push({
            binder: [argTypeReference],
            from: createOrGetModuleForNamespace(ctx, argumentType.namespace),
          });
        }

        return asArrayType(argTypeReference);
      }

      // Now other well-known models.
      if (isWellKnownModel(ctx, type)) {
        return emitWellKnownModel(ctx, type, module, options.altName);
      }

      // Try to reduce the model to an effective model if possible.
      const effectiveModel = getEffectiveModelType(ctx.program, type);

      if (effectiveModel.name === "") {
        // We might have seen the model before and synthesized a declaration for it already.
        if (ctx.syntheticNames.has(effectiveModel)) {
          const name = ctx.syntheticNames.get(effectiveModel)!;
          module.imports.push({
            binder: [name],
            from: ctx.syntheticModule,
          });
          return name;
        }

        // Require preferredAlternativeName at this point, as we have an anonymous model that we have not visited.
        if (!options.altName) {
          return emitModelLiteral(ctx, effectiveModel, module);
        }

        // Anonymous model, synthesize a new model with the preferredName
        ctx.synthetics.push({
          kind: "anonymous",
          name: options.altName,
          underlying: effectiveModel,
        });

        module.imports.push({
          binder: [options.altName],
          from: ctx.syntheticModule,
        });

        ctx.syntheticNames.set(effectiveModel, options.altName);

        return options.altName;
      } else {
        // The effective model is good for a declaration, so enqueue it.
        ctx.typeQueue.add(effectiveModel);
      }

      const friendlyName = getFriendlyName(ctx.program, effectiveModel);

      // The model may be a template instance, so we generate a name for it.
      const templatedName = parseCase(
        friendlyName
          ? friendlyName
          : effectiveModel.templateMapper
            ? effectiveModel
                .templateMapper!.args.map((a) => ("name" in a ? String(a.name) : ""))
                .join("_") + effectiveModel.name
            : effectiveModel.name,
      );

      if (!effectiveModel.namespace) {
        throw new Error("UNREACHABLE: no parent namespace of named model in emitTypeReference");
      }

      const parentModule = createOrGetModuleForNamespace(ctx, effectiveModel.namespace);

      module.imports.push({
        binder: [templatedName.pascalCase],
        from: parentModule,
      });

      return templatedName.pascalCase;
    }
    case "Union": {
      if (type.variants.size === 0) return "never";
      else if (type.variants.size === 1)
        return emitTypeReference(ctx, [...type.variants.values()][0], position, module, options);

      if (options.requireDeclaration) {
        if (type.name) {
          const nameCase = parseCase(type.name);

          ctx.typeQueue.add(type);

          module.imports.push({
            binder: [nameCase.pascalCase],
            from: createOrGetModuleForNamespace(ctx, type.namespace!),
          });

          return type.name;
        } else {
          const existingSyntheticName = ctx.syntheticNames.get(type);

          if (existingSyntheticName) {
            module.imports.push({
              binder: [existingSyntheticName],
              from: ctx.syntheticModule,
            });

            return existingSyntheticName;
          } else {
            const altName = options.altName;

            if (!altName) {
              throw new Error("UNREACHABLE: anonymous union without preferredAlternativeName");
            }

            ctx.synthetics.push({
              kind: "anonymous",
              name: altName,
              underlying: type,
            });

            module.imports.push({
              binder: [altName],
              from: ctx.syntheticModule,
            });

            ctx.syntheticNames.set(type, altName);

            return altName;
          }
        }
      } else {
        return emitUnionType(ctx, [...type.variants.values()], module);
      }
    }
    case "Enum": {
      ctx.typeQueue.add(type);

      const name = parseCase(type.name).pascalCase;

      module.imports.push({
        binder: [name],
        from: createOrGetModuleForNamespace(ctx, type.namespace!),
      });

      return name;
    }
    case "String":
      return escapeUnsafeChars(JSON.stringify(type.value));
    case "Number":
    case "Boolean":
      return String(type.value);
    case "Intrinsic":
      switch (type.name) {
        case "never":
          return "never";
        case "null":
          return "null";
        case "void":
          // It's a bit strange to have a void property, but it's possible, and TypeScript allows it. Void is simply
          // only assignable from undefined or void itself.
          return "void";
        case "ErrorType":
          compilerAssert(
            false,
            "ErrorType should not be encountered in emitTypeReference",
            position === NoTarget ? type : position,
          );
          return "unknown";
        case "unknown":
          return "unknown";
        default:
          reportDiagnostic(ctx.program, {
            code: "unrecognized-intrinsic",
            format: { intrinsic: (type satisfies never as IntrinsicType).name },
            target: position,
          });
          return "unknown";
      }
    case "Interface": {
      if (type.namespace === undefined) {
        throw new Error("UNREACHABLE: unparented interface");
      }

      const typeName = parseCase(type.name).pascalCase;

      ctx.typeQueue.add(type);

      const parentModule = createOrGetModuleForNamespace(ctx, type.namespace);

      module.imports.push({
        binder: [typeName],
        from: parentModule,
      });

      return typeName;
    }
    case "ModelProperty": {
      // Forward to underlying type.
      return emitTypeReference(ctx, type.type, position, module, options);
    }
    default:
      throw new Error(`UNREACHABLE: ${type.kind}`);
  }
}
const UNSAFE_CHAR_MAP: { [k: string]: string } = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

export function escapeUnsafeChars(s: string) {
  return s.replace(/[<>/\\\b\f\n\r\t\0\u2028\u2029]/g, (x) => UNSAFE_CHAR_MAP[x]);
}

export type JsTypeSpecLiteralType = LiteralType | (IntrinsicType & { name: "null" });

export function isValueLiteralType(t: Type): t is JsTypeSpecLiteralType {
  switch (t.kind) {
    case "String":
    case "Number":
    case "Boolean":
      return true;
    case "Intrinsic":
      return t.name === "null";
    default:
      return false;
  }
}
