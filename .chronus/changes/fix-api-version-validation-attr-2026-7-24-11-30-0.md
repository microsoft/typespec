---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix the generated `_validation.py` `@api_version_validation` decorator so it reads the correct client config attribute for the API version. Previously it hardcoded `client._config.api_version`, but the config attribute name comes from the API-version parameter's `client_name`. For specs that name the versioning parameter something other than `apiVersion` (e.g. Azure Storage's `@apiVersion @header("x-ms-version") version: string`, which produces `self.version`), the hardcoded lookup raised `AttributeError` that the decorator silently swallowed, disabling all API-version validation for those clients. The emitter now threads the real attribute name into the decorator via a `client_api_version_name` kwarg (emitted only when it differs from the default `api_version`).
