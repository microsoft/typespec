# Changelog - @typespec/http-client-java

## 0.8.1

### Bug Fixes

- [#10365](https://github.com/microsoft/typespec/pull/10365) Report an error when `clientRequired` is set to `false` on a property.


## 0.8.0

### Features

- [#9926](https://github.com/microsoft/typespec/pull/9926) Support `DurationKnownEncoding.milliseconds` in http-client-java. Duration properties encoded as milliseconds now use `Duration` as the client type, with proper conversion to/from integer or float milliseconds on the wire.
- [#9725](https://github.com/microsoft/typespec/pull/9725) Support apiVersions in metadata.json file.
- [#9844](https://github.com/microsoft/typespec/pull/9844) Add a warning when emitter does not spread for json-merge-patch payload.
- [#10337](https://github.com/microsoft/typespec/pull/10337) Add clientRequired clientOption for Java emitter

### Bug Fixes

- [#9784](https://github.com/microsoft/typespec/pull/9784) Fix bug on alternateType apply to enum/union.
- [#10131](https://github.com/microsoft/typespec/pull/10131) access=public should override Paged
- [#10017](https://github.com/microsoft/typespec/pull/10017) Fix result segments like "value" not found if defined in parent model.
- [#10338](https://github.com/microsoft/typespec/pull/10338) Fix bug that singular form of "Caches" is incorrect
- [#10262](https://github.com/microsoft/typespec/pull/10262) Ignore error in JSON example, if the format is incorrect.
- [#9963](https://github.com/microsoft/typespec/pull/9963) Improve handling of plural to singular convert.
- [#9993](https://github.com/microsoft/typespec/pull/9993) Allow text/plain content-type on Enum
- [#10209](https://github.com/microsoft/typespec/pull/10209) Fix bug on XML array with isXmlWrapper=true
- [#10080](https://github.com/microsoft/typespec/pull/10080) Fix discriminator property not generated when model has @discriminator but no known subtypes
- [#9845](https://github.com/microsoft/typespec/pull/9845) mgmt, use separate entry points for premium samples
- [#9751](https://github.com/microsoft/typespec/pull/9751) Use `LinkedHashMap` and `LinkedHashSet` to ensure consistent iterating order.


## 0.7.0

### Features

- [#9530](https://github.com/microsoft/typespec/pull/9530) Support File from TypeSpec.
- [#9602](https://github.com/microsoft/typespec/pull/9602) Support File in multipart and request body.

### Bump dependencies

- [#9698](https://github.com/microsoft/typespec/pull/9698) Update @azure-tools/typespec-client-generator-core to 0.65.1
- [#9447](https://github.com/microsoft/typespec/pull/9447) Upgrade TCGC
- [#9677](https://github.com/microsoft/typespec/pull/9677) Update Node.js dependencies to latest versions
- [#9591](https://github.com/microsoft/typespec/pull/9591) Update @azure-tools/typespec-client-generator-core to 0.64.6 and @microsoft/api-extractor to 7.56.2
- [#9472](https://github.com/microsoft/typespec/pull/9472) Update @azure-tools/typespec-client-generator-core to 0.64.4

### Bug Fixes

- [#9677](https://github.com/microsoft/typespec/pull/9677) Fix incorrect variable name of continuationToken
- [#9527](https://github.com/microsoft/typespec/pull/9527) Missing example value for BinaryData type in mock test.
- [#9639](https://github.com/microsoft/typespec/pull/9639) Fix mock data for BinaryData.
- [#9751](https://github.com/microsoft/typespec/pull/9751) Use `LinkedHashMap` and `LinkedHashSet` to ensure consistent
  iterating order.
