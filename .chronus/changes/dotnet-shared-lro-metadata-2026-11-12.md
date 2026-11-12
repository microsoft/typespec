---
changeKind: internal
packages:
  - "@typespec/http-client-csharp"
---

Preserve TCGC `@lroStatusMetadata` selections, typed `propertySegments`, and ordered `@lroOperationId` sources in the shared .NET input model for Azure generator consumption. Existing generated clients remain unchanged when this metadata is absent.
