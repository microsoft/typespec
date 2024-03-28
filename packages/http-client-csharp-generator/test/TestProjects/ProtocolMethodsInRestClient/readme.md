# Test Service

### AutoRest Configuration

> see https://aka.ms/autorest

```yaml
generation1-convenience-client: true
require: $(this-folder)/../../../readme.md
input-file: $(this-folder)\ProtocolMethodsInRestClient.json
security: AzureKey
security-header-name: Fake-Subscription-Key 
protocol-method-list:
  - Create
  - Delete
  - firstTemplate_Create
  - firstTemplate_Get
  - secondTemplate_Get
```
