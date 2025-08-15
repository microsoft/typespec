# Changelog - @typespec/emitter-framework

## 0.10.0

### Bump dependencies

- [#8050](https://github.com/microsoft/typespec/pull/8050) Upgrade alloy 0.19
- [#7978](https://github.com/microsoft/typespec/pull/7978) Upgrade dependencies


## 0.9.0

### Features

- [#7566](https://github.com/microsoft/typespec/pull/7566) Add csharp support: class, enum
- [#7815](https://github.com/microsoft/typespec/pull/7815) Migrate the scenario tester to use the new tester framework(Remove explicit relation with http/rest libraries in scenario framework)
- [#7655](https://github.com/microsoft/typespec/pull/7655) [C#] Add support for JsonPropertyName attributes on properties
- [#7655](https://github.com/microsoft/typespec/pull/7655) [C#] Add support for nullable properties

### Bump dependencies

- [#7655](https://github.com/microsoft/typespec/pull/7655) Upgrade to alloy 0.18.0

### Bug Fixes

- [#7650](https://github.com/microsoft/typespec/pull/7650) Adds subpath export for csharp emitter-framework components


## 0.8.0

### Features

- [#7409](https://github.com/microsoft/typespec/pull/7409) Emit TypeSpec comments as JSDoc in TypeScript components

### Bump dependencies

- [#7605](https://github.com/microsoft/typespec/pull/7605) Updates alloy to 0.17

### Bug Fixes

- [#7369](https://github.com/microsoft/typespec/pull/7369) Render discriminated unions correctly


## 0.7.1

### Bump dependencies

- [#7363](https://github.com/microsoft/typespec/pull/7363) Upgrade alloy 16

### Bug Fixes

- [#7321](https://github.com/microsoft/typespec/pull/7321) Use wasm version of tree sitter for snippet extractor


## 0.7.0

### Bump dependencies

- [#7186](https://github.com/microsoft/typespec/pull/7186) Upgrade to alloy 15


## 0.6.0

### Features

- [#7017](https://github.com/microsoft/typespec/pull/7017) [TypeScript] Add various function-related components - FunctionType, FunctionExpression, ArrowFunction, and InterfaceMethod.
- [#6972](https://github.com/microsoft/typespec/pull/6972) Add support for rendering a Value Expression
- [#7018](https://github.com/microsoft/typespec/pull/7018) Adds the `TspContextProvider` and `useTsp()` hook for providing and accessing TypeSpec context and the Typekit APIs (e.g. `# Changelog - @typespec/emitter-framework). Adds a new `Output` component that accepts a TypeSpec `Program` and automatically wraps children components with the `TspContextProvider`.

### Bump dependencies

- [#7017](https://github.com/microsoft/typespec/pull/7017) Alloy 0.11

### Bug Fixes

- [#6951](https://github.com/microsoft/typespec/pull/6951) InterfaceMember should use Alloy


## 0.5.0

### Features

- [#6875](https://github.com/microsoft/typespec/pull/6875) Upgrade to alloy 0.10.0


## 0.4.0

### Bump dependencies

- [#6595](https://github.com/microsoft/typespec/pull/6595) Upgrade dependencies


## 0.3.0

### Bump dependencies

- [#6266](https://github.com/microsoft/typespec/pull/6266) Update dependencies

### Bug Fixes

- [#6178](https://github.com/microsoft/typespec/pull/6178) Improvements on the TestHarness
- [#6460](https://github.com/microsoft/typespec/pull/6460) Update dependency structure for EmitterFramework, HttpClient and JS Emitter




## 0.2.0

### Features

- [#5996](https://github.com/microsoft/typespec/pull/5996) Adding Emitter Framework and Http Client packages

