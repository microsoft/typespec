import "@typespec/rest";
import "@typespec/openapi";

using Http;

@service(#{ title: "Nullable sample" })
namespace NullableSample;

model HasNullables {
  str: string;
  when: plainTime;
  strOrNull: string | null;
  modelOrNull: AnotherModel | null;
  literalsOrNull: "one" | "two" | null;
  manyNullsOneString: null | null | string | null;
  manyNullsSomeValues: null | 42 | null | 100 | null;
  arr: string[] | null;
  // thisWillFail: AnotherModel | string | null;
}

@route("/test")
namespace NullableMethods {
  @get op read(
    @query someParam: string | null,
    @body modelOrNull: AnotherModel | null,
  ): HasNullables;
}

model AnotherModel {
  num: int32;
}
