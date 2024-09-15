import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package
namespace Test;

model Foo {
  @field(1) bar: string
}

@message
union FullyDecoratedUnion {
  @field(1) a1: string;
  @field(2) b1: Foo;
}

@message
union PartiallyDecoratedUnion {
  @field(1) a2: string;
  b2: Foo;
}

@message
union UndecoratedUnion {
  a3: string;
  b3: Foo;
}
