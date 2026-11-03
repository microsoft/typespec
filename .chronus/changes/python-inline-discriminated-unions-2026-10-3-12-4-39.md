---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix transitive discriminator dispatch and TypedDict generation when a derived model narrows an inherited discriminator to a literal.
