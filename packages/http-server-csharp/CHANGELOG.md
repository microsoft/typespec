# Change Log - @typespec/http-server-csharp

## 0.58.0-alpha.13

### Features

- [#6600](https://github.com/microsoft/typespec/pull/6600) This feature introduces changes to how error models (those using the `@error` decorator) are handled. Error models will now be represented as classes that extend exceptions, and when one of these custom-defined exceptions is thrown, it will produce HTTP errors as a result.
  
  The handling of the returned status code will be resolved in the following ways:
  
  #### If `@statusCode` is defined, the value of the `@statusCode` property will be returned
  In this case, 404 will be returned:
  ```tsp
  @error
  model NotFoundError{
    @statusCode _: 404
  }
  ```
  
  ### If `@statusCode` is not defined, the error `400` will be assigned by default
  In this case, 400 will be returned:
  ```tsp
  @error
  model NotFoundError{
    statusCode: string;
  }
  ```
  
  ### If `@min` and `@max` are defined instead of a specific value, the `@min` value will be returned
  In this case, 500 will be returned:
  
  ```tsp
  model Standard5XXResponse {
    @minValue(500)
    @maxValue(599)
    @statusCode
    statusCode: int32;
  }
  ```
  
  ### If `@statusCode` is defined as a union, the resulting model constructor will require a status code
  In this case, when the model is generated, it will require a status code to be provided:
  ```tsp
  model Standard4XXResponse {
    @statusCode
    statusCode: 400 | 402;
  }
  
  ```
  As a result, the status code must be passed when creating an instance of the model:
  ```csharp 
  throw new Standard4XXResponse(400);
  ```

### Bump dependencies

- [#6595](https://github.com/microsoft/typespec/pull/6595) Upgrade dependencies

### Bug Fixes

- [#6701](https://github.com/microsoft/typespec/pull/6701) Write scaffolding and project files in output dir and fix issues with some attribute application
- [#6710](https://github.com/microsoft/typespec/pull/6710) Updates to scaffolding script and scaffold commands for consistency
- [#6767](https://github.com/microsoft/typespec/pull/6767) Fix default status code and overridden properties
- [#6766](https://github.com/microsoft/typespec/pull/6766) Fix issue with trace parsing on some platforms
- [#6799](https://github.com/microsoft/typespec/pull/6799) Fix numeric enum support


## 0.58.0-alpha.12

### Features

- [#6507](https://github.com/microsoft/typespec/pull/6507) Scaffolding updates for rc

## 0.58.0-alpha.11

### Breaking Changes

- [#5977](https://github.com/microsoft/typespec/pull/5977) Minimum node version is now 20

### Features

- [#6327](https://github.com/microsoft/typespec/pull/6327) Remove reference to delete projection feature

### Bump dependencies

- [#6266](https://github.com/microsoft/typespec/pull/6266) Update dependencies

### Bug Fixes

- [#6267](https://github.com/microsoft/typespec/pull/6267) Fix the generation of long and multiline comments.
- [#6443](https://github.com/microsoft/typespec/pull/6443) Fix handling of record types
- [#6411](https://github.com/microsoft/typespec/pull/6411) Add support for new `dryRun` emitter option

## 0.58.0-alpha.10

### Bug Fixes

- [#6177](https://github.com/microsoft/typespec/pull/6177) Fix issues with sample mock tests
- [#5952](https://github.com/microsoft/typespec/pull/5952) Fixes to enums, operation signatures

## 0.58.0-alpha.9

No changes, version bump only.

## 0.58.0-alpha.8

### Bug Fixes

- [#5626](https://github.com/microsoft/typespec/pull/5626) Fixes controller generation with incorrect return when NoContent is in the spec
- [#5733](https://github.com/microsoft/typespec/pull/5733) Add scaffolding option for csharp generator

### Bump dependencies

- [#5690](https://github.com/microsoft/typespec/pull/5690) Upgrade dependencies

## 0.58.0-alpha.7

### Bug Fixes

- [#5505](https://github.com/microsoft/typespec/pull/5505) [http-server-csharp]: Fix routing issues with MFD requests
- [#5417](https://github.com/microsoft/typespec/pull/5417) Handle multipart operations in c-sharp service emitter

## 0.58.0-alpha.6

### Bug Fixes

- [#5140](https://github.com/microsoft/typespec/pull/5140) Fix #4308 Process sub-namespace of a service in csharp service emitter
  Fix #4998 Generator throws on void return type
  Fix #5000 Tuple types are not properly generated
  Fix #5001 OkResponse is generated as a model
  Fix #5024 Literal type is not properly generated
  Fix #5124 Templated model reported error while generating
  Fix #5125 No interfaces and controllers are generated for ops in a namespace
- [#5279](https://github.com/microsoft/typespec/pull/5279) Fix nullable types, anonymous types, and safeInt

## 0.58.0-alpha.5

### Bump dependencies

- [#4679](https://github.com/microsoft/typespec/pull/4679) Upgrade dependencies - October 2024

## 0.58.0-alpha.4

### Bump dependencies

- [#4424](https://github.com/microsoft/typespec/pull/4424) Bump dependencies

## 0.58.0-alpha.3

No changes, version bump only.

## 0.58.0-alpha.2

No changes, version bump only.
