import "@typespec/http";

using TypeSpec.Http;

@service
namespace ContinuationToken;

model Item {
  id: string;
}

@list
@route("/query-body")
op queryBody(@query @continuationToken token?: string): {
  @pageItems items: Item[];
  next?: {
    @continuationToken token?: string;
  };
};

@list
@route("/header-body")
op headerBody(@header @continuationToken token?: string): {
  @pageItems items: Item[];
  @continuationToken nextToken?: string;
};

@list
@route("/query-header")
op queryHeader(@query @continuationToken token?: string): {
  @pageItems items: Item[];
  @header("next-token") @continuationToken nextToken?: string;
};

@list
@route("/header-header")
op headerHeader(@header @continuationToken token?: string): {
  @pageItems items: Item[];
  @header("next-token") @continuationToken nextToken?: string;
};
