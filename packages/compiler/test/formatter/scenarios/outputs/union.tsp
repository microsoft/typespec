union Foo<x, y> {
  x: int32,
}

union Constrained extends Base {
  a: A,
  b: B,
}

union Empty extends Base {
  // dangling
}
