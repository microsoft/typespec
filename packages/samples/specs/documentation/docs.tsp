import "@typespec/rest";

using Http;

@service(#{ title: "Documentation sample" })
namespace DocSample;

@route("/foo")
@doc("Things to do with foo")
namespace Foo {
  @route("DefaultDescriptions") op withDefaultDescriptions(): Resp | Error;

  @route("ModelDocDescriptions") op withModelDocDescriptions(): RespWithDocs | ErrorWithDocs;

  @route("NotFoundWithDocs") op withStatusCodeDocs(): Resp | NotFoundWithDocsResp | Error;

  @route("NotFoundDefaultDocs") op withDefaultDescNotFound(): RespWithDocs | NotFoundResp | Error;
}

// will have default success description
model Resp {
  value: int32;
}

@doc("Response from @doc")
model RespWithDocs {
  value: int32;
}

@error
model Error {
  code: int32;
}

@doc("Error from @doc")
@error
model ErrorWithDocs {
  code: int32;
}

model NotFoundResp {
  @statusCode _: 404;
  details: string;
}

@doc("Not found")
model NotFoundWithDocsResp {
  @statusCode _: 404;
  details: string;
}
