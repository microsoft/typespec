#### data-plane

```yaml
azure-arm: false

license-header: MICROSOFT_MIT_SMALL

generate-client-interfaces: false
generate-client-as-impl: true
generate-sync-async-clients: true
generate-builder-per-client: true
sync-methods: all
enable-sync-stack: true
required-fields-as-ctor-args: true
enable-page-size: true
use-key-credential: true

use-default-http-status-code-to-exception-type-mapping: true
polling: {}

models-subpackage: implementation.models
client-logger: true
```
