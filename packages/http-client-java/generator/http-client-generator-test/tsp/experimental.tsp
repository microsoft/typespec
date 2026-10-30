import "@typespec/http";
import "@typespec/http-client";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.HttpClient;

@service(#{ title: "Experimental" })
@server("https://example.com", "Example")
@experimental
namespace TspTest.Experimental;

@experimental
model PreviewModel {
  @experimental
  value?: string;

  stableValue?: string;
  choice?: Choice;
  openChoice?: OpenChoice;
  scoped?: Scoped;
  stable?: Stable;
  otherEmitter?: OtherEmitter;
  excluded?: Excluded;
  customized?: CustomizedModel;
}

@experimental
model CustomizedModel {
  value?: string;
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

@experimental(#{ emitterScope: "@typespec/http-client-java" })
model Scoped {
  value: string;
}

model Stable {
  value: string;
}

@experimental(#{ emitterScope: "other-emitter" })
model OtherEmitter {
  value: string;
}

@experimental(#{ emitterScope: "!@typespec/http-client-java" })
model Excluded {
  value: string;
}

@post
@route("/preview")
@experimental(#{ diagnosticId: "PREVIEW001", dependsOn: #["DEPENDENCY001"] })
op read(
  @experimental
  @body
  body: PreviewModel,

  @experimental(#{ diagnosticId: "QUERY001" })
  @query
  previewQuery?: string,
): PreviewModel;

@get
@route("/stable")
op stable(): void;

@experimental
@route("/group")
interface Group {
  @post
  @experimental
  read(@body body: PreviewModel): PreviewModel;
}
