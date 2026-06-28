---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix XML deserialization regression where a downstream customization that subclassed a generated Model and re-annotated a nested Model field with a strict subclass would cause the generated parent class's `_init_from_xml` to call `CustomModel(<ET.Element>)` directly and raise. The precomputed XML field plan no longer hard-codes the Model class as the deserializer, deferring to the generic `_deserialize` path that tolerates such customizations.
