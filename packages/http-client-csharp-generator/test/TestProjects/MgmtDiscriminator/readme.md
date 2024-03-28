# MgmtDiscriminator

### AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
azure-arm: true
require: $(this-folder)/../../../readme.md
input-file: $(this-folder)/MgmtDiscriminator.json
namespace: MgmtDiscriminator
model-namespace: false
public-clients: false
head-as-boolean: false
use-model-reader-writer: true
enable-bicep-serialization: true
suppress-abstract-base-class:
  DeliveryRuleAction
```
