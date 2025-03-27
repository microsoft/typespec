import "@typespec/rest";

using Http;

@service(#{ title: "Tags sample" })
namespace TagsSample;

@route("/foo")
@tag("foo")
namespace Foo {
  @tag("tag1")
  @doc("includes namespace tag")
  @get
  op read(@path id: int32): void;

  @tag("tag1")
  @tag("tag2")
  @doc("includes namespace tag and two operations tags")
  @post
  op create(@path id: int32): void;
}

@route("/bar")
namespace Bar {
  @doc("no tags")
  @get
  op list(): Resp[];

  @doc("one operation tag")
  @tag("tag3")
  @post
  op create(@path id: int32): void;
}

@tag("outer")
@route("/nested")
namespace NestedOuter {
  @tag("inner")
  namespace NestedInner {
    @tag("moreInner")
    namespace NestedMoreInner {
      @tag("innerOp")
      @post
      op createOther(@path id: int32): void;
    }
  }
}

model Resp {
  out: string;
}
