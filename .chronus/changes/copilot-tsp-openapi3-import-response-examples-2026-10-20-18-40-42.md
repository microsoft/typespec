---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

[converter] Import response media type examples as operation return examples, preserving response status, media type, named keys, and descriptions. Named keys become decorator titles (and emitted summaries), so distinct source summaries cannot currently be retained. Conflicting example/examples fields are diagnosed and skipped. Unsupported values, required headers without values, status ranges, stream/item examples, and media types absent from generated component response models are diagnosed without discarding other valid examples.