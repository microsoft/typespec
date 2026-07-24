---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix the generated `_validation.py` `@api_version_validation` decorator so it reads the correct client config attribute for the API version. It previously hardcoded `client._config.api_version`, but the attribute name is derived from the API-version parameter's `client_name`. For specs that name the versioning parameter something other than `apiVersion` (e.g. `self.version`), the lookup raised `AttributeError` that the decorator silently swallowed, disabling all API-version validation for those clients. The emitter now passes the real attribute name to the decorator via a `client_api_version_name` kwarg.
