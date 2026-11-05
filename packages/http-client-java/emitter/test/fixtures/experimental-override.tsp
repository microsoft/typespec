import "@typespec/http";
import "@typespec/http-client";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.HttpClient;
using Azure.ClientGenerator.Core;

@service
@server("https://example.com", "Example")
namespace ExperimentalOverride {
  @get
  @route("/grouped")
  op groupedOverride(
    @query preview: string,
    @experimental(#{ diagnosticId: "ORIGINAL_QUERY" }) @query original: string,
    @query stable: string,
  ): void;

  model OverrideOptions {
    @experimental(#{ diagnosticId: "OVERRIDE_QUERY" })
    preview: string;

    original: string;
    stable: string;
  }
}

namespace Customization {
  op groupedOverride(options: ExperimentalOverride.OverrideOptions): void;
}

@@override(ExperimentalOverride.groupedOverride, Customization.groupedOverride);
