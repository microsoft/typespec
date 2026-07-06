---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix Python SDK generation failure when `package-pprint-name` contains spaces. The shell-escaping quotes were baked into the option value and leaked into the Pyodide runtime, producing an invalid `setup.py` (e.g. `PACKAGE_PPRINT_NAME = ""Azure Web PubSub Chat Service""`) that `black` could not parse. Quoting is now applied only when building the native Python shell command.
