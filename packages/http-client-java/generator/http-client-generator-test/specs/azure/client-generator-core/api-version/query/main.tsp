/**
 * DO NOT GENERATE FROM THIS FILE USE client.tsp
 * This is just to simulate a service entrypoint
 */
import "@typespec/http";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Versioning;
using Azure.ClientGenerator.Core;
using Spector;

@scenarioService(
  "/azure/client-generator-core/api-version/query",
  {
    versioned: ApiVersions,
  }
)
namespace Client.AlternateApiVersion.Service.Query;

@doc("Supported api versions.")
enum ApiVersions {
  @doc("Api version 2025-01-01.")
  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  v2025_01_01: "2025-01-01",
}

model QueryApiVersionParam {
  @query
  version: string;
}

@scenario
@scenarioDoc("Set a query parameter as the  service api version")
@doc("Query api version parameter.")
@post
op queryApiVersion(...QueryApiVersionParam): OkResponse;
