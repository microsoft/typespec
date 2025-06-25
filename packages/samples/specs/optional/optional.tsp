import "@typespec/rest";

using Http;

@service(#{ title: "Optional sample" })
namespace OptionalSample;

model HasOptional {
  optionalNoDefault?: string;
  optionalString?: string = "default string";
  optionalNumber?: int32 = 123;
  optionalBoolean?: boolean = true;
  optionalArray?: string[] = #["foo", "bar"];
  optionalUnion?: "foo" | "bar" = "foo";
  optionalEnum?: MyEnum = MyEnum.a;
}

@route("/test")
namespace OptionalMethods {
  @get op read(
    @query queryString?: string = "defaultQueryString",
    @body queryNumber?: int64 = 123,
  ): HasOptional;
}

enum MyEnum {
  a,
  b,
}
