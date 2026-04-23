---
changeKind: feature
packages:
  - "@typespec/http-specs"
---

Add `SameBodySingleOperation` content-negotiation scenario with a single operation `op getAvatar(@path format: string): PngImage | JpegImage` that returns PNG for `format=png`