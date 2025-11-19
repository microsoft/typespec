# Debug Manifest URL Feature

## Overview

The dashboard now supports loading manifests from arbitrary URLs for debugging and testing purposes.

## Usage

### URL Parameter
Add `?debugManifest=<URL>` to the dashboard URL:
```
https://typespec.io/can-i-use/http?debugManifest=https://example.com/manifest.json
```

When debug mode is active, an informational banner will appear at the top of the dashboard showing the custom manifest URL being used.

## Example Debug Manifest

```json
{
  "packageName": "my-test-package",
  "scenarios": [
    {
      "name": "Authentication.ApiKey.Header.basic",
      "uri": "https://example.com/docs",
      "description": "Basic API key authentication via header"
    },
    {
      "name": "Type.Array.BooleanValue.get",
      "uri": "https://example.com/docs/arrays",
      "description": "Getting arrays with boolean values"
    }
  ]
}
```

## Features

- **Error Handling**: Clear error messages if the manifest URL is invalid or unreachable
- **URL Parameter Detection**: Automatically detects debug manifest URL from query parameters
- **Format Support**: Supports both single manifest objects and arrays of manifests
- **Loading States**: Visual feedback during manifest loading
- **Debug Indication**: Info banner shows when debug mode is active

## Implementation Details

- Uses `fetch()` API to load manifests from arbitrary URLs
- Maintains backward compatibility with existing Azure Storage functionality
- Preserves existing options like emitter filtering and table definitions
- Integrates seamlessly with existing tier filtering functionality