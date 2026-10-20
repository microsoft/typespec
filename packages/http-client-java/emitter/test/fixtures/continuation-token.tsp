import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

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

#suppress "@azure-tools/typespec-client-generator-core/client-option" "Testing Java client options."
@@clientOption(queryBody::parameters.token, "includeContinuationTokenParameter", true, "java");
#suppress "@azure-tools/typespec-client-generator-core/client-option" "Testing Java client options."
@@clientOption(headerBody::parameters.token, "includeContinuationTokenParameter", false, "java");
#suppress "@azure-tools/typespec-client-generator-core/client-option" "Testing Java client options."
@@clientOption(headerHeader::parameters.token, "includeContinuationTokenParameter", true, "java");
#suppress "@azure-tools/typespec-client-generator-core/client-option" "Operation options do not control parameter visibility."
@@clientOption(queryHeader, "includeContinuationTokenParameter", true, "java");
