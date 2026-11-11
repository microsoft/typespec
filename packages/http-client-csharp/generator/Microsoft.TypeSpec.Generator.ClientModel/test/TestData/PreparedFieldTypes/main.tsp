import "@typespec/http";
using TypeSpec.Http;

@service
namespace OwnedPilot;

enum Kind {
  first: "first",
  second: "second",
}

model Base {
  value: HttpPart<Kind>;
}

model Derived extends Base {
  value: HttpPart<Kind.first>;
}

@route("/upload")
@post
op upload(@multipartBody body: Base): void;

@route("/derived")
@post
op uploadDerived(@multipartBody body: Derived): void;
