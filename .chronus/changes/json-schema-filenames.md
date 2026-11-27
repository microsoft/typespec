---
changeKind: feature
packages:
  - "@typespec/json-schema"
---

Support a `file-name` template for schema filenames, including `.schema.json` and `.schema.yaml`. Implicit schema ids and references follow the configured filenames.

Directory paths are not allowed in the template; use `emitter-output-dir` to configure the output directory.
Templates resolving to empty names or directory markers are rejected, and output filename collisions are reported as errors instead of overwriting schemas.

```yaml
options:
  "@typespec/json-schema":
    file-type: json
    file-name: "{name}.schema.{ext}"
```
