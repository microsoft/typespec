import {
  DecoratorContext,
  Model,
  ModelProperty,
  Program,
  Type,
  getProperty,
} from "@typespec/compiler";
import {
  HttpFileDecorator,
  HttpPartDecorator,
  HttpPartOptions,
  PlainDataDecorator,
  TypeSpecHttpPrivateDecorators,
} from "../generated-defs/TypeSpec.Http.Private.js";
import { HttpStateKeys } from "./lib.js";

/** @internal */
export const namespace = "TypeSpec.Http.Private";

const $plainData: PlainDataDecorator = (context: DecoratorContext, entity: Model) => {
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

const $httpFile: HttpFileDecorator = (context: DecoratorContext, target: Model) => {
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

const $httpPart: HttpPartDecorator = (context: DecoratorContext, target: Model, type, options) => {
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

/** @internal */
export const $decorators = {
  "TypeSpec.Http.Private": {
    httpFile: $httpFile,
    httpPart: $httpPart,
    plainData: $plainData,
  } satisfies TypeSpecHttpPrivateDecorators,
};
