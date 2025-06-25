import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";

export function getPagedAsyncIterableIteratorRefkey() {
  return ay.refkey("PagedAsyncIterableIterator", "interface");
}

export function getBuildPagedAsyncIteratorRefkey() {
  return ay.refkey("buildPagedAsyncIterator", "function");
}

function getPagedResultRefkey() {
  return ay.refkey("PagedResult", "interface");
}

function getBuildPagedAsyncIteratorOptionsRefkey() {
  return ay.refkey("BuildPagedAsyncIteratorOptions", "interface");
}

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
