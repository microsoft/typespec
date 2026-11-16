import "@typespec/http";
using Http;

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

op ReadV1<T>(@query id: string): T;
op ReadV2<T>(@query id: string, @query expand?: boolean): T;

// v1 uses ReadV1, while the declared ReadV2 signature remains the default.
// Operation-level decorators are not replaced with the selected signature.
@get
@Scopes.signature(ReadV1<Widget>) when Versions.v1
@Scopes.returnType(string) when Versions.v1
op getWidget is ReadV2<Widget>;

// The base still has value: string, both id and secret, and settings.
// No legacy versioning/visibility decorators or library adapters are involved.
