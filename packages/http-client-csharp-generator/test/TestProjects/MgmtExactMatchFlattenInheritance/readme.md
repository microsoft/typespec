# MgmtExactMatchFlattenInheritance

This project is for testing flatten properties.

## AutoRest Configuration
> see https://aka.ms/autorest

``` yaml
title: MgmtExactMatchFlattenInheritance
require: $(this-folder)/../../../readme.md
azure-arm: true
model-namespace: false
input-file: $(this-folder)/MgmtExactMatchFlattenInheritance.json
namespace: MgmtExactMatchFlattenInheritance

# need the following to trigger flattening
payload-flattening-threshold: 2
```
