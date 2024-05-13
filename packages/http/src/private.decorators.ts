import { DecoratorContext, Model, Program, Type } from "@typespec/compiler";
import {
  HttpFileDecorator,
  HttpPartDecorator,
  PlainDataDecorator,
} from "../generated-defs/TypeSpec.Http.Private.js";
import { HttpStateKeys } from "./lib.js";

export const namespace = "TypeSpec.Http.Private";

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
      (d) => !decoratorsToRemove.includes(d.decorator.name)
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
export function isHttpFile(program: Program, target: Type) {
  return program.stateSet(HttpStateKeys.file).has(target);
}

export interface HttpPartOptions {
  readonly name?: string;
}

export const $httpPart: HttpPartDecorator = (
  context: DecoratorContext,
  target: Model,
  type,
  options
) => {
  context.program.stateMap(HttpStateKeys.file).set(target, { type, options });
};

export interface HttpPart {
  readonly type: Type;
  readonly options: HttpPartOptions;
}

/** Return the http part information on a model that is an `HttpPart` */
export function getHttpPart(program: Program, target: Type): HttpPart | undefined {
  return program.stateMap(HttpStateKeys.file).get(target);
}
