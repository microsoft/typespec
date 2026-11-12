namespace DirectSyntax;

// No decorators or library imports anywhere in this sample.
enum Versions {
  v1,
  v2,
}

enum Visibility {
  read,
  create,
  update,
}

// A named union avoids duplicate declarations. Its variants are filtered
// per scope: int32 in v1, string in v2, both in the base graph.
union Value {
  legacy: int32 when Versions.v1,
  current: string when Versions.v2,
}

model Widget {
  id: string when Visibility.read;
  secret: string when Visibility.create | Visibility.update;
  value: Value;
  state: ServerState when Versions.v2 & Visibility.read;
}

model ServerState when Versions.v2 & Visibility.read {
  generation: int32;
}

interface Widgets {
  get(): Widget when Visibility.read;
  create(input: Widget): Widget when Visibility.create;
  update(input: Widget): Widget when Visibility.update;
}

// Select Widget, Value, ServerState or Widgets in the explorer.
// The shape preview expands Value so the effective property type is visible.
// Ordinary enum versions are not ordered: use explicit conditions here,
// not since()/before(), which need a registered ordered version axis.
