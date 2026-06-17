---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Forward the discriminator value to the base constructor when a discriminated base model is marked as an external type. External base models now map to a model provider so derived types emit the correct `: base("<discriminator>")` call and the external base itself is not generated.
