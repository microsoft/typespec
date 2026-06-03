---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Synthesize filename in multipart Content-Disposition for bare file inputs. When callers pass bare bytes/str/IO instead of a (filename, content) tuple for multipart file fields, the `prepare_multipart_form_data` helper now wraps them with a synthesized filename so servers that require `filename=` in the Content-Disposition header no longer reject the upload.
