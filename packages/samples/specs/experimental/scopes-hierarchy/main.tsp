enum AzureScopes {
  csharp,

  @Scopes.parent(AzureScopes.csharp)
  management,

  @Scopes.parent(AzureScopes.management)
  provisioning,

  python,
}

auto dec clientName(target: unknown, name: valueof string);

// Source order does not decide which value wins. The narrower scope wins.
// In the base view this decorator has no value at all.
@clientName("ProvisioningWidget") when AzureScopes.provisioning
@clientName("ManagementWidget") when AzureScopes.management
@clientName("CsharpWidget") when AzureScopes.csharp
@clientName("PythonWidget") when AzureScopes.python
model Widget {
  @Scopes.type(int32) when AzureScopes.csharp
  @Scopes.optional(true) when AzureScopes.python
  name: string;
}

// An explicit unscoped application provides a fallback, independently.
@clientName("SharedOptions")
@clientName("CsharpOptions") when AzureScopes.csharp
model Options {
  enabled: boolean;
}

model DotnetOptions when AzureScopes.csharp {
  assembly: string;
}

model Configuration {
  dotnet: DotnetOptions when AzureScopes.csharp;
}
