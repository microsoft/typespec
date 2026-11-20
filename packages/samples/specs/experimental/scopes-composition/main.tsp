import "@typespec/http";
import "@typespec/versioning";
using Http;
using Versioning;

@service
@versioned(Versions)
namespace Example;

enum Versions {
  v1,
  v2,
}

enum Clients {
  csharp,

  @Scopes.parent(Clients.csharp)
  provisioning,

  python,
}

auto dec clientName(target: unknown, name: valueof string);

model Preferences {
  enabled: boolean;
}

@clientName("CsharpWidget") when Clients.csharp
@clientName("ProvisioningWidget") when Clients.provisioning & since(Versions.v2)
@clientName("widget") when Clients.python
model Widget {
  @visibility(Lifecycle.Read)
  id: string;

  @visibility(Lifecycle.Create, Lifecycle.Update)
  secret: string;

  @renamedFrom(Versions.v2, "oldValue")
  @typeChangedFrom(Versions.v2, int32)
  @madeOptional(Versions.v2)
  value?: string;

  // The default is Preferences; v1 uses string without a renamed property.
  @Scopes.type(string) when before(Versions.v2)
  preferences: Preferences;

  @added(Versions.v2)
  settings: DotnetSettings when Clients.csharp;
}

@added(Versions.v2)
model DotnetSettings when Clients.csharp {
  assembly: string;
}

op ReadV1<T>(@query id: string): T;
op ReadV2<T>(@query id: string, @query expand?: boolean): T;

// The default view has every condition false: no clientName, no settings and
// no DotnetSettings. Every distinct view is compiled and checked on its own.
// In the Scope explorer, compare Versions=v1/v2 with each client.
// Widget changes from required oldValue: int32 to optional value?: string through
// the real versioning projection. Provisioning inherits C# metadata in v1 and
// overrides it in v2. v1 also uses a different property type and signature.
// Visibility stays a projection (@visibility), not a scope axis.
// Operation-level decorators (@get) still apply with the selected signature.
@get
@Scopes.signature(ReadV1<Widget>) when before(Versions.v2)
op getWidget is ReadV2<Widget>;
