# HeadAsBooleanTrue
### AutoRest Configuration
> see https://aka.ms/autorest

``` yaml
title: HeadAsBooleanTrue
require: $(this-folder)/../../../../readme.md
input-file: https://github.com/Azure/autorest.testserver/blob/master/swagger/head.json
namespace: Azure.HeadAsBooleanTrue
security: AzureKey
security-header-name: Fake-Subscription-Key
head-as-boolean: true
```
