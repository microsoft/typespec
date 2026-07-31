import "@typespec/rest";
import "@typespec/http";
import "@typespec/versioning";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Versioning;
using Azure.ClientGenerator.Core;

// A single versioned service that is split into two clients (AlphaClient, BetaClient). Both
// clients therefore share the same set of api-versions. In this case the emitter must generate a
// SINGLE shared `MultipleClientsSameVersionServiceVersion` enum (named after the service), NOT a
// separate `<ClientName>ServiceVersion` per client.
//
// Regression test for the api-version comparison in code-model-builder.ts (getServiceVersion
// postprocess): comparing ApiVersion object references (with `===`) instead of the version
// strings incorrectly produced one ServiceVersion enum per client here, because each client
// builds its own ApiVersion instances.
@service(#{ title: "MultipleClientsSameVersion" })
@versioned(ServiceApiVersions)
namespace TspTest.MultipleClientsSameVersion;

enum ServiceApiVersions {
  v2023_01_01: "2023-01-01",
  v2023_06_01: "2023-06-01",
}

model Resource {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
}

@client({
  service: TspTest.MultipleClientsSameVersion,
  name: "AlphaClient",
})
@route("/alpha")
interface AlphaClient {
  @get
  getAlpha(@path id: string): Resource;
}

@client({
  service: TspTest.MultipleClientsSameVersion,
  name: "BetaClient",
})
@route("/beta")
interface BetaClient {
  @get
  getBeta(@path id: string): Resource;
}
