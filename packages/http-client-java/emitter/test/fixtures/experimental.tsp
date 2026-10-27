import "@typespec/http";
import "@typespec/http-client";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.HttpClient;

@service
@server("https://example.com", "Example")
@experimental
namespace ExperimentalContract;

@experimental
model Preview {
  @experimental
  value: string;

  choice: Choice;
  openChoice: OpenChoice;
  stable: Stable;
  excluded: Excluded;
  emptyWarning: EmptyWarning;
}

@experimental
enum Choice {
  @experimental
  One,

  Two,
}

@experimental
union OpenChoice {
  string,

  @experimental
  One: "one",

  Two: "two",
}

@experimental(#{ emitterScope: "other-emitter" })
model Stable {
  value: string;
}

@experimental(#{ emitterScope: "!@typespec/http-client-java" })
model Excluded {
  value: string;
}

@experimental
model EmptyWarning {
  value: string;
}

@get
@route("/preview")
@experimental
op read(): Preview;

@experimental
@route("/group")
interface Group {
  @get
  @experimental
  read(): Preview;
}
