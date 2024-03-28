# MgmtListMethods

## AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
azure-arm: true
require: $(this-folder)/../../../readme.md
input-file: $(this-folder)/mgmtListMethods.json
namespace: MgmtListMethods

override-operation-name:
  FakeParentWithAncestorWithNonResChWithLocs_ListBySubscription: GetFakeParentWithAncestorWithNonResourceChWithLoc
```
