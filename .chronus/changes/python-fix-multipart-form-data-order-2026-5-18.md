---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Generated `prepare_multipart_form_data` now serializes multipart fields in the
order declared in the TypeSpec model, instead of emitting all file parts
before all data parts. The previous behavior could break streaming server-side
multipart parsers that require small JSON metadata parts to precede large
binary file parts (per RFC 7578 §5.2), and it did not match the order
documented in Spector multipart scenarios.

This is observable on the wire for services whose TypeSpec model declares data
fields before file fields — that order is now preserved.

```python
# previously emitted call:
_files = prepare_multipart_form_data(_body, _file_fields, _data_fields)

# now emitted call (single ordered list of (wire_name, is_file) tuples):
_files = prepare_multipart_form_data(_body, _fields)
```
