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
import { reportDiagnostic } from "../core/messages.js";
import type { DecoratorContext, DecoratorFunction, ModelProperty } from "../core/types.js";
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

function createMarkerDecorator<T extends DecoratorFunction>(
  key: string,
  validate?: (...args: Parameters<T>) => boolean,
) {
  const [isLink, markLink] = useStateSet<ModelProperty>(key);
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
