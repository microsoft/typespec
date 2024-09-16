// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import {
  Model,
  getFriendlyName,
  isTemplateDeclaration,
  isTemplateInstance,
} from "@typespec/compiler";
import { JsContext, Module } from "../ctx.js";
import { parseCase } from "../util/case.js";
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
  const properties = [...model.properties.values()].map((prop) => {
    const nameCase = parseCase(prop.name);
    const questionMark = prop.optional ? "?" : "";

    const name = KEYWORDS.has(nameCase.camelCase) ? `_${nameCase.camelCase}` : nameCase.camelCase;

    return `${name}${questionMark}: ${emitTypeReference(ctx, prop.type, prop, module)}`;
  });

  return `{ ${properties.join("; ")} }`;
}

/**
 * Determines whether a model is an instance of a well-known model, such as TypeSpec.Record or TypeSpec.Array.
 */
export function isWellKnownModel(ctx: JsContext, type: Model): boolean {
  const fullName = getFullyQualifiedTypeName(type);
  return fullName === "TypeSpec.Record" || fullName === "TypeSpec.Array";
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
  const arg = type.indexer!.value;
  switch (type.name) {
    case "Record": {
      return `{ [k: string]: ${emitTypeReference(ctx, arg, type, module, {
        altName: preferredAlternativeName && getRecordValueName(preferredAlternativeName),
      })} }`;
    }
    case "Array": {
      return asArrayType(
        emitTypeReference(ctx, arg, type, module, {
          altName: preferredAlternativeName && getArrayElementName(preferredAlternativeName),
        }),
      );
    }
    default:
      throw new Error(`UNREACHABLE: ${type.name}`);
  }
}
