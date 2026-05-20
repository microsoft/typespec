---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Update the baseline source for regeneration to use the `typespec-python-generated-tests` branch and `eng/tools/azure-sdk-tools/emitter/generated` path in `azure-sdk-for-python`, and enable `core.longpaths` on the temporary baseline clone to avoid Windows `MAX_PATH` errors during checkout.
