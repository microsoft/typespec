# MgmtNoTypeReplacement

This is the test/sample project for configuration to skip type replacement.

### AutoRest Configuration
> see https://aka.ms/autorest

``` yaml
title: MgmtNoTypeReplacement
require: $(this-folder)/../../../readme.md
azure-arm: true
model-namespace: false
input-file: $(this-folder)/MgmtNoTypeReplacement.json
namespace: MgmtNoTypeReplacement
clean-output-folder: true

# declare no type replacement for properties
no-property-type-replacement: NoSubResourceModel;NoSubResourceModel2
```
