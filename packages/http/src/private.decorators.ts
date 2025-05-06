import {
  DecoratorContext,
  DiagnosticTarget,
  IndeterminateEntity,
  Model,
  ModelProperty,
  Namespace,
  NoTarget,
  Program,
  Type,
  Value,
  getProperty,
  getTypeName,
  walkPropertiesInherited,
} from "@typespec/compiler";
import { Node, SyntaxKind, TemplateableNode } from "@typespec/compiler/ast";
import {
  HttpFileDecorator,
  HttpPartDecorator,
  HttpPartOptions,
  PlainDataDecorator,
} from "../generated-defs/TypeSpec.Http.Private.js";
import { HttpStateKeys, reportDiagnostic } from "./lib.js";
import { HttpOperationFileBody } from "./types.js";

export const $plainData: PlainDataDecorator = (context: DecoratorContext, entity: Model) => {
  const { program } = context;

  const decoratorsToRemove = ["$header", "$body", "$query", "$path", "$statusCode"];
  const [headers, bodies, queries, paths, statusCodes] = [
    program.stateMap(HttpStateKeys.header),
    program.stateSet(HttpStateKeys.body),
    program.stateMap(HttpStateKeys.query),
    program.stateMap(HttpStateKeys.path),
    program.stateMap(HttpStateKeys.statusCode),
  ];

  for (const property of entity.properties.values()) {
    // Remove the decorators so that they do not run in the future, for example,
    // if this model is later spread into another.
    property.decorators = property.decorators.filter(
      (d) => !decoratorsToRemove.includes(d.decorator.name),
    );

    // Remove the impact the decorators already had on this model.
    headers.delete(property);
    bodies.delete(property);
    queries.delete(property);
    paths.delete(property);
    statusCodes.delete(property);
  }
};

function getFileTemplateMetadata(target: Model) {
  if (target.sourceModels.length) return;

  const templateMapper = target.templateMapper;
  if (!templateMapper || !templateMapper.args) return;
  // Grab the contentType and contents arguments
  const [contentTypeArg, contentsArg] = templateMapper.args;
  if (!contentTypeArg || !contentsArg) return;
  return { contentTypeArg, contentsArg, templateMapper: target.templateMapper };
}

function getFileDiagFormatName(
  t: Type | Value | IndeterminateEntity | undefined,
): string | undefined {
  if (t?.entityKind === "Type") {
    return getTypeName(t, { printable: true });
  } else if (t?.type.kind === "String") {
    return `"${t.type.value}"`;
  }
  return;
}

export const $httpFile: HttpFileDecorator = (context: DecoratorContext, target: Model) => {
  const aliasModel = target.sourceModels.length > 0 ? target : undefined;
  const templateMetadata = getFileTemplateMetadata(target);
  const templateMapper = templateMetadata?.templateMapper as { source: { node: Node } } | undefined;

  // Validate the `ContentType` type is `TypeSpec.string`, a string literal, or a union of string literals
  const contentType = target.properties.get("contentType")!.type;

  if (
    !(
      (
        contentType.kind === "String" || // is string literal
        context.program.checker.isStdType(contentType, "string") || // is TypeSpec.string
        (contentType.kind === "Union" &&
          [...contentType.variants.values()].every((v) => v.type.kind === "String"))
      ) // is union of string literals
    )
  ) {
    const contentTypeDiagnosticTarget =
      getTemplateArgumentTarget(templateMapper?.source, "ContentType", 0) ??
      templateMetadata?.contentTypeArg;

    const contentTypeArg = templateMetadata?.contentTypeArg;

    const typeName =
      getFileDiagFormatName(contentTypeArg) ?? getFileDiagFormatName(contentType) ?? "<unknown>";

    reportDiagnostic(context.program, {
      code: "http-file-content-type-not-string",
      format: { type: typeName },
      target: contentTypeDiagnosticTarget ?? aliasModel ?? NoTarget,
    });
  }

  // Validate the `Contents` type is a scalar
  const contents = target.properties.get("contents")!.type;

  if (contents.kind !== "Scalar") {
    const contentsArg = templateMetadata?.contentsArg;
    const contentsDiagnosticTarget =
      getTemplateArgumentTarget(templateMapper?.source, "Contents", 1) ?? contentsArg;

    const typeName =
      getFileDiagFormatName(contentsArg) ?? getFileDiagFormatName(contents) ?? "<unknown>";

    reportDiagnostic(context.program, {
      code: "http-file-contents-not-scalar",
      format: { type: typeName },
      target: contentsDiagnosticTarget ?? aliasModel ?? NoTarget,
    });
  }

  context.program.stateSet(HttpStateKeys.file).add(target);

  function getTemplateArgumentTarget(
    source: { node: Node } | undefined,
    name: string,
    argumentPosition?: number,
  ): DiagnosticTarget | undefined {
    if (source?.node.kind === SyntaxKind.TypeReference) {
      const argument = source.node.arguments.find((n) => n.name?.sv === name);

      if (argument) return argument;

      const templateNode = target.templateNode as TemplateableNode | undefined;

      const position =
        templateNode?.templateParameters
          .map((n, idx) => [idx, n] as const)
          .find(([_, n]) => n.id.sv)?.[0] ?? argumentPosition;

      if (position === undefined) return undefined;

      return source.node.arguments[position];
    }

    return undefined;
  }
};

/**
 * Check if the given type is an `HttpFile`
 */
export function isHttpFile(program: Program, type: Type) {
  return program.stateSet(HttpStateKeys.file).has(type);
}

export function isOrExtendsHttpFile(program: Program, type: Type) {
  if (type.kind !== "Model") {
    return false;
  }

  let current: Model | undefined = type;

  while (current) {
    if (isHttpFile(program, current)) {
      return true;
    }

    current = current.baseModel;
  }

  return false;
}

export interface HttpFileModel {
  readonly type: Model;
  readonly contentType: ModelProperty;
  readonly filename: ModelProperty;
  readonly contents: HttpOperationFileBody["contents"];
}

export function getHttpFileModel(
  program: Program,
  type: Type,
  filter?: (property: ModelProperty) => boolean,
): HttpFileModel | undefined {
  if (type.kind !== "Model") return undefined;

  const contentType = getProperty(type, "contentType")!;
  const filename = getProperty(type, "filename")!;
  const contents = getProperty(type, "contents")! as HttpFileModel["contents"];

  // All properties are required for an `Http.File` model
  if (!contentType || !filename || !contents) {
    return undefined;
  }

  // Check that each property is sourced from an `Http.File` model
  if (
    !propertyIsFromHttpFile(program, contentType) ||
    !propertyIsFromHttpFile(program, filename) ||
    !propertyIsFromHttpFile(program, contents)
  ) {
    return undefined;
  }

  // Need to make sure that the filtered model only has the 3 `Http.File` properties
  // Filtering should have removed all metadata (besides filename)
  const effectiveProperties = new Set(walkPropertiesInherited(type));
  if (filter) {
    for (const prop of effectiveProperties) {
      if (!filter(prop)) {
        effectiveProperties.delete(prop);
      }
    }
  }

  // If there are any props beyond these 3, we know we have a body parameter
  // that transforms this into a regular model.
  if (effectiveProperties.size !== 3) {
    return undefined;
  }

  return { contents, contentType, filename, type };
}

function propertyIsFromHttpFile(program: Program, property: ModelProperty) {
  // Checks if the property's model, or any base models, are an Http.File.
  const isFile = property.model ? isOrExtendsHttpFile(program, property.model) : false;

  if (isFile) return true;

  // For spreads, the property may have a source property that links back to an Http.File model.
  if (property.sourceProperty) {
    return propertyIsFromHttpFile(program, property.sourceProperty);
  }
  return false;
}

export const $httpPart: HttpPartDecorator = (
  context: DecoratorContext,
  target: Model,
  type,
  options,
) => {
  context.program.stateMap(HttpStateKeys.httpPart).set(target, { type, options });
};

export interface HttpPart {
  readonly type: Type;
  readonly options: HttpPartOptions;
}

/** Return the http part information on a model that is an `HttpPart` */
export function getHttpPart(program: Program, target: Type): HttpPart | undefined {
  return program.stateMap(HttpStateKeys.httpPart).get(target);
}

/**
 * Specifies if inapplicable metadata should be included in the payload for
 * the given entity. This is true by default unless changed by this
 * decorator.
 *
 * @param entity Target model, namespace, or model property. If applied to a
 *               model or namespace, applies recursively to child models,
 *               namespaces, and model properties unless overridden by
 *               applying this decorator to a child.
 *
 * @param value `true` to include inapplicable metadata in payload, false to
 *               exclude it.
 *
 * @see isApplicableMetadata
 *
 * @ignore Cause issue with conflicting function of same name for now
 */
export function $includeInapplicableMetadataInPayload(
  context: DecoratorContext,
  entity: Type,
  value: boolean,
) {
  const state = context.program.stateMap(HttpStateKeys.includeInapplicableMetadataInPayload);
  state.set(entity, value);
}

/**
 * Determines if the given model property should be included in the payload if it is
 * inapplicable metadata.
 *
 * @see isApplicableMetadata
 * @see $includeInapplicableMetadataInPayload
 */
export function includeInapplicableMetadataInPayload(
  program: Program,
  property: ModelProperty,
): boolean {
  let e: ModelProperty | Namespace | Model | undefined;
  for (e = property; e; e = e.kind === "ModelProperty" ? e.model : e.namespace) {
    const value = program.stateMap(HttpStateKeys.includeInapplicableMetadataInPayload).get(e);
    if (value !== undefined) {
      return value;
    }
  }
  return true;
}
