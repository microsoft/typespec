# MultipleInputFiles
### AutoRest Configuration
> see https://aka.ms/autorest

``` yaml
title: MultipleInputFiles
generation1-convenience-client: true
sync-methods: None
require: $(this-folder)/../../../readme.md
openapi-type: data-plane
tag: 2.0-preview
input-file:
  - $(this-folder)/input1.json
  - $(this-folder)/input2.json
```
