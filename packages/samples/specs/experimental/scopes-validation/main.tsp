enum Clients {
  csharp,
  python,
}

enum Stages {
  preview,
  stable,
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

// Uncomment: Private is absent in the default view and in python.
// model Invalid { details: Private; }

// Uncomment: the default type satisfies this constraint, but python does not.
// model Required { id: string; }
// model Value {
//   @Scopes.type(int32) when Clients.python
//   id: string;
// }
// model Box<T extends Required> { value: T; }
// model InvalidTemplate { box: Box<Value>; }

// Uncomment: the default value is invalid when python changes the property type.
// model InvalidDefault {
//   @Scopes.type(int32) when Clients.python
//   id: string = "hello";
// }

auto dec label(target: unknown, value: valueof string);

// Uncomment both: these overlap, but neither is more specific.
// @label("Csharp") when Clients.csharp
// @label("Preview") when Stages.preview
model Ambiguous {}

// Readonly decorator arguments are checked even if their scope is never selected.
// @label(123) when Clients.python
// model InvalidArgument {}
