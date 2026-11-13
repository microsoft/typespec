@service
namespace DirectFacets;

// These are ordinary enums, not @versioned or @visibility classes.
enum Versions {
  v1,
  v2,
}

enum Views {
  read,
  write,
}

// Try Versions=v1/v2 and Views=read/write in the Scope explorer.
// Facets change a property in-place, without duplicate declarations.
@Scopes.name("LegacyWidget") when Versions.v1
model Widget {
  id: string when Views.read;
  secret: string when Views.write;

  @Scopes.type(int32) when Versions.v1
  @Scopes.optional(true) when Views.write
  value: string;

  settings: Settings when Versions.v2;
}

model Settings when Versions.v2 {
  enabled: boolean;
}

@Scopes.returnType(string) when Versions.v1
op getWidget(): Widget;

// The base still has value: string, both id and secret, and settings.
// No legacy versioning/visibility decorators or library adapters are involved.
