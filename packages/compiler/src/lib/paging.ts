import type {
  ContinuationTokenDecorator,
  FirstLinkDecorator,
  LastLinkDecorator,
  ListDecorator,
  NextLinkDecorator,
  OffsetDecorator,
  PageIndexDecorator,
  PageItemsDecorator,
  PageSizeDecorator,
  PrevLinkDecorator,
} from "../../generated-defs/TypeSpec.js";
import { createDiagnosticCollector } from "../core/diagnostics.js";
import { getTypeName } from "../core/helpers/type-name-utils.js";
import { createDiagnostic, reportDiagnostic } from "../core/messages.js";
import type { Program } from "../core/program.js";
import { navigateProgram } from "../core/semantic-walker.js";
import { isArrayModelType } from "../core/type-utils.js";
import type {
  DecoratorContext,
  DecoratorFunction,
  Diagnostic,
  ModelProperty,
  Operation,
  Type,
} from "../core/types.js";
import { createStateSymbol } from "../lib/utils.js";
import { DuplicateTracker, useStateSet } from "../utils/index.js";
import { isNumericType } from "./decorators.js";

export const [
  /**
   * Check if the given operation is used to page through a list.
   * @param program Program
   * @param target Operation
   */
  isList,
  markList,
  /** {@inheritdoc ListDecorator} */
  listDecorator,
] = createMarkerDecorator<ListDecorator>("list");

export const [
  /**
   * Check if the given property is the `@offset` property for a paging operation.
   * @param program Program
   * @param target Model Property
   */
  isOffsetProperty,
  markOffset,
  /** {@inheritdoc OffsetDecorator} */
  offsetDecorator,
] = createMarkerDecorator<OffsetDecorator>("offset", createNumericValidation("offset"));

export const [
  /**
   * Check if the given property is the `@pageIndex` property for a paging operation.
   * @param program Program
   * @param target Model Property
   */
  isPageIndexProperty,
  markPageIndexProperty,
  /** {@inheritdoc PageIndexDecorator} */
  pageIndexDecorator,
] = createMarkerDecorator<PageIndexDecorator>("pageIndex", createNumericValidation("pageIndex"));

export const [
  /**
   * Check if the given property is the `@pageIndex` property for a paging operation.
   * @param program Program
   * @param target Model Property
   */
  isPageSizeProperty,
  markPageSizeProperty,
  /** {@inheritdoc PageSizeDecorator} */
  pageSizeDecorator,
] = createMarkerDecorator<PageSizeDecorator>("pageSize", createNumericValidation("pageSize"));

export const [
  /**
   * Check if the given property is the `@pageIndex` property for a paging operation.
   * @param program Program
   * @param target Model Property
   */
  isPageItemsProperty,
  markPageItemsProperty,
  /** {@inheritdoc PageItemsDecorator} */
  pageItemsDecorator,
] = createMarkerDecorator<PageItemsDecorator>("pageItems", (context, target) => {
  if (target.type.kind !== "Model" || !isArrayModelType(target.type)) {
    reportDiagnostic(context.program, {
      code: "decorator-wrong-target",
      messageId: "withExpected",
      format: { decorator: "continuationToken", expected: "Array", to: getTypeName(target.type) },
      target: context.decoratorTarget,
    });
    return false;
  }
  return true;
});

export const [
  /**
   * Check if the given property is the `@pageIndex` property for a paging operation.
   * @param program Program
   * @param target Model Property
   */
  isContinuationTokenProperty,
  markContinuationTokenProperty,
  /** {@inheritdoc ContinuationTokenDecorator} */
  continuationTokenDecorator,
] = createMarkerDecorator<ContinuationTokenDecorator>("continuationToken");

export const [
  /**
   * Check if the given property is the `@nextLink` property for a paging operation.
   * @param program Program
   * @param target Model Property
   */
  isNextLink,
  markNextLink,
  /** {@inheritdoc NextLinkDecorator} */
  nextLinkDecorator,
] = createMarkerDecorator<NextLinkDecorator>("nextLink");
export const [
  /**
   * Check if the given property is the `@prevLink` property for a paging operation.
   * @param program Program
   * @param target Model Property
   */ isPrevLink,
  markPrevLink,
  /** {@inheritdoc PrevLinkDecorator} */
  prevLinkDecorator,
] = createMarkerDecorator<PrevLinkDecorator>("prevLink");
export const [
  /**
   * Check if the given property is the `@firstLink` property for a paging operation.
   * @param program Program
   * @param target Model Property
   */ isFirstLink,
  markFirstLink,
  /** {@inheritdoc FirstLinkDecorator} */
  firstLinkDecorator,
] = createMarkerDecorator<FirstLinkDecorator>("firstLink");
export const [
  /**
   * Check if the given property is the `@lastLink` property for a paging operation.
   * @param program Program
   * @param target Model Property
   */ isLastLink,
  markLastLink,
  /** {@inheritdoc LastLinkDecorator} */
  lastLinkDecorator,
] = createMarkerDecorator<LastLinkDecorator>("lastLink");

export function validatePagingOperations(program: Program) {
  navigateProgram(program, {
    operation: (op) => {
      if (isList(program, op)) {
        validatePagingOperation(program, op);
      }
    },
  });
}

type PagingPropertyKind =
  | "offset"
  | "pageIndex"
  | "pageSize"
  | "pageItems"
  | "continuationToken"
  | "nextLink"
  | "prevLink"
  | "firstLink"
  | "lastLink";

/** A paging marker's property and its access path from an operation's parameter or response model. */
export interface PagingProperty {
  /** The annotated property itself, also the final element of {@link PagingProperty.path}. */
  readonly property: ModelProperty;
  /**
   * Ordered properties from the root model to the annotated property, including the property itself.
   *
   * If the paging property is nested, this will contain the path to the paging property in the model
   * and array length will be greater than one.
   *
   * You can use this to generate the path to the property in the model with following code:
   * @example
   * ```ts
   * const path = pagingInfo.output.pageItems.path.map((prop) => prop.name).join(".");
   * ```
   */
  readonly path: ModelProperty[];
}
/**
 * Paging metadata discovered in an operation's parameters and return type, including nested and inherited properties.
 * Optional entries are absent when the corresponding paging marker was not found.
 */
export interface PagingOperation {
  /** Paging controls found in the operation's parameter model. */
  readonly input: {
    /** Number of items to skip, identified by `@offset`. */
    readonly offset?: PagingProperty;
    /** Page index to request, identified by `@pageIndex`. */
    readonly pageIndex?: PagingProperty;
    /** Maximum number of items requested per page, identified by `@pageSize`. */
    readonly pageSize?: PagingProperty;
    /** Token supplied to continue a prior page, identified by `@continuationToken`. */
    readonly continuationToken?: PagingProperty;
  };

  /** Page contents and navigation controls found in the operation's return type. */
  readonly output: {
    /** Required array of items for this page, identified by `@pageItems`. */
    readonly pageItems: PagingProperty;
    /** Link to retrieve the next page, identified by `@nextLink`. */
    readonly nextLink?: PagingProperty;
    /** Link to retrieve the previous page, identified by `@prevLink`. */
    readonly prevLink?: PagingProperty;
    /** Link to retrieve the first page, identified by `@firstLink`. */
    readonly firstLink?: PagingProperty;
    /** Link to retrieve the last page, identified by `@lastLink`. */
    readonly lastLink?: PagingProperty;
    /** Token returned for a subsequent request, identified by `@continuationToken`. */
    readonly continuationToken?: PagingProperty;
  };
}

const inputProps = new Set(["offset", "pageIndex", "pageSize", "continuationToken"]);
const outputProps = new Set([
  "pageItems",
  "nextLink",
  "prevLink",
  "firstLink",
  "lastLink",
  "continuationToken",
]);

function findPagingProperties<K extends "input" | "output">(
  program: Program,
  op: Operation,
  base: Type,
  source: K,
): [PagingOperation[K], readonly Diagnostic[]] {
  const diags = createDiagnosticCollector();
  const acceptableProps = source === "input" ? inputProps : outputProps;
  const duplicateTracker = new DuplicateTracker<string, ModelProperty>();
  const data: Record<string, PagingProperty> = {};
  navigateProperties(base, (property, path) => {
    const kind = diags.pipe(getPagingProperty(program, property));
    if (kind === undefined) {
      return;
    }
    duplicateTracker.track(kind, property);
    if (acceptableProps.has(kind)) {
      data[kind] = { property, path };
    } else {
      diags.add(
        createDiagnostic({
          code: "invalid-paging-prop",
          messageId: source === "input" ? "input" : "output",
          format: { kind },
          target: property,
        }),
      );
    }
  });
  for (const [key, duplicates] of duplicateTracker.entries()) {
    for (const prop of duplicates) {
      diags.add(
        createDiagnostic({
          code: "duplicate-paging-prop",
          format: { kind: key, operationName: op.name },
          target: prop,
        }),
      );
    }
  }

  return diags.wrap(data as any);
}

/**
 * Discovers paging properties in an operation's parameters and return type, without requiring `@list`.
 * Traverses nested models, base models, and union variants, and returns diagnostics without reporting them.
 *
 * @returns Metadata and diagnostics. Metadata is `undefined` when no `@pageItems` property is found;
 * other invalid or duplicate markers can produce diagnostics alongside metadata.
 */
export function getPagingOperation(
  program: Program,
  op: Operation,
): [PagingOperation | undefined, readonly Diagnostic[]] {
  const diags = createDiagnosticCollector();
  const result: PagingOperation = {
    input: diags.pipe(findPagingProperties(program, op, op.parameters, "input")),
    output: diags.pipe(findPagingProperties(program, op, op.returnType, "output")),
  };

  if (result.output.pageItems === undefined) {
    diags.add(
      createDiagnostic({
        code: "missing-paging-items",
        format: { operationName: op.name },
        target: op,
      }),
    );
    return diags.wrap(undefined);
  }
  return diags.wrap(result);
}

function navigateProperties(
  type: Type,
  callback: (prop: ModelProperty, path: ModelProperty[]) => void,
  path: ModelProperty[] = [],
  visited: Set<Type> = new Set(),
): void {
  if (visited.has(type)) return;
  visited.add(type);
  switch (type.kind) {
    case "Model":
      for (const prop of type.properties.values()) {
        callback(prop, [...path, prop]);
        navigateProperties(prop.type, callback, [...path, prop], visited);
      }
      if (type.baseModel) {
        navigateProperties(type.baseModel, callback, path, visited);
      }
      break;
    case "Union":
      for (const member of type.variants.values()) {
        navigateProperties(member, callback, path, visited);
      }
      break;
    case "UnionVariant":
      navigateProperties(type.type, callback, path, visited);
      break;
  }
}

function getPagingProperty(
  program: Program,
  prop: ModelProperty,
): [PagingPropertyKind | undefined, readonly Diagnostic[]] {
  const diagnostics: Diagnostic[] = [];
  const props = {
    offset: isOffsetProperty(program, prop),
    pageIndex: isPageIndexProperty(program, prop),
    pageItems: isPageItemsProperty(program, prop),
    pageSize: isPageSizeProperty(program, prop),
    continuationToken: isContinuationTokenProperty(program, prop),
    nextLink: isNextLink(program, prop),
    prevLink: isPrevLink(program, prop),
    lastLink: isLastLink(program, prop),
    firstLink: isFirstLink(program, prop),
  };
  const defined = Object.entries(props).filter((x) => !!x[1]);

  if (defined.length > 1) {
    diagnostics.push(
      createDiagnostic({
        code: "incompatible-paging-props",
        format: { kinds: defined.map((x) => x[0]).join(", ") },
        target: prop,
      }),
    );
  }
  if (defined.length === 0) {
    return [undefined, diagnostics];
  }

  return [defined[0][0] satisfies string as PagingPropertyKind, diagnostics] as const;
}

function validatePagingOperation(program: Program, op: Operation) {
  const [_, diagnostics] = getPagingOperation(program, op);
  program.reportDiagnostics(diagnostics);
}

function createMarkerDecorator<T extends DecoratorFunction>(
  key: string,
  validate?: (...args: Parameters<T>) => boolean,
) {
  const [isLink, markLink] = useStateSet<Parameters<T>[1]>(createStateSymbol(key));
  const decorator = (...args: Parameters<T>) => {
    if (validate && !validate(...args)) {
      return;
    }
    const [context, target] = args;
    markLink(context.program, target);
  };
  return [isLink, markLink, decorator as T] as const;
}

function createNumericValidation(decoratorName: string) {
  return (context: DecoratorContext, target: ModelProperty) => {
    if (!isNumericType(context.program, target.type)) {
      reportDiagnostic(context.program, {
        code: "decorator-wrong-target",
        messageId: "withExpected",
        format: {
          decorator: decoratorName,
          expected: "numeric",
          to: getTypeName(target.type),
        },
        target: context.decoratorTarget,
      });
      return false;
    }
    return true;
  };
}
