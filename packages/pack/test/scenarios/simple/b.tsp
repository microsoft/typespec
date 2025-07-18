import "@typespec/compiler";

namespace MyService.Other;

model Bar {
  b: string;
}

namespace Clean {
  model Baz {
    c: string;
  }
}
