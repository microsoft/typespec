# Accessibility

### AutoRest Configuration

> see https://aka.ms/autorest

```yaml
require: $(this-folder)/../../../../readme.md
input-file: $(this-folder)/../../Accessibility-LowLevel/src/Accessibility-LowLevel.json
security: AADToken
security-header-name: Your-Subscription-Key
security-scopes: https://test.azure.com/.default
library-name: AccessibilityTokenAuth
```
