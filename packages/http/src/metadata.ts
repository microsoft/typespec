import {
  compilerAssert,
  EnumMember,
  getEffectiveModelType,
  getLifecycleVisibilityEnum,
  getParameterVisibilityFilter,
  isVisible as isVisibleCore,
  Model,
  ModelProperty,
  Operation,
  Program,
  Type,
  Union,
  type VisibilityFilter,
  VisibilityProvider,
} from "@typespec/compiler";
import { TwoLevelMap } from "@typespec/compiler/utils";
import {
  getOperationVerb,
  getPatchOptions,
  isBody,
  isBodyIgnore,
  isBodyRoot,
  isCookieParam,
  isHeader,
  isMultipartBodyProperty,
  isPathParam,
  isQueryParam,
  isStatusCode,
} from "./decorators.js";
import { getHttpOperation } from "./operations.js";
import { HttpVerb, OperationParameterOptions } from "./types.js";

// Used in @link JsDoc tag.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { PatchOptions } from "../generated-defs/TypeSpec.Http.js";
import { includeInapplicableMetadataInPayload } from "./private.decorators.js";

/**
 * Flags enum representation of well-known visibilities that are used in
 * REST API.
 */
export enum Visibility {
  Read = 1 << 0,
  Create = 1 << 1,
  Update = 1 << 2,
  Delete = 1 << 3,
  Query = 1 << 4,

  None = 0,
  All = Read | Create | Update | Delete | Query,

  /**
   * Additional flag to indicate when something is nested in a collection
   * and therefore no metadata is applicable.
   */
  Item = 1 << 20,

  /**
   * Additional flag to indicate when the verb is PATCH and will have fields made
   * optional if the request visibility includes update.
   *
   * Whether or not this flag is set automatically is determined by the options
   * passed to the `@patch` decorator. By default, it is set in requests for any
   * operation that uses the PATCH verb.
   *
   * @see {@link PatchOptions}
   */
  Patch = 1 << 21,

  /**
   * Additional flags to indicate the treatment of properties in specific contexts.
   *
   * Never use these flags. They are used internally by the HTTP core.
   *
   * @internal
   */
  Synthetic = Visibility.Item | Visibility.Patch,
}

const visibilityToArrayMap: Map<Visibility, string[]> = new Map();
function visibilityToArray(visibility: Visibility): readonly string[] {
  // Synthetic flags are not real visibilities.
  visibility &= ~Visibility.Synthetic;
  let result = visibilityToArrayMap.get(visibility);
  if (!result) {
    result = [];

    if (visibility & Visibility.Read) {
      result.push("read");
    }
    if (visibility & Visibility.Create) {
      result.push("create");
    }
    if (visibility & Visibility.Update) {
      result.push("update");
    }
    if (visibility & Visibility.Delete) {
      result.push("delete");
    }
    if (visibility & Visibility.Query) {
      result.push("query");
    }

    compilerAssert(result.length > 0 || visibility === Visibility.None, "invalid visibility");
    visibilityToArrayMap.set(visibility, result);
  }

  return result;
}

function filterToVisibility(program: Program, filter: VisibilityFilter): Visibility {
  const Lifecycle = getLifecycleVisibilityEnum(program);

  compilerAssert(
    !filter.all,
    "Unexpected: `all` constraint in visibility filter passed to filterToVisibility",
  );
  compilerAssert(
    !filter.none,
    "Unexpected: `none` constraint in visibility filter passed to filterToVisibility",
  );

  if (!filter.any) {
    return Visibility.All;
  } else {
    let visibility = Visibility.None;

    for (const modifierConstraint of filter.any ?? []) {
      if (modifierConstraint.enum !== Lifecycle) continue;
      switch (modifierConstraint.name) {
        case "Read":
          visibility |= Visibility.Read;
          break;
        case "Create":
          visibility |= Visibility.Create;
          break;
        case "Update":
          visibility |= Visibility.Update;
          break;
        case "Delete":
          visibility |= Visibility.Delete;
          break;
        case "Query":
          visibility |= Visibility.Query;
          break;
        default:
          compilerAssert(
            false,
            `Unreachable: unrecognized Lifecycle visibility member: '${modifierConstraint.name}'`,
          );
      }
    }

    return visibility;
  }
}

const VISIBILITY_FILTER_CACHE_MAP = new WeakMap<Program, Map<Visibility, VisibilityFilter>>();

function getVisibilityFilterCache(program: Program): Map<Visibility, VisibilityFilter> {
  let cache = VISIBILITY_FILTER_CACHE_MAP.get(program);
  if (!cache) {
    cache = new Map();
    VISIBILITY_FILTER_CACHE_MAP.set(program, cache);
  }
  return cache;
}

/**
 * Convert an HTTP visibility to a visibility filter that can be used to test core visibility and applied to a model.
 *
 * The Item and Patch visibility flags are ignored.
 *
 * @param program - the Program we're working in
 * @param visibility - the visibility to convert to a filter
 * @returns a VisibilityFilter object that selects properties having any of the given visibility flags
 */
function visibilityToFilter(program: Program, visibility: Visibility): VisibilityFilter {
  // Synthetic flags are not real visibilities.
  visibility &= ~Visibility.Synthetic;

  if (visibility === Visibility.All) return {};

  const cache = getVisibilityFilterCache(program);
  let filter = cache.get(visibility);

  if (!filter) {
    const LifecycleEnum = getLifecycleVisibilityEnum(program);

    const Lifecycle = {
      Create: LifecycleEnum.members.get("Create")!,
      Read: LifecycleEnum.members.get("Read")!,
      Update: LifecycleEnum.members.get("Update")!,
      Delete: LifecycleEnum.members.get("Delete")!,
      Query: LifecycleEnum.members.get("Query")!,
    } as const;

    const any = new Set<EnumMember>();

    if (visibility & Visibility.Read) {
      any.add(Lifecycle.Read);
    }
    if (visibility & Visibility.Create) {
      any.add(Lifecycle.Create);
    }
    if (visibility & Visibility.Update) {
      any.add(Lifecycle.Update);
    }
    if (visibility & Visibility.Delete) {
      any.add(Lifecycle.Delete);
    }
    if (visibility & Visibility.Query) {
      any.add(Lifecycle.Query);
    }

    compilerAssert(any.size > 0 || visibility === Visibility.None, "invalid visibility");

    filter = { any };

    cache.set(visibility, filter);
  }

  return filter;
}

/**
 * Provides a naming suffix to create a unique name for a type with this
 * visibility.
 *
 * The canonical visibility (default Visibility.Read) gets empty suffix,
 * otherwise visibilities are joined in pascal-case with `Or`. And `Item` is
 * if `Visibility.Item` is produced.
 *
 * Examples (with canonicalVisibility = Visibility.Read):
 *  - Visibility.Read => ""
 *  - Visibility.Update => "Update"
 *  - Visibility.Create | Visibility.Update => "CreateOrUpdate"
 *  - Visibility.Create | Visibility.Item => "CreateItem"
 *  - Visibility.Create | Visibility.Update | Visibility.Item => "CreateOrUpdateItem"
 *  */
export function getVisibilitySuffix(
  visibility: Visibility,
  canonicalVisibility: Visibility = Visibility.All,
) {
  let suffix = "";

  if ((visibility & ~Visibility.Synthetic) !== canonicalVisibility) {
    const visibilities = visibilityToArray(visibility);
    suffix += visibilities.map((v) => v[0].toUpperCase() + v.slice(1)).join("Or");
  }

  if (visibility & Visibility.Item) {
    suffix += "Item";
  }

  return suffix;
}

/**
 * Determines the visibility to use for a request with the given verb.
 *
 * - GET | HEAD => Visibility.Query
 * - POST => Visibility.Update
 * - PUT => Visibility.Create | Update
 * - DELETE => Visibility.Delete
 */
function getDefaultVisibilityForVerb(verb: HttpVerb): Visibility {
  switch (verb) {
    case "get":
    case "head":
      return Visibility.Query;
    case "post":
      return Visibility.Create;
    case "put":
      return Visibility.Create | Visibility.Update;
    case "patch":
      return Visibility.Update;
    case "delete":
      return Visibility.Delete;
    default:
      compilerAssert(false, `Unreachable: unrecognized HTTP verb: '${verb satisfies never}'`);
  }
}

/**
 * A visibility provider for HTTP operations. Pass this value as a provider to the `getParameterVisibilityFilter` and
 * `getReturnTypeVisibilityFilter` functions in the TypeSpec core to get the applicable parameter and return type
 * visibility filters for an HTTP operation.
 *
 * When created with a verb, this provider will use the default visibility for that verb.
 *
 * @param verb - the HTTP verb for the operation
 *
 * @see {@link VisibilityProvider}
 * @see {@link getParameterVisibilityFilter}
 * @see {@link getReturnTypeVisibilityFilter}
 */
export function HttpVisibilityProvider(verb: HttpVerb): VisibilityProvider;
/**
 * A visibility provider for HTTP operations. Pass this value as a provider to the `getParameterVisibilityFilter` and
 * `getReturnTypeVisibilityFilter` functions in the TypeSpec core to get the applicable parameter and return type
 * visibility filters for an HTTP operation.
 *
 * When created with an options object, this provider will use the `verbSelector` function to determine the verb for the
 * operation and use the default visibility for that verb, or the configured HTTP verb for the operation, and finally
 * the GET verb if the verbSelector function is not defined and no HTTP verb is configured.
 *
 * @param options - an options object with a `verbSelector` function that returns the HTTP verb for the operation
 *
 * @see {@link VisibilityProvider}
 * @see {@link getParameterVisibilityFilter}
 * @see {@link getReturnTypeVisibilityFilter}
 */
export function HttpVisibilityProvider(options: OperationParameterOptions): VisibilityProvider;
/**
 * A visibility provider for HTTP operations. Pass this value as a provider to the `getParameterVisibilityFilter` and
 * `getReturnTypeVisibilityFilter` functions in the TypeSpec core to get the applicable parameter and return type
 * visibility filters for an HTTP operation.
 *
 * When created without any arguments, this provider will use the configured verb for the operation or the GET verb if
 * no HTTP verb is configured and use the default visibility for that selected verb.
 *
 * @see {@link VisibilityProvider}
 * @see {@link getParameterVisibilityFilter}
 * @see {@link getReturnTypeVisibilityFilter}
 */
export function HttpVisibilityProvider(): VisibilityProvider;
export function HttpVisibilityProvider(
  verbOrParameterOptions?: HttpVerb | OperationParameterOptions,
): VisibilityProvider {
  const hasVerb = typeof verbOrParameterOptions === "string";

  return {
    parameters: (program, operation) => {
      let verb = hasVerb
        ? (verbOrParameterOptions as HttpVerb)
        : (verbOrParameterOptions?.verbSelector?.(program, operation) ??
          getOperationVerb(program, operation));

      if (!verb) {
        const [httpOperation] = getHttpOperation(program, operation);

        verb = httpOperation.verb;
      }

      return visibilityToFilter(program, getDefaultVisibilityForVerb(verb));
    },
    returnType: (program, _) => {
      const Read = getLifecycleVisibilityEnum(program).members.get("Read")!;
      // For return types, we always use Read visibility in HTTP.
      return { any: new Set([Read]) };
    },
  };
}

/**
 * Returns the applicable parameter visibility or visibilities for the request if `@requestVisibility` was used.
 * Otherwise, returns the default visibility based on the HTTP verb for the operation.
 * @param operation The TypeSpec Operation for the request.
 * @param verb The HTTP verb for the operation.
 * @returns The applicable parameter visibility or visibilities for the request.
 */
export function resolveRequestVisibility(
  program: Program,
  operation: Operation,
  verb: HttpVerb,
): Visibility {
  // WARNING: This is the only place where we call HttpVisibilityProvider _WITHIN_ the HTTP implementation itself. We
  // _must_ provide the verb directly to the function as the first argument. If the verb is not provided directly, the
  // provider calls getHttpOperation to resolve the verb. Since the current function is called from getHttpOperation, it
  // will cause a stack overflow if the version of HttpVisibilityProvider we use here has to resolve the verb itself.
  const parameterVisibilityFilter = getParameterVisibilityFilter(
    program,
    operation,
    HttpVisibilityProvider(verb),
  );

  let visibility = filterToVisibility(program, parameterVisibilityFilter);
  // If the verb is PATCH, then we need to add the patch flag to the visibility in order for
  // later processes to properly apply it.
  if (verb === "patch") {
    const patchOptionality = getPatchOptions(program, operation)?.implicitOptionality ?? true;

    if (patchOptionality) {
      visibility |= Visibility.Patch;
    }
  }

  return visibility;
}

/**
 * Determines if a property is metadata. A property is defined to be
 * metadata if it is marked `@header`, `@cookie`, `@query`, `@path`, or `@statusCode`.
 */
export function isMetadata(program: Program, property: ModelProperty) {
  return (
    isHeader(program, property) ||
    isCookieParam(program, property) ||
    isQueryParam(program, property) ||
    isPathParam(program, property) ||
    isStatusCode(program, property)
  );
}

/**
 * Determines if the given property is visible with the given visibility.
 */
export function isVisible(program: Program, property: ModelProperty, visibility: Visibility) {
  return isVisibleCore(program, property, visibilityToFilter(program, visibility));
}

/**
 * Determines if the given property is metadata that is applicable with the
 * given visibility.
 *
 * - No metadata is applicable with Visibility.Item present.
 * - If only Visibility.Read is present, then only `@header` and `@status`
 *   properties are applicable.
 * - If Visibility.Read is not present, all metadata properties other than
 *   `@statusCode` are applicable.
 */
export function isApplicableMetadata(
  program: Program,
  property: ModelProperty,
  visibility: Visibility,
  isMetadataCallback = isMetadata,
) {
  return isApplicableMetadataCore(program, property, visibility, false, isMetadataCallback);
}

/**
 * Determines if the given property is metadata or marked `@body` and
 * applicable with the given visibility.
 */
export function isApplicableMetadataOrBody(
  program: Program,
  property: ModelProperty,
  visibility: Visibility,
  isMetadataCallback = isMetadata,
) {
  return isApplicableMetadataCore(program, property, visibility, true, isMetadataCallback);
}

function isApplicableMetadataCore(
  program: Program,
  property: ModelProperty,
  visibility: Visibility,
  treatBodyAsMetadata: boolean,
  isMetadataCallback: (program: Program, property: ModelProperty) => boolean,
) {
  if (visibility & Visibility.Item) {
    return false; // no metadata is applicable to collection items
  }

  if (
    treatBodyAsMetadata &&
    (isBody(program, property) ||
      isBodyRoot(program, property) ||
      isMultipartBodyProperty(program, property))
  ) {
    return true;
  }

  if (!isMetadataCallback(program, property)) {
    return false;
  }

  if (visibility & Visibility.Read) {
    return isHeader(program, property) || isStatusCode(program, property);
  }

  if (!(visibility & Visibility.Read)) {
    return !isStatusCode(program, property);
  }

  return true;
}

/**
 * Provides information about changes that happen to a data type's payload
 * when inapplicable metadata is added or invisible properties are removed.
 *
 * Results are computed on demand and expensive computations are memoized.
 */
export interface MetadataInfo {
  /**
   * Determines if the given type is transformed by applying the given
   * visibility and removing invisible properties or adding inapplicable
   * metadata properties.
   */
  isTransformed(type: Type | undefined, visibility: Visibility): boolean;

  /**
   * Determines if the given property is part of the request or response
   * payload and not applicable metadata {@link isApplicableMetadata} or
   * filtered out by the given visibility.
   */
  isPayloadProperty(
    property: ModelProperty,
    visibility: Visibility,
    inExplicitBody?: boolean,
  ): boolean;

  /**
   * Determines if the given property is optional in the request or
   * response payload for the given visibility.
   */
  isOptional(property: ModelProperty, visibility: Visibility): boolean;

  /**
   * If type is an anonymous model, tries to find a named model that has the
   * same set of properties when non-payload properties are excluded.
   */
  getEffectivePayloadType(type: Type, visibility: Visibility): Type;
}

export interface MetadataInfoOptions {
  /**
   * The visibility to be used as the baseline against which
   * {@link MetadataInfo.isEmptied} and {@link MetadataInfo.isTransformed}
   * are computed. If not specified, {@link Visibility.All} is used, which
   * will consider that any model that has fields that are only visible to
   * some visibilities as transformed.
   */
  canonicalVisibility?: Visibility;

  /**
   * Optional callback to indicate that a property can be shared with the
   * canonical representation even for visibilities where it is not visible.
   *
   * This is used, for example, in OpenAPI emit where a property can be
   * marked `readOnly: true` to represent @visibility("read") without
   * creating a separate schema schema for {@link Visibility.Read}.
   */
  canShareProperty?(property: ModelProperty): boolean;
}

export function createMetadataInfo(program: Program, options?: MetadataInfoOptions): MetadataInfo {
  const canonicalVisibility = options?.canonicalVisibility ?? Visibility.All;
  const enum State {
    NotTransformed,
    Transformed,
    Emptied,
    ComputationInProgress,
  }

  const stateMap = new TwoLevelMap<Type, Visibility, State>();

  return {
    isTransformed,
    isPayloadProperty,
    isOptional,
    getEffectivePayloadType,
  };

  function isEmptied(type: Type | undefined, visibility: Visibility): boolean {
    if (!type) {
      return false;
    }
    const state = getState(type, visibility);
    return state === State.Emptied;
  }

  function isTransformed(type: Type | undefined, visibility: Visibility): boolean {
    if (!type) {
      return false;
    }
    const state = getState(type, visibility);
    switch (state) {
      case State.Transformed:
        return true;
      case State.Emptied:
        return visibility === canonicalVisibility || !isEmptied(type, canonicalVisibility);
      default:
        return false;
    }
  }

  function getState(type: Type, visibility: Visibility): State {
    return stateMap.getOrAdd(
      type,
      visibility,
      () => computeState(type, visibility),
      State.ComputationInProgress,
    );
  }

  function computeState(type: Type, visibility: Visibility): State {
    switch (type.kind) {
      case "Model":
        return computeStateForModel(type, visibility);
      case "Union":
        return computeStateForUnion(type, visibility);
      default:
        return State.NotTransformed;
    }
  }

  function computeStateForModel(model: Model, visibility: Visibility) {
    if (computeIsEmptied(model, visibility)) {
      return State.Emptied;
    }
    if (
      isTransformed(model.indexer?.value, visibility | Visibility.Item) ||
      isTransformed(model.baseModel, visibility)
    ) {
      return State.Transformed;
    }
    for (const property of model.properties.values()) {
      if (
        isAddedRemovedOrMadeOptional(property, visibility) ||
        isTransformed(property.type, visibility)
      ) {
        return State.Transformed;
      }
    }
    return State.NotTransformed;
  }

  function computeStateForUnion(union: Union, visibility: Visibility) {
    for (const variant of union.variants.values()) {
      if (isTransformed(variant.type, visibility)) {
        return State.Transformed;
      }
    }
    return State.NotTransformed;
  }

  function isAddedRemovedOrMadeOptional(property: ModelProperty, visibility: Visibility) {
    if (visibility === canonicalVisibility) {
      return false;
    }
    if (isOptional(property, canonicalVisibility) !== isOptional(property, visibility)) {
      return true;
    }

    return (
      isPayloadProperty(property, visibility, undefined, /* keep shared */ true) !==
      isPayloadProperty(property, canonicalVisibility, undefined, /*keep shared*/ true)
    );
  }

  function computeIsEmptied(model: Model, visibility: Visibility) {
    if (model.baseModel || model.indexer || model.properties.size === 0) {
      return false;
    }
    for (const property of model.properties.values()) {
      if (isPayloadProperty(property, visibility, undefined, /* keep shared */ true)) {
        return false;
      }
    }
    return true;
  }

  function isOptional(property: ModelProperty, visibility: Visibility): boolean {
    // Properties are made optional for patch requests if the visibility includes
    // update, but not for array elements with the item flag since you must provide
    // all array elements with required properties, even in a patch.
    const hasUpdate = (visibility & Visibility.Update) !== 0;
    const isPatch = (visibility & Visibility.Patch) !== 0;
    const isItem = (visibility & Visibility.Item) !== 0;

    return property.optional || (hasUpdate && isPatch && !isItem);
  }

  function isPayloadProperty(
    property: ModelProperty,
    visibility: Visibility,
    inExplicitBody?: boolean,
    keepShareableProperties?: boolean,
  ): boolean {
    if (
      !inExplicitBody &&
      (isBodyIgnore(program, property) ||
        isApplicableMetadata(program, property, visibility) ||
        (isMetadata(program, property) && !includeInapplicableMetadataInPayload(program, property)))
    ) {
      return false;
    }

    if (!isVisible(program, property, visibility)) {
      // NOTE: When we check if a model is transformed for a given
      // visibility, we retain shared properties. It is not considered
      // transformed if the only removed properties are shareable. However,
      // if we do create a unique schema for a visibility, then we still
      // drop invisible shareable properties from other uses of
      // isPayloadProperty.
      //
      // For OpenAPI emit, for example, this means that we won't put a
      // readOnly: true property into a specialized schema for a non-read
      // visibility.
      keepShareableProperties ??= visibility === canonicalVisibility;
      return !!(keepShareableProperties && options?.canShareProperty?.(property));
    }

    return true;
  }

  /**
   * If the type is an anonymous model, tries to find a named model that has the same
   * set of properties when non-payload properties are excluded.we
   */
  function getEffectivePayloadType(type: Type, visibility: Visibility): Type {
    if (type.kind === "Model" && !type.name) {
      const effective = getEffectiveModelType(program, type, (p) =>
        isPayloadProperty(p, visibility, undefined, /* keep shared */ false),
      );
      if (effective.name) {
        return effective;
      }
    }
    return type;
  }
}
