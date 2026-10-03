import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

model A {
  @field(1) a: string;
}

model B {
  @field(1) b: string;
}

union Valid {
  @field(1) a: A,
  @field(2) b: B,
}

union Unnamed {
  A,
  B,
}

union MissingIndex {
  @field(1) a: A,
  b: B,
}

union WithArray {
  @field(1) a: A[],
  @field(2) b: B,
}

union WithMap {
  @field(1) a: Map<string, A>,
  @field(2) b: B,
}

union Empty {}

union ValueVariant {
  @field(1) value: string,
}

@message
model RequiredOneOf {
  payment: Valid;
}

@message
model AnonymousOneOf {
  payment?: A | B;
}

@message
model AnonymousWrapper {
  @field(1) payment?: A | B;
}

@message
model UnnamedVariant {
  payment?: Unnamed;
}

@message
model MissingVariantIndex {
  payment?: MissingIndex;
}

@message
model ArrayVariant {
  payment?: WithArray;
}

@message
model MapVariant {
  payment?: WithMap;
}

@message
model EmptyOneOf {
  payment?: Empty;
}

@message
model WrapperArrayVariant {
  @field(1) payment: WithArray;
}

@message
model WrapperValueVariant {
  @field(1) payment: ValueVariant;
}
