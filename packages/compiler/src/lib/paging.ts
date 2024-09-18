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
import { getTypeName } from "../core/helpers/type-name-utils.js";
import { createDiagnosticCollector, navigateProgram, Program } from "../core/index.js";
import { createDiagnostic, reportDiagnostic } from "../core/messages.js";
import type {
  DecoratorContext,
  DecoratorFunction,
  Diagnostic,
  ModelProperty,
  Operation,
  Type,
} from "../core/types.js";
import { DuplicateTracker } from "../utils/duplicate-tracker.js";
import { Mutable } from "../utils/misc.js";
import { isNumericType, isStringType } from "./decorators.js";
import { useStateSet } from "./utils.js";

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
] = createMarkerDecorator<OffsetDecorator>("offset", createNumericValidation("pageItems"));

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
] = createMarkerDecorator<PageIndexDecorator>("pageIndex", createNumericValidation("pageItems"));

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
] = createMarkerDecorator<PageSizeDecorator>("pageSize", createNumericValidation("pageItems"));

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
] = createMarkerDecorator<PageItemsDecorator>("pageItems", createNumericValidation("pageItems"));

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
] = createMarkerDecorator<ContinuationTokenDecorator>("continuationToken", (context, target) => {
  if (!isStringType(context.program, target.type)) {
    reportDiagnostic(context.program, {
      code: "decorator-wrong-target",
      messageId: "withExpected",
      format: { decorator: "continuationToken", expected: "string", to: getTypeName(target.type) },
      target: context.decoratorTarget,
    });
    return false;
  }
  return true;
});

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
export interface PagingOperation {
  readonly input: {
    readonly offset?: ModelProperty;
    readonly pageIndex?: ModelProperty;
    readonly pageSize?: ModelProperty;
    readonly continuationToken?: ModelProperty;
  };

  readonly output: {
    readonly pageItems?: ModelProperty;
    readonly nextLink?: ModelProperty;
    readonly prevLink?: ModelProperty;
    readonly firstLink?: ModelProperty;
    readonly lastLink?: ModelProperty;
    readonly continuationToken?: ModelProperty;
  };
}

function getPagingOperation(
  program: Program,
  op: Operation,
): [PagingOperation | undefined, readonly Diagnostic[]] {
  const diags = createDiagnosticCollector();
  const input: Mutable<PagingOperation["input"]> = {};
  const output: Mutable<PagingOperation["output"]> = {};

  let duplicateTracker = new DuplicateTracker<string, ModelProperty>();
  navigateProperties(op.parameters, (prop) => {
    const kind = diags.pipe(getPagingProperty(program, prop));
    duplicateTracker.track(kind, prop);
    switch (kind) {
      case "offset":
      case "pageIndex":
      case "pageSize":
        input[kind] = prop;
        break;
      case "continuationToken":
        input.continuationToken = prop;
        break;
      case "pageItems":
      case "nextLink":
      case "prevLink":
      case "firstLink":
      case "lastLink":
        diags.add(
          createDiagnostic({
            code: "invalid-paging-prop",
            messageId: "parmeters",
            format: { kind },
            target: prop,
          }),
        );
        break;
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

  duplicateTracker = new DuplicateTracker<string, ModelProperty>();
  navigateProperties(op.returnType, (prop) => {
    const kind = diags.pipe(getPagingProperty(program, prop));
    duplicateTracker.track(kind, prop);
    console.log("Track this", kind);
    switch (kind) {
      case "offset":
      case "pageIndex":
      case "pageSize":
        diags.add(
          createDiagnostic({
            code: "invalid-paging-prop",
            messageId: "returnType",
            format: { kind },
            target: prop,
          }),
        );
        break;
      case "continuationToken":
        output.continuationToken = prop;
        break;
      case "pageItems":
      case "nextLink":
      case "prevLink":
      case "firstLink":
      case "lastLink":
        output[kind] = prop;
        break;
    }
  });

  for (const [key, duplicates] of duplicateTracker.entries()) {
    console.log("Duplicate", key, duplicates);
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

  return [{ input, output }, diags.diagnostics];
}

function navigateProperties(type: Type, callback: (prop: ModelProperty) => void) {
  switch (type.kind) {
    case "Model":
      for (const prop of type.properties.values()) {
        callback(prop);
      }
      break;
    case "Union":
      for (const member of type.variants.values()) {
        navigateProperties(member, callback);
      }
      break;
    case "UnionVariant":
      navigateProperties(type.type, callback);
      break;
  }
}

function getPagingProperty(
  program: Program,
  prop: ModelProperty,
): [PagingPropertyKind, readonly Diagnostic[]] {
  const diagnostics: Diagnostic[] = [];
  const props = {
    offset: isPageIndexProperty(program, prop),
    pageIndex: isOffsetProperty(program, prop),
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
  const [isLink, markLink] = useStateSet<Parameters<T>[1]>(key);
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
