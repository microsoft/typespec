import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";

export function getPagedAsyncIterableIteratorRefkey() {
    return ay.refkey("PagedAsyncIterableIterator", "interface");
}

export function PagedAsyncIterableIteratorInterfaceDeclaration() {
    return (<ay.Declaration name="PagedAsyncIterableIterator" refkey={getPagedAsyncIterableIteratorRefkey()}>
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
}`
        }
    </ay.Declaration>);
}

export function PagingHelpers() {
    return (
        <ts.SourceFile path="pagingHelpers.ts">
            <PagedAsyncIterableIteratorInterfaceDeclaration />
        </ts.SourceFile>
    );
}