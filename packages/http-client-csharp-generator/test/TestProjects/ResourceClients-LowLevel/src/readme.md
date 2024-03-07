# TenantOnly
### AutoRest Configuration
> see https://aka.ms/autorest

``` yaml
require: $(this-folder)/../../../../readme.md
input-file: $(this-folder)/ResourceClients-LowLevel.json
security: AzureKey
security-header-name: Fake-Subscription-Key
```
