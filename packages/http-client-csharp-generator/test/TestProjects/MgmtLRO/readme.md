# MgmtLRO

## AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
azure-arm: true
require: $(this-folder)/../../../readme.md
input-file: $(this-folder)/mgmtLRO.json
namespace: MgmtLRO

operations-to-skip-lro-api-version-override:
- Fakes_CreateOrUpdate

operations-to-lro-api-version-override:
  Fakes_Update: "2021-06-01"
```
