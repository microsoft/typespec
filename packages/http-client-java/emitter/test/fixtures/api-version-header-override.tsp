import "@typespec/http";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Versioning;

@service
@versioned(Versions)
namespace TspTest.ApiVersionHeaderOverride;

enum Versions {
  v2026_03_01: "2026-03-01",
}

@route("/legacy")
@Azure.Core.Legacy.overrideApiVersion("2018-10-01")
interface LegacyClient {
  @get
  read(@header("api-version") apiVersion: string): void;

  @get
  @route("/named")
  readNamed(@header("x-ms-api-version") apiVersion: string): void;
}
