/**
 * This file provides helper functions and type declarations for working with paged async iterators in a generic way.
 * It defines interfaces and functions for building paged async iterators that can iterate either item-by-item or page-by-page.
 */
import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";

/**
 * Returns a reference key for the PagedAsyncIterableIterator interface.
 * The refkey uniquely identifies this interface declaration.
 */
export function getPagedAsyncIterableIteratorRefkey() {
  return ay.refkey("PagedAsyncIterableIterator", "interface");
}

/**
 * Returns a reference key for the buildPagedAsyncIterator function.
 * The refkey uniquely identifies this function declaration.
 */
export function getBuildPagedAsyncIteratorRefkey() {
  return ay.refkey("buildPagedAsyncIterator", "function");
}

/**
 * Returns a reference key for the PagedResult interface.
 * This key is used internally when defining interfaces and functions.
 */
function getPagedResultRefkey() {
  return ay.refkey("PagedResult", "interface");
}

/**
 * Returns a reference key for the BuildPagedAsyncIteratorOptions interface.
 * The refkey uniquely identifies this interface declaration.
 */
function getBuildPagedAsyncIteratorOptionsRefkey() {
  return ay.refkey("BuildPagedAsyncIteratorOptions", "interface");
}

/**
 * Declaration for the PagedAsyncIterableIterator interface.
 * This interface allows async iteration on individual items as well as by page.
 */
function PagedAsyncIterableIteratorInterfaceDeclaration() {
  return (
    <ay.Declaration
      name="PagedAsyncIterableIterator"
      refkey={getPagedAsyncIterableIteratorRefkey()}
    >
      {ay.code`
  /**
* An interface that allows async iterable iteration both to completion and by page.
*/
export interface PagedAsyncIterableIterator<
  TElement,
  TPageResponse,
  TPageSettings,
> {
  /**
    * The next method, part of the iteration protocol
    */
  next(): Promise<IteratorResult<TElement>>;
  /**
    * The connection to the async iterator, part of the iteration protocol
    */
  [Symbol.asyncIterator](): PagedAsyncIterableIterator<
    TElement,
    TPageResponse,
    TPageSettings
  >;
  /**
    * Return an AsyncIterableIterator that works a page at a time
    */
  byPage: (
    settings?: TPageSettings,
  ) => AsyncIterableIterator<TPageResponse>;
}  `}
    </ay.Declaration>
  );
}

/**
 * Declaration for the PagedResult interface.
 * This interface abstracts how to get paginated results and elements from a service response.
 */
function PagedResultInterfaceDeclaration() {
  return (
    <ay.Declaration name="PagedResult" refkey={getPagedResultRefkey()}>
      {ay.code`
/**
* An interface that describes how to communicate with the service.
*/
interface PagedResult<
  TElement,
  TPageResponse,
  TPageSettings,
> {
  /**
    * Extract the paged elements from the response. Only support array of elements.
    * @param response paged response
    * @returns TElement[]
    */
  getElements: (response: TPageResponse) => TElement[];
  /**
    * A method that returns a page of results.
    */
  getPage: (
    nextLinkOrContinuationToken?: string,
    settings?: TPageSettings,
  ) => Promise<{ pagedResponse: TPageResponse; nextToken?: string } | undefined>;
  /**
    * a function to implement the \`byPage\` method on the paged async iterator.
    */
  byPage: (
    settings?: TPageSettings,
  ) => AsyncIterableIterator<TPageResponse>;
}`}
    </ay.Declaration>
  );
}

/**
 * Declaration for the BuildPagedAsyncIteratorOptions interface.
 * This interface defines options required to build a paged async iterator.
 */
function BuildPagedAsyncIteratorOptionsInterfaceDeclaration() {
  return (
    <ay.Declaration
      name="BuildPagedAsyncIteratorOptions"
      refkey={getBuildPagedAsyncIteratorOptionsRefkey()}
    >
      {ay.code`
/**
 * Options for the paging helper
 */
export interface BuildPagedAsyncIteratorOptions<
  TElement,
  TPageResponse,
  TPageSettings,
> {
  getElements: (response: TPageResponse) => TElement[];
  getPagedResponse: (nextToken?: string, settings?: TPageSettings) =>  Promise<{ pagedResponse: TPageResponse; nextToken?: string } | undefined>;
}`}
    </ay.Declaration>
  );
}

/**
 * Declaration for the buildPagedAsyncIterator function.
 * This helper constructs a PagedAsyncIterableIterator using the provided options.
 */
function BuildPagedAsyncIteratorInterfaceDeclaration() {
  return (
    <ay.Declaration name="buildPagedAsyncIterator" refkey={getBuildPagedAsyncIteratorRefkey()}>
      {ay.code`
/**
 * Helper to paginate results in a generic way and return a PagedAsyncIterableIterator
 */
export function buildPagedAsyncIterator<
  TElement,
  TPageResponse,
  TPageSettings
>(
  options: BuildPagedAsyncIteratorOptions<TElement, TPageResponse, TPageSettings>,
): PagedAsyncIterableIterator<TElement, TPageResponse, TPageSettings> {
  const pagedResult: ${getPagedResultRefkey()}<TElement, TPageResponse, TPageSettings> = {
    getElements: options.getElements,
    getPage: options.getPagedResponse,
    byPage: (setting?: TPageSettings) => {
      return getPageAsyncIterator(pagedResult, { setting });
    },
  };
  const iter = getItemAsyncIterator<TElement, TPageResponse, TPageSettings>(pagedResult);
  return {
    next() {
      return iter.next();
    },
    [Symbol.asyncIterator]() {
      return this;
    },
    byPage: pagedResult.byPage,
  };
}

async function* getItemAsyncIterator<TElement, TPage, TPageSettings>(
  pagedResult: ${getPagedResultRefkey()}<TElement, TPage, TPageSettings>,
): AsyncIterableIterator<TElement> {
  const pages = getPageAsyncIterator(pagedResult);
  for await (const page of pages) {
    const results = pagedResult.getElements(page);
    yield* results;
  }
}

async function* getPageAsyncIterator<TElement, TPageResponse, TPageSettings>(
  pagedResult: ${getPagedResultRefkey()}<TElement, TPageResponse, TPageSettings>,
  options: {
    setting?: TPageSettings;
  } = {},
): AsyncIterableIterator<TPageResponse> {
  let response = await pagedResult.getPage(undefined, options.setting);
  let results = response?.pagedResponse;
  let nextToken = response?.nextToken;
  if (!results) {
    return;
  }
  yield results;
  while (nextToken) {
    response = await pagedResult.getPage(nextToken, options.setting);
    if (!response) {
      return;
    }
    results = response.pagedResponse;
    nextToken = response.nextToken;
    yield results;
  }
}`}
    </ay.Declaration>
  );
}

/**
 * Main export that wraps all paging helper declarations in a single source file.
 * This facilitates easy integration of all related paging functionalities.
 */
export function PagingHelpers() {
  return (
    <ts.SourceFile path="pagingHelpers.ts">
      <PagedAsyncIterableIteratorInterfaceDeclaration />
      <PagedResultInterfaceDeclaration />
      <BuildPagedAsyncIteratorOptionsInterfaceDeclaration />
      <BuildPagedAsyncIteratorInterfaceDeclaration />
    </ts.SourceFile>
  );
}
