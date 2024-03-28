# AutoRest.CSharp
> see https://aka.ms/autorest

## Configuration
```yaml
use-extension:
  "@autorest/modelerfour": "4.26.0"
modelerfour:
  always-create-content-type-parameter: true
pipeline:
  csharpgen:
    input: modelerfour/identity
  csharpgen/emitter:
    input: csharpgen
    scope: output-scope
output-scope:
  output-artifact: source-file-csharp
shared-source-folders: $(this-folder)/Generator.Shared;$(this-folder)/Azure.Core.Shared
```

```yaml $(generation1-convenience-client) || $(azure-arm)
modelerfour:
  flatten-models: true
  flatten-payloads: true
  group-parameters: true
```

```yaml $(sample-gen)
use-extension:
  "@autorest/testmodeler": "2.6.1"

pipeline:
  test-modeler:
    input: modelerfour/identity
    scope : output-scope
  test-modeler/identity:
    input: test-modeler
  csharpgen:
    input: test-modeler/identity

modelerfour:
  emit-yaml-tags: true

testmodeler:
  use-parents-value: true
  split-parents-value: false
  add-armtemplate-payload-string: true

include-x-ms-examples-original-file: true
#   export-explicit-type: true
```

## Customization

```yaml
directive:
  - from: swagger-document
    where: $.definitions.PrivateEndpointConnectionProperties
    transform: >
      $.properties.privateLinkServiceConnectionState["x-ms-client-name"] = "connectionState";   
```

## Help
```yaml
help-content:
  csharp: # type: Help as defined in autorest-core/help.ts
    activationScope: csharp
    categoryFriendlyName: C# Generator
    settings:
    - key: library-name
      description: The name of your library. This is what will be displayed on NuGet.
      type: string
    - key: shared-source-folders
      description: Pass shared folder paths through here. Common values point to the shared generator assets and shared azure core assets in autorest.csharp
      type: string
    - key: public-clients
      description: Whether to generate public client. Defaults to `false`.
      type: bool
    - key: model-namespace
      description: Whether to add a separate namespace of Models, more specifically adding `{value-from-namespace-flag}.Models`. Defaults to `true`.
      type: bool
```
