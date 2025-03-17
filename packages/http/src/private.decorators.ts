import {
  DecoratorContext,
  Model,
  ModelProperty,
  Namespace,
  Program,
  Type,
  getProperty,
} from "@typespec/compiler";
import {
  HttpFileDecorator,
  HttpPartDecorator,
  HttpPartOptions,
  PlainDataDecorator,
} from "../generated-defs/TypeSpec.Http.Private.js";
import { HttpStateKeys } from "./lib.js";

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

export const $httpFile: HttpFileDecorator = (context: DecoratorContext, target: Model) => {
  context.program.stateSet(HttpStateKeys.file).add(target);
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
  readonly type: Type;
  readonly contentType: ModelProperty;
  readonly filename: ModelProperty;
  readonly contents: ModelProperty;
}

export function getHttpFileModel(program: Program, type: Type): HttpFileModel | undefined {
  if (type.kind !== "Model" || !isOrExtendsHttpFile(program, type)) {
    return undefined;
  }

  const contentType = getProperty(type, "contentType")!;
  const filename = getProperty(type, "filename")!;
  const contents = getProperty(type, "contents")!;

  return { contents, contentType, filename, type };
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
