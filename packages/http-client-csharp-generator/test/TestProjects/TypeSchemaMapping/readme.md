# TypeSchemaMapping

## AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
require: $(this-folder)/../../../readme.md
generation1-convenience-client: true
input-file: $(this-folder)/TypeSchemaMapping.json
namespace: TypeSchemaMapping
output-folder: $(this-folder)/SomeFolder/Generated
skip-csproj: true
# relative path to output-folder also works
project-folder: ../../

use-model-reader-writer: true
```
