import { Model, ModelProperty, Operation, PagingProperty, Type, Union } from "@typespec/compiler";
import { defineKit, Typekit } from "@typespec/compiler/typekit";
import { HttpOperation } from "@typespec/http";
import { InternalClient as Client } from "../../interfaces.js";
import { getConstructors } from "../../utils/client-helpers.js";
import { clientOperationCache } from "./client.js";
import { AccessKit, getAccess, getName, NameKit } from "./utils.js";

export interface SdkOperationKit extends NameKit<Operation>, AccessKit<Operation> {
  /**
   * Get the overloads for an operation
   *
   * @param client
   * @param operation
   */
  getOverloads(client: Client, operation: Operation): Operation[];
  /**
   * Get parameters. This will take into account any parameters listed on the client
   */
  getClientSignature(client: Client, operation: Operation): ModelProperty[];

  /**
   * Get valid return types for an operation
   */
  getValidReturnType(operation: Operation): Type | undefined;

  /**
   * Get exception response type for an operation
   */
  getExceptionReturnType(operation: Operation): Type | undefined;
  /**
   * Gets the client in which the operation is defined
   * @param operation operation to find out which client it belongs to
   */
  getClient(operation: HttpOperation): Client | undefined;
  getPagingClientMetadata(operation: Operation): ClientOperationPagingMetadata | undefined;
}

interface ClientOperationPagingMetadata {
  /** Segments to indicate how to get next page link value from response. */
  nextLinkSegments?: ModelProperty[];
  /** Method used to get next page. If not defined, use the initial method. */
  nextLinkOperation?: Operation;
  /** Segments to indicate how to get parameters that are needed to be injected into next page link. */
  nextLinkReInjectedParametersSegments?: ModelProperty[][];
  /** Segments to indicate how to set continuation token for next page request. */
  continuationTokenParameterSegments?: ModelProperty[];
  /** Segments to indicate how to get continuation token value from response. */
  continuationTokenResponseSegments?: ModelProperty[];
  /** Segments to indicate how to get page items from response. */
  pageItemsSegments?: ModelProperty[];
}

interface SdkKit {
  operation: SdkOperationKit;
}

declare module "@typespec/compiler/typekit" {
  interface OperationKit extends SdkOperationKit {}
}

defineKit<SdkKit>({
  operation: {
    getClient(operation) {
      for (const [client, operations] of clientOperationCache.entries()) {
        if (operations.includes(operation)) {
          return client;
        }
      }

      return undefined;
    },
    getOverloads(client, operation) {
      if (operation.name === "constructor") {
        const constructors = getConstructors(this, client);
        if (constructors.length > 1) {
          return constructors;
        }
      }
      return [];
    },
    getAccess(operation) {
      return getAccess(operation);
    },
    getName(operation) {
      return getName(operation);
    },
    getClientSignature(client, operation) {
      // TODO: filter out client parameters
      return [...operation.parameters.properties.values()];
    },
    getValidReturnType(operation) {
      const returnType = operation.returnType;
      if (returnType === undefined) {
        return undefined;
      }
      if (this.union.is(returnType)) {
        const validTypes = [...returnType.variants.values()].filter(
          (v) => !this.type.isError(v.type),
        );
        if (validTypes.length === 0) {
          return undefined;
        }
        if (validTypes.length === 1) {
          return validTypes[0].type;
        }
        return this.union.create({ variants: validTypes });
      }
      if (!this.type.isError(returnType)) {
        return returnType;
      }
      return undefined;
    },
    getExceptionReturnType(operation) {
      const returnType = operation.returnType;
      if (returnType === undefined) {
        return undefined;
      }
      if (this.union.is(returnType)) {
        const errorTypes = [...returnType.variants.values()].filter((v) =>
          this.type.isError(v.type),
        );
        if (errorTypes.length === 0) {
          return undefined;
        }
        if (errorTypes.length === 1) {
          return errorTypes[0].type;
        }
        return this.union.create({ variants: errorTypes });
      }
      if (this.type.isError(returnType)) {
        return returnType;
      }
      return undefined;
    },
    getPagingClientMetadata(operation) {
      const returnType = operation.returnType;
      const pagingMetadata = this.operation.getPagingMetadata(operation);

      if ((returnType.kind !== "Model" && returnType.kind !== "Union") || !pagingMetadata) {
        // TODO: Add diagnostics

        return undefined;
      }

      const nextLinkSegments = getNextLinkSegments(this, operation);
      const { continuationTokenParameterSegments, continuationTokenResponseSegments } =
        getContinuationTokenSegments(this, operation) ?? {};

      const pageItemsSegments = getPropertySegmentsFromModelOrParameters(returnType, (p) => {
        return (
          this.modelProperty.getRootSourceProperty(p) ===
          this.modelProperty.getRootSourceProperty(pagingMetadata.output.pageItems.property)
        );
      });

      const x: ClientOperationPagingMetadata = {
        nextLinkSegments,
        continuationTokenParameterSegments,
        continuationTokenResponseSegments,
        pageItemsSegments,
      };

      return x;
    },
  },
});

function getContinuationTokenSegments($: Typekit, operation: Operation) {
  let continuationTokenParameterSegments: ModelProperty[] | undefined;
  let continuationTokenResponseSegments: ModelProperty[] | undefined;

  const pagingMetadata = $.operation.getPagingMetadata(operation);
  const inputContinuationToken = pagingMetadata?.input.continuationToken;
  if (inputContinuationToken) {
    continuationTokenParameterSegments = getPropertySegmentsFromModelOrParameters(
      operation.parameters,
      (p) =>
        $.modelProperty.getRootSourceProperty(p) ===
        $.modelProperty.getRootSourceProperty(inputContinuationToken.property),
    );
  }

  const outputContinuationToken = pagingMetadata?.output.continuationToken;
  const httpOperation = $.httpOperation.get(operation);
  if (outputContinuationToken) {
    if ($.modelProperty.isHttpHeader(outputContinuationToken.property)) {
      continuationTokenResponseSegments = $.httpOperation
        .flattenResponses(httpOperation)
        .map((r) => r.responseContent.headers)
        .filter((h) => h !== undefined)
        .flatMap((h) => Object.values(h))
        .filter(
          (p) =>
            $.modelProperty.getRootSourceProperty(p) ===
            $.modelProperty.getRootSourceProperty(outputContinuationToken.property),
        );
    } else {
      const returnType = operation.returnType;
      if (returnType.kind === "Model") {
        continuationTokenResponseSegments = getPropertySegmentsFromModelOrParameters(
          returnType,
          (p) =>
            $.modelProperty.getRootSourceProperty(p) ===
            $.modelProperty.getRootSourceProperty(outputContinuationToken.property),
        );
      }
    }

    return {
      continuationTokenParameterSegments,
      continuationTokenResponseSegments,
    };
  }

  return {
    continuationTokenParameterSegments,
    continuationTokenResponseSegments,
  };
}

function getNextLinkSegments($: Typekit, operation: Operation): ModelProperty[] | undefined {
  const httpOperation = $.httpOperation.get(operation);
  const pagingMetadata = $.operation.getPagingMetadata(operation)!;
  const nextLink = pagingMetadata.output.nextLink;
  if (!nextLink) {
    return undefined;
  }

  const returnType = operation.returnType as Model;

  return $.modelProperty.isHttpHeader(nextLink.property)
    ? handleHeaderNextlink($, nextLink, httpOperation)
    : handleQueryNextlink($, nextLink, returnType);
}

function handleHeaderNextlink($: Typekit, nextLink: PagingProperty, httpOperation: HttpOperation) {
  return $.httpOperation
    .flattenResponses(httpOperation)
    .map((r) => r.responseContent.headers)
    .filter((h) => h !== undefined)
    .flatMap((h) => Object.values(h))
    .filter(hasSameRootAsNextLink($, nextLink));
}

function hasSameRootAsNextLink(
  $: Typekit,
  nextLink: PagingProperty,
): (modelProperty: ModelProperty) => boolean {
  return (modelProperty) =>
    $.modelProperty.getRootSourceProperty(modelProperty) ===
    $.modelProperty.getRootSourceProperty(nextLink.property);
}

function handleQueryNextlink($: Typekit, nextLink: PagingProperty, returnType: Model) {
  return getPropertySegmentsFromModelOrParameters(returnType, hasSameRootAsNextLink($, nextLink));
}

export function getPropertySegmentsFromModelOrParameters(
  source: Model | Union | ModelProperty[],
  predicate: (property: ModelProperty) => boolean,
): ModelProperty[] | undefined {
  const queue: { model: Model; path: ModelProperty[] }[] = [];

  if (!Array.isArray(source)) {
    if (source.kind === "Union") {
      for (const variant of source.variants.values()) {
        if (variant.type.kind !== "Model") {
          continue;
        }
        const result = getPropertySegmentsFromModelOrParameters(variant.type, predicate);
        if (result) return result;
      }
      return undefined;
    }

    if (source.baseModel) {
      const baseResult = getPropertySegmentsFromModelOrParameters(source.baseModel, predicate);
      if (baseResult) return baseResult;
    }
  }

  for (const prop of Array.isArray(source) ? source : source.properties.values()) {
    if (predicate(prop)) {
      return [prop];
    }
    if (prop.type.kind === "Model") {
      queue.push({ model: prop.type, path: [prop] });
    }
  }

  while (queue.length > 0) {
    const { model, path } = queue.shift()!;
    for (const prop of model.properties.values()) {
      if (predicate(prop)) {
        return path.concat(prop);
      }
      if (prop.type.kind === "Model") {
        queue.push({ model: prop.type, path: path.concat(prop) });
      }
    }
  }

  return undefined;
}
