---
changeKind: feature
packages:
  - "@typespec/http-client-csharp"
---

Auto-generate `ConfigurationSchema.json` when a client library has a `ClientSettings` class, providing JSON IntelliSense for `appsettings.json`. The schema includes well-known client names under `Clients` (SCM) or `AzureClients` (Azure) sections, with `$ref` to shared credential/options definitions.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "Clients": {
      "type": "object",
      "properties": {
        "MyClient": {
          "type": "object",
          "properties": {
            "Endpoint": { "type": "string", "format": "uri" },
            "Credential": { "$ref": "#/definitions/credential" },
            "Options": { "$ref": "#/definitions/options" }
          }
        }
      }
    }
  }
}
```
