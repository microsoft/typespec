import "@typespec/versioning";
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

  @added(Versions.v2)
  settings: DotnetSettings when Clients.csharp;
}

@added(Versions.v2)
model DotnetSettings when Clients.csharp {
  assembly: string;
}

// The base view retains all versions and visibilities, but no scoped clientName.
// Every concrete combination is validated before selecting one in the viewer.
// In the Scope explorer, compare Versions=v1/v2 and Lifecycle=Read/Create.
// Widget changes from required oldValue: int32 to optional value?: string.
// Read keeps id; Create keeps secret. Provisioning inherits C# metadata in v1
// and overrides it in v2. These are the real versioning/visibility adapters.
op getWidget(): Widget;
