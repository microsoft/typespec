import { Model, ModelProperty } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/experimental/typekit";
import { HttpOperation } from "../../types.js";

export type HttpRequestParameterKind = "query" | "header" | "path" | "contentType" | "body";

interface HttpRequestKit {
    body: {
      /**
       * Checks the body is a property explicitly tagged with @body or @bodyRoot
       * @param httpOperation the http operation to check
       */
      isExplicit(httpOperation: HttpOperation): boolean;
    };
    /**
     * Gets a Model representing the body parameters of an http operation.
     * @param httpOperation the http operation to get the body parameters from
     */
    getBodyParameters(httpOperation: HttpOperation): Model | undefined;
    /**
     * Gets a Model representing the parameters of an http operation.
     * @param httpOperation The Http operation to get the parameters from.
     * @param kind A string to filters specific parameter kinds, or an array to combine multiple kinds.
     */
    getParameters(
      httpOperation: HttpOperation,
      kind: HttpRequestParameterKind[] | HttpRequestParameterKind,
    ): Model | undefined;
}

interface TypekitExtension {
  httpRequest: HttpRequestKit;
}


declare module "@typespec/compiler/experimental/typekit" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  httpRequest: {
    body: {
      isExplicit(httpOperation: HttpOperation) {
        return (
          httpOperation.parameters.properties.find(
            (p) => p.kind === "body" || p.kind === "bodyRoot",
          ) !== undefined
        );
      },
    },
    getBodyParameters(httpOperation: HttpOperation): Model | undefined {
      const body = httpOperation.parameters.body;

      if (!body) {
        return undefined;
      }

      const bodyProperty = body.property;

      if (!bodyProperty) {
        if (body.type.kind === "Model") {
          return body.type;
        }
        throw new Error("Body property not found");
      }

      const bodyPropertyName = bodyProperty.name ? bodyProperty.name : "body";

      return this.model.create({
        properties: { [bodyPropertyName]: bodyProperty },
      });
    },
    getParameters(
      httpOperation: HttpOperation,
      kind: HttpRequestParameterKind | HttpRequestParameterKind[],
    ): Model | undefined {
      const kinds = new Set(Array.isArray(kind) ? kind : [kind]);
      const parameterProperties: ModelProperty[] = [];

      for (const kind of kinds) {
        if (kind === "body") {
          const bodyParams = Array.from(
            this.httpRequest.getBodyParameters(httpOperation)?.properties.values() ?? [],
          );
          if (bodyParams) {
            parameterProperties.push(...bodyParams);
          }
        } else {
          const params = httpOperation.parameters.properties
            .filter((p) => p.kind === kind)
            .map((p) => p.property);
          parameterProperties.push(...params);
        }
      }

      if (parameterProperties.length === 0) {
        return undefined;
      }

      const properties = parameterProperties.reduce(
        (acc, prop) => {
          acc[prop.name] = prop;
          return acc;
        },
        {} as Record<string, ModelProperty>,
      );

      return this.model.create({ properties });
    },
  },
});
