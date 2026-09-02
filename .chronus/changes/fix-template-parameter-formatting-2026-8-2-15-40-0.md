---
changeKind: fix
packages:
  - "@typespec/compiler"
---

[formatter] Split the template parameter list instead of the last parameter constraint or default when the declaration is too long

```tsp
// Before
op deleteJobPreview<AreaPreviewLabel extends
  | FoundryFeaturesOptInKeys
  | AgentDefinitionOptInKeys> is FoundryDataPlanePreviewOperation<AreaPreviewLabel>;

// After
op deleteJobPreview<
  AreaPreviewLabel extends FoundryFeaturesOptInKeys | AgentDefinitionOptInKeys
> is FoundryDataPlanePreviewOperation<AreaPreviewLabel>;
```
