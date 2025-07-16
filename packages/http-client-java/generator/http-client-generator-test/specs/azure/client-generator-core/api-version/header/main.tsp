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
  "/azure/client-generator-core/api-version/header",
  {
    versioned: ApiVersions,
  }
)
namespace Client.AlternateApiVersion.Service.Header;

@doc("Supported api versions.")
enum ApiVersions {
  @doc("Api version 2025-01-01.")
  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  v2025_01_01: "2025-01-01",
}

model HeaderApiVersionParam {
  @header("x-ms-version")
  version: string;
}

@scenario
@scenarioDoc("Set a header as the  service api version")
@doc("Header api version parameter.")
@post
op headerApiVersion(...HeaderApiVersionParam): OkResponse;
