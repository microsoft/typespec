import { ModelProperty, PagingOperation } from "@typespec/compiler";
import { HttpOperation } from "@typespec/http";

export interface PagingDetail {
  // Only support the nextLink or continuationToken
  pattern: "nextLink" | "continuationToken";
  input?: {
    nextToken: string;
  };
  output: {
    items: string;
    nextToken?: {
      name: string;
      position: "headers" | "body";
    };
  };
}

export function extractPagingDetail(
  httpOperation: HttpOperation,
  pagingOperation: PagingOperation,
): PagingDetail {
  const ret: PagingDetail = {
    pattern: "nextLink",
    output: {
      items: pagingOperation.output.pageItems.property.name,
    },
  };
  const returnedNextToken =
    pagingOperation.output.nextLink?.property ?? pagingOperation.output.continuationToken?.property;
  const isHeaderToken = getResponseHeader(httpOperation, returnedNextToken);
  const returnedTokenPosition = isHeaderToken ? "headers" : "body";
  const returnedTokenName = isHeaderToken ? isHeaderToken : returnedNextToken?.name;
  if (returnedNextToken && returnedTokenName) {
    ret.output.nextToken = {
      name: returnedTokenName,
      position: returnedTokenPosition,
    };
  }
  if (pagingOperation.output.continuationToken) {
    ret.pattern = "continuationToken";
    if (pagingOperation.input.continuationToken) {
      ret.input = {
        nextToken: pagingOperation.input.continuationToken?.property.name,
      };
    }
    return ret;
  }
  return ret;
}

function getResponseHeader(httpOperation: HttpOperation, prop?: ModelProperty): string | undefined {
  if (!prop) {
    return undefined;
  }
  const headers = httpOperation.responses
    .flatMap((resp) => resp.responses)
    .map((resp) => resp.headers);
  for (const header of headers) {
    if (!header) {
      continue;
    }
    for (const key in header) {
      if (header[key] === prop) {
        return key;
      }
    }
  }
  return undefined;
}
