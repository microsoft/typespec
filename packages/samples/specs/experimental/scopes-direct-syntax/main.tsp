namespace DirectSyntax;

// No decorators or library imports anywhere in this sample.
enum Versions {
  v1,
  v2,
}

// A plain enum used as a scope axis. Real visibility stays a projection.
enum Operations {
  read,
  create,
  update,
}

// A named union avoids duplicate declarations. Its variants are filtered
// per scope: int32 in v1, string in v2, and none in the default view.
// Prefer @Scopes.type when a declared default is needed.
union Value {
  legacy: int32 when Versions.v1,
  current: string when Versions.v2,
}

model Widget {
  id: string when Operations.read;
  secret: string when Operations.create | Operations.update;
  value: Value;
  state: ServerState when Versions.v2 & Operations.read;
}

model ServerState when Versions.v2 & Operations.read {
  generation: int32;
}

interface Widgets {
  get(): Widget when Operations.read;
  create(input: Widget): Widget when Operations.create;
  update(input: Widget): Widget when Operations.update;
}

// Select Widget, Value, ServerState or Widgets in the explorer.
// The shape preview expands Value so the effective property type is visible.
// Ordinary enum versions are not ordered: use explicit conditions here,
// not since()/before(), which need a registered ordered version axis.
