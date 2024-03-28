# PublicClientCtor
### AutoRest Configuration
> see https://aka.ms/autorest

``` yaml
title: PublicClientCtor
generation1-convenience-client: true
require: $(this-folder)/../../../readme.md
input-file: $(this-folder)/PublicClientCtor.json
namespace: Azure.PublicClientCtor
security: [AzureKey, AADToken]
security-header-name: fake-key
security-scopes:
  - "https://fakeendpoint.azure.com/.default"
  - "https://dummyendpoint.azure.com/.default"
```
