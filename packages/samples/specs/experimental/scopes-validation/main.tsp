enum Clients {
  csharp,
  python,
}

model Private when Clients.csharp {
  value: string;
}

scalar CsharpId when Clients.csharp extends string;

enum Features {
  shared,
  dotnet when Clients.csharp,
}

union Payload {
  text: string,
  dotnet: Private when Clients.csharp,
}

interface Api {
  common(): string;
  dotnet(id: CsharpId): Private when Clients.csharp;
}

model Wrapper<T> {
  value: T;
}

model Valid {
  details: Wrapper<Private> when Clients.csharp;
}

// Uncomment: this is invalid in python even if csharp is selected in the viewer.
// model Invalid { details: Private; }

// Uncomment: the unconditioned graph satisfies this constraint, but python does not.
// model Required { id: string; }
// model Value { id: string when Clients.csharp; }
// model Box<T extends Required> { value: T; }
// model InvalidTemplate { box: Box<Value>; }

auto dec label(target: unknown, value: valueof string);

// Uncomment both: these overlap, but neither is more specific.
// @label("Csharp") when Clients.csharp
// @label("Read") when Lifecycle.Read
model Ambiguous {}

// Readonly decorator arguments are checked even if their scope is never selected.
// @label(123) when Clients.python
// model InvalidArgument {}
