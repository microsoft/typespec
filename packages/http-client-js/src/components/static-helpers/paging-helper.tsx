import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";

export function getPagedAsyncIterableIteratorRefkey() {
  return ay.refkey("PagedAsyncIterableIterator", "interface");
}

export function PagedAsyncIterableIteratorInterfaceDeclaration() {
  return (<ay.Declaration name="PagedAsyncIterableIterator" refkey={getPagedAsyncIterableIteratorRefkey()}>
    {ay.code`
import { Client, createRestError, PathUncheckedResponse } from "@typespec/ts-http-runtime";

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
}

/**
 * An interface that describes how to communicate with the service.
 */
export interface PagedResult<
  TElement,
  TPageResponse,
  TPageSettings,
> {
  /**
   * Extract the next link or continuation token from the response.
   * @param response paged response
   * @returns string | undefined
   */
  getNextLinkOrContinuationToken: (response: TPageResponse) => string | undefined;
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
  ) => Promise<TPageResponse | undefined>;
  /**
   * a function to implement the \`byPage\` method on the paged async iterator.
   */
  byPage: (
    settings?: TPageSettings,
  ) => AsyncIterableIterator<TPageResponse>;
}

export interface PageOption {
  name: string;
  // TODO: nested body is not supported
  position: "header" | "query" | "body";
}

/**
 * Options for the paging helper
 */
export interface BuildPagedAsyncIteratorOptions {
  /***
   * Only support two paging patterns:
   * - one is next link which is linking all pagings with an absolute URL
   * - the other is continuation token which is linking all pagings with a token.
  */
  pattern: "nextLink" | "continuationToken";
  output: {
    nextLink?: string;
    continuationToken?: string;
    pageItems: string;
  }
}

/**
 * Helper to paginate results in a generic way and return a PagedAsyncIterableIterator
 */
export function buildPagedAsyncIterator<
  TElement,
  TPageResponse,
  TPageSettings,
  TResponse extends PathUncheckedResponse = PathUncheckedResponse,
>(
  client: Client,
  getInitialResponse: () => PromiseLike<TResponse>,
  processResponseBody: (result: TResponse) => PromiseLike<unknown>,
  options: BuildPagedAsyncIteratorOptions,
): PagedAsyncIterableIterator<TElement, TPageResponse, TPageSettings> {
  const pagedResult: PagedResult<TElement, TPageResponse, TPageSettings> = {
    getElements: (response: TPageResponse) => {
      return (response as any)[options.output.pageItems];
    },
    getNextLinkOrContinuationToken: (response: TPageResponse) => {
      if (options.pattern === "nextLink" && options.output.nextLink) {
        return (response as any)[options.output.nextLink];
      } else if (options.pattern === "continuationToken" && options.output.continuationToken) {
        return (response as any)[options.output.continuationToken];
      }
      return undefined;
    },
    getPage: async (nextToken?: string, _settings?: TPageSettings) => {
      if(options.pattern === "nextLink") {
        const result =
        nextToken === undefined
          ? await getInitialResponse()
          : await client.pathUnchecked(nextToken).get();
      checkPagingRequest(result);
      const results = await processResponseBody(result as any) as any;
      return results;
      } else if (options.pattern === "continuationToken") {
        throw new Error("Not implemented");
      }
      return undefined;
    },
    byPage: (settings?: TPageSettings) => {
      return getPageAsyncIterator(pagedResult, { setting: settings });
    },
  };
  return getPagedAsyncIterator(pagedResult);
}

/**
 * returns an async iterator that iterates over results. It also has a \`byPage\`
 * method that returns pages of items at once.
 *
 * @param pagedResult - an object that specifies how to get pages.
 * @returns a paged async iterator that iterates over results.
 */

function getPagedAsyncIterator<
  TElement,
  TPageResponse,
  TPageSettings
>(
  pagedResult: PagedResult<TElement, TPageResponse, TPageSettings>,
): PagedAsyncIterableIterator<TElement, TPageResponse, TPageSettings> {
  const iter = getItemAsyncIterator<TElement, TPageResponse, TPageSettings>(
    pagedResult,
  );
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

async function* getItemAsyncIterator<
  TElement,
  TPage,
  TPageSettings,
>(
  pagedResult: PagedResult<TElement, TPage, TPageSettings>,
): AsyncIterableIterator<TElement> {
  const pages = getPageAsyncIterator(pagedResult);
  for await (const page of pages) {
    const results = pagedResult.getElements(page);
    yield* results;
  }
}

async function* getPageAsyncIterator<
  TElement,
  TPageResponse,
  TPageSettings,
>(
  pagedResult: PagedResult<TElement, TPageResponse, TPageSettings>,
  options: {
    setting?: TPageSettings;
  } = {},
): AsyncIterableIterator<TPageResponse> {
  let response = await pagedResult.getPage(
    undefined,
    options.setting
  );
  if (!response) {
    return;
  }
  yield response;
  const nextToken = pagedResult.getNextLinkOrContinuationToken(response);
  while (nextToken) {
    response = await pagedResult.getPage(nextToken, options.setting);
    if (!response) {
      return;
    }
    yield response;
  }
}

/**
 * Checks if a request failed
 */
function checkPagingRequest(
  response: PathUncheckedResponse,
  expectedStatuses: string[] = ["200", "201", "202", "204"],
): void {
  if (!expectedStatuses.includes(response.status)) {
    throw createRestError(
      \`Pagination failed with unexpected statusCode \${response.status\}\`,
      response,
    );
  }
}
`}
  </ay.Declaration>);
}

export function PagingHelpers() {
  return (
    <ts.SourceFile path="pagingHelpers.ts">
      <PagedAsyncIterableIteratorInterfaceDeclaration />
    </ts.SourceFile>
  );
}