// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import {
  Model,
  getFriendlyName,
  isTemplateDeclaration,
  isTemplateInstance,
} from "@typespec/compiler";
import { JsContext, Module } from "../ctx.js";
import { isUnspeakable, parseCase } from "../util/case.js";
import { indent } from "../util/iter.js";
import { KEYWORDS } from "../util/keywords.js";
import { getFullyQualifiedTypeName } from "../util/name.js";
import { asArrayType, getArrayElementName, getRecordValueName } from "../util/pluralism.js";
import { emitDocumentation } from "./documentation.js";
import { emitTypeReference } from "./reference.js";

/**
 * Emit a model declaration.
 *
 * @param ctx - The emitter context.
 * @param model - The model to emit.
 * @param module - The module that this model is written into.
 * @param altName - An alternative name to use for the model if it is not named.
 */
export function* emitModel(
  ctx: JsContext,
  model: Model,
  module: Module,
  altName?: string,
): Iterable<string> {
  const isTemplate = isTemplateInstance(model);
  const friendlyName = getFriendlyName(ctx.program, model);

  if (isTemplateDeclaration(model)) {
    return;
  }

  const modelNameCase = parseCase(
    friendlyName
      ? friendlyName
      : isTemplate
        ? model.templateMapper!.args.map((a) => ("name" in a ? String(a.name) : "")).join("_") +
          model.name
        : model.name,
  );

  if (model.name === "" && !altName) {
    throw new Error("UNREACHABLE: Anonymous model with no altName");
  }

  yield* emitDocumentation(ctx, model);

  const ifaceName = model.name === "" ? altName! : modelNameCase.pascalCase;

  const extendsClause = model.baseModel
    ? `extends ${emitTypeReference(ctx, model.baseModel, model, module)} `
    : "";

  yield `export interface ${ifaceName} ${extendsClause}{`;

  for (const field of model.properties.values()) {
    // Skip properties with unspeakable names.
    if (isUnspeakable(field.name)) {
      continue;
    }

    const nameCase = parseCase(field.name);
    const basicName = nameCase.camelCase;

    const typeReference = emitTypeReference(ctx, field.type, field, module, {
      altName: modelNameCase.pascalCase + nameCase.pascalCase,
    });

    const name = KEYWORDS.has(basicName) ? `_${basicName}` : basicName;

    yield* indent(emitDocumentation(ctx, field));

    const questionMark = field.optional ? "?" : "";

    yield `  ${name}${questionMark}: ${typeReference};`;
    yield "";
  }

  yield "}";
  yield "";
}

export function emitModelLiteral(ctx: JsContext, model: Model, module: Module): string {
  const properties = [...model.properties.values()]
    .map((prop) => {
      if (isUnspeakable(prop.name)) {
        return undefined;
      }

      const nameCase = parseCase(prop.name);
      const questionMark = prop.optional ? "?" : "";

      const name = KEYWORDS.has(nameCase.camelCase) ? `_${nameCase.camelCase}` : nameCase.camelCase;

      return `${name}${questionMark}: ${emitTypeReference(ctx, prop.type, prop, module)}`;
    })
    .filter((p) => !!p);

  return `{ ${properties.join("; ")} }`;
}

/**
 * Determines whether a model is an instance of a well-known model, such as TypeSpec.Record or TypeSpec.Array.
 */
export function isWellKnownModel(ctx: JsContext, type: Model): boolean {
  const fullName = getFullyQualifiedTypeName(type);
  return ["TypeSpec.Record", "TypeSpec.Array", "TypeSpec.Http.HttpPart"].includes(fullName);
}

/**
 * Emits a well-known model, such as TypeSpec.Record or TypeSpec.Array.
 *
 * @param ctx - The emitter context.
 * @param type - The model to emit.
 * @param module - The module that this model is written into.
 * @param preferredAlternativeName - An alternative name to use for the model if it is not named.
 */
export function emitWellKnownModel(
  ctx: JsContext,
  type: Model,
  module: Module,
  preferredAlternativeName?: string,
): string {
  switch (type.name) {
    case "Record": {
      const arg = type.indexer!.value;
      return `Record<string, ${emitTypeReference(ctx, arg, type, module, {
        altName: preferredAlternativeName && getRecordValueName(preferredAlternativeName),
      })}>`;
    }
    case "Array": {
      const arg = type.indexer!.value;
      return asArrayType(
        emitTypeReference(ctx, arg, type, module, {
          altName: preferredAlternativeName && getArrayElementName(preferredAlternativeName),
        }),
      );
    }
    case "HttpPart": {
      const argument = type.templateMapper!.args[0];

      if (!(argument.entityKind === "Type" && argument.kind === "Model")) {
        throw new Error("UNREACHABLE: HttpPart must have a Model argument");
      }

      return emitTypeReference(ctx, argument, type, module, {
        altName: preferredAlternativeName && `${preferredAlternativeName}HttpPart`,
      });
    }
    default:
      throw new Error(`UNREACHABLE: ${type.name}`);
  }
}
