# MgmtSafeFlatten

## AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
azure-arm: true
require: $(this-folder)/../../../readme.md
input-file: $(this-folder)/MgmtSafeFlatten.json
namespace: MgmtSafeFlatten
# the remover will remove this since this is not internally used or a reference type if we do not have this configuration
keep-orphaned-models:
- LayerOneProperties
- TypeFour
```
