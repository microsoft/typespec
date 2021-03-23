# Change Log - @azure-tools/adl

This log was last generated on Tue, 23 Mar 2021 01:06:29 GMT and should not be manually modified.

## 0.5.0
Tue, 23 Mar 2021 01:06:29 GMT

### Minor changes

- Add `time` intrinsic type
- Rename all date and time intrinsics: zonedDateTime, plainDate, and plainTime
- Add commands to install/uninstall VS Code extension

### Patches

- Automatically mark named enum types with `x-ms-enum` and `modelAsString: true`

## 0.4.0
Tue, 16 Mar 2021 23:13:42 GMT

### Minor changes

- Introduce language server and add live parse errors to VS Code

## 0.3.0
Thu, 11 Mar 2021 19:14:29 GMT

### Minor changes

- Add byte primitive type
- Add datetime primitive type
- Enable HTTP verb decorators to specify a subpath from the parent resource path
- Add float32 primitive type
- Replace `interface` syntax with `namespace` and `op` syntax
- Add new decorator @tags
- Add support for nested namespace definitions and scopes
- Add null intrinsic type, allow unions with it for x-nullable support in OpenAPI emitter
- Add response model types for many standard HTTP responses in rest.adl
- Renamed Ok<T> to OkResponse<T>
- Add syntax highlighting

### Patches

- Fix model Foo<T> extends T { }
- Fix resolution of declared parameters in resource sub-paths
- Always output a response description field to ensure valid swagger
- Added new gRPC to ADL examples
- Add back line and column tracking
- Support arrays of arrays and parenthesized expressions
- Remove hardcoded @autorest/core version
- Include source file path in parse error log
- Add body-boolean testserver sample
- Fix bug preventing empty string literals
- Refactor scanner to use less state
- Log source locations with all errors
- Support multiple content types for request bodies

## 0.2.1
Thu, 28 Jan 2021 21:30:01 GMT

### Patches

- Fixed standard library decorator module resolution

## 0.2.0
Wed, 27 Jan 2021 21:48:34 GMT

### Minor changes

- Initial ADL compiler preview release

