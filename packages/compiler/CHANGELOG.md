# Change Log - @cadl-lang/compiler

This log was last generated on Fri, 09 Dec 2022 22:03:04 GMT and should not be manually modified.

## 0.38.3
Fri, 09 Dec 2022 22:03:04 GMT

### Patches

- Fix: `constants` not available in `fs/promise`

## 0.38.2
Fri, 09 Dec 2022 20:43:01 GMT

### Patches

- Fix: Revert breaking change to global cli usage

## 0.38.1
Thu, 08 Dec 2022 22:04:15 GMT

### Patches

- Fix: `scalar` can be used inside of namespace block

## 0.38.0
Wed, 07 Dec 2022 17:21:52 GMT

### Minor changes

- Allow subtypes to override parent properties if the derived property type is a subtype of the parent property.
- Add opt-in support for parsing JSDoc-like developer documentation
- Show developer docs in IDE features
- Doc: Add Doc comments to built-in types and decorators
- **Deprecation** Split `emitters` in cadl-project.yaml and compiler in 2 option `emit` and `options` that makes it consistent with the CLI
- Extract `getTypeName` and `getNamespaceString` outside of the checker into standalone helper function 
- Add new helper `validateDecoratorUniqueOnNode` that validate the decorator is not being used twice on the same node
- Add variable interpolation functionality in the cadl-project.yaml
- Add built-in `emitter-output-dir` options for all emitter.
- **Api Breaking change** $onEmit signature was updated to take an EmitContext object as only parmaeter.
- Fix typing and export format command
- **Api Breaking** Multiple `@service` per specs are now allowed.
- Add new `program.resolveTypeReference` helper to resolve a type in the cadl program using fully qualified name
- **Breaking** Add new `scalar` type and updated all intrinsic types to be a scalar type. `model MyString is string` changes to `scalar MyString extends string`
- `LanguageServer` Feature: Add signature help for decorators
- `Testing` Simplification of the testing framework
- `cadl init` Initialize the package.json with `type: module`
- **Deprecation** Renamed `url` to `uri`. Old `uri` is deprecated

### Patches

- Fix member completion on aliases
- Improve error recovery in the presence of merge conflict markers
- Fix reportDiagnostics error from emitters
- Fix: Should still instantiate template with invalid args but using constrain value
- Fix: Issue with diagnostic location when target was the operation parmeters
- Fix: miscOptions handling
- **Fix** Handle no service in services deprecated apis
- Fix: Validate `@service` decorator is targetting a namespace
- Fix: Cascading error when template is used with invalid arguments
- Update dependencies

## 0.37.0
Sat, 12 Nov 2022 00:14:04 GMT

### Minor changes

- Add `output-dir`, `trace`, `imports` option to cadl-project.yaml giving parity with cli arguments
- **Feature** Add decorator and function declaration in cadl using `extern dec` and `extern fn`.
- Fix: crash with referencing global namespace
- Added a new export to only import the module resolver
- Debugging: adding tracing information for JS decorators and function binding

### Patches

- `emitFile` now ensures that the folder exists prior to writing to the path.
- Add `isDeclaredInNamespace` utility function that checks if a definable type exists under a namespace or its children

## 0.36.1
Wed, 19 Oct 2022 19:36:13 GMT

### Patches

- **Fix** augment decorators can be applied on namespace

## 0.36.0
Wed, 12 Oct 2022 21:12:35 GMT

### Minor changes

- Remove `createProgram` and change `compile` parameter order to match old `createProgram`.
- Add new `getDiscriminatedUnion` helper to resolve the variants of a discriminated model or union
- Emitter throwing exception will emit a new `emitter-uncaught-error` diagnostic with information on how to file issue for the given emitter.
- Expose module resolver
- Add support for augment decorators.
- Language server provide document formatting using Cadl formatter
- **Deprecation** Replace `@serviceTitle` and `@serviceVersion` with a single `@service` decorator. 
- `API` Replaced logger (now internal) with new tracer module. Where trace have to be explicity enabled with `--trace`.
- Add `uri` built-in type
- Allow referencing global namespace as `global` for disambiguation
- **Feature** `Api`: `resolveUsages` can now be used on a list of operation, interface or namespaces
- **Fix** `Api`: `resolveUsages` collect reference to array element type and record value correctly.
- Expose helper to walk inherited properties and some helper data structures
- Feature: `decorators` Add `@minItems` and `@maxItems` decorators
- Add `navigateNamespace` helper letting user to navigate types under a namespace.(Similar to `navigateProgram`)
- Include `@discriminator` decorator from "@cadl-lang/rest" library
- Language Server: Improvement to outline, symbols correctly structured.
- Rename `output-path` to `output-dir` and deprecate old name.
- Add additional validation for `@overload` decorator: Make sure overloads are in the same container and that return types are compatible
- Added `listOperations` helper method
- **Breaking** Model `extends` or `is` cannot reference a model expression.

### Patches

- Fix bug where cloned type members had wrong parent
- Internal: Update type of `CompilerOptions.miscOptions` to be more accurate.
- Fix: Intersection types belong to namespace they are declared in.
- Fix: namespace and non namespace types should have unique names
- Fix: Deprecated `output-path` not being respected
- Fix: Property included via `model is` were not referencing the right model parent.
- Fix: Projected types point to projected parent type for Model properties, Union variants.
- Fix: Projected model property sourceProperty point to projected property
- Minor improvemens to decorator definitions

## 0.35.0
Thu, 08 Sep 2022 01:04:53 GMT

### Minor changes

- implementation of documentHighlight
- **Breaking** Update `Enum` type members type to be a `Map<string, EnumMember>` instead of `EnumMember[]`
- Add `@projectedName` decorator and projection for projected names
- Add auto formatting support for projections
- Add syntax highlighting for projections
- **API BREAKING** Replace `enableProjections` and `disableProjections` with a new function `projectProgram` removing the state of the program around the current projection.
- Api: Add helper method to resolve model usages
- Formatter: Comments in between decorators will stay between the decorators when formatting.
- Hovering over a symbol gives the fully-qualified name and documentation
- Enable loading multiple installation of the same library as long as the versions are the same
- Internal: Remove `evalCadlScript` from `Program`
- Remove Type suffix from most Types and deprecate old names
- Perf: Reuse unchanged files and programs in language server.

### Patches

- Api: `isGlobalNamespace` takes projection into account
- Internal: Facilitate adding new tokens to scanner."
- Formatter: Cadl doesn't include blank line at the end of embedded markdown codeblock
- Fix issue with ever-increasing duplicate symbol errors in IDE
- Formatter: Directive on model property with decorators will hug decorator.
- Fix additional issues for decorators not running in projections in templated type instance
- Internal: Fix some functionally not compatible in the browser
- Fix issue where decorators would get called on uninstantiated template declarations
- Internal: Don't clear template arguments on clone
- Internal: Make scanner capable of scanning future keywords that are longer than 10 characters.

## 0.34.0
Thu, 11 Aug 2022 19:05:23 GMT

### Minor changes

- combine consecutive single line comments that are separated by whitespace
- comment folding
- implemented folding for comments
- Allow extracting value from enums
- Add helper method for emitting file in emitters
- Feature: Emitter can specify a list of required imports
- Allow `@secret` on model property
- Add type relations and include a few more built-in types `any`, `object`, `Record`. `Map` was removed
- Added support for template constraints
- Format `model Foo is Bar {}` to `model Foo is Bar;`
- Added ability for decorator validator to accept any type
- Add @overload decorator
- Add helper to check if a namespace is the global namespace
- Support spread enum
- Add editor support for document symbols.
- Improve language configuration to help with comment indentation
- Provide helper to check types are template, template declaration or template instance

### Patches

- Fix: Allow omiting optional properties
- Improve `cloneType` implementation to duplicate decorator lists correctly
- Add DefaultKeyVisibility<T, Visibility> and @withDefaultKeyVisibility to assign a default visibility value to model @key properties in specific operation signatures
- Fix: Referencing previous template parameter in template parameter default
- Fix bug in finding effective type
- Fix issue with required parentheses being dropped with union, intersection and array expressions
- Fix issue with formatting multi line tuple adding trailing comma.
- Fix parsing error locations for imports and blockless namespaces
- Fix issue with multi-file specs in VS Code on Windows where common definitions are not found.
- Fix `mix` message when trying to extend non-interface
- Fix issue with projection of nested namespace passing partial projected element to decorators
- Fix: Operation signature with circular reference causing crash and updated message+code to be relevant to operations.
- Fix: Couldn't use operation defined inside interfaces as signature.
- Fix uninitialized parent namespaces in projections
- Run projections on types returned from getEffectiveType
- Fix: Issue with Nested namespace in projection causing versioning library to fail when Service is using nested namespace
- Internal: union variant type has reference to parent union.
- Fix null reference in getTypeName API when called on anonymous models without a backing syntax node
- Emit diagnostic when an optional property is marked with @key
- Providing `cadl.cadl-server.path` option will force the specified compiler to be used
- Fix error location of duplicate property from spread

## 0.33.0
Fri, 08 Jul 2022 23:22:57 GMT

### Minor changes

- Decorator definition helper support spread args
- Add ability to provide emitter options
- Improve folding in IDE.
- Allow omitting braces from model is statements
- implementation of relativePath

### Patches

- Fix issue with compiler version mismatch in VSCode
- Fix error location for intersection with non-model
- Fix Internal Compiler Error when using invalid relative import
- Internal: Decorator definition helper works with multiple target and param types
- Improved the error message shown when an `onEmit` function is not found in the requested emitter package

## 0.32.0
Mon, 13 Jun 2022 23:42:28 GMT

### Minor changes

- Improve error message when loading library with invalid `main` file
- Added new decorator signature validation helper
- Allow empty tuples
- Add helper functions to work with diagnostics in accessor functions
- Add diagnostics target to decorator context
- Add `@deprecated` decorator and emit warning diagnostic when referencing deprecated type
- Add completion support for import of libraries
- Remove @serviceHost decorator
- Add ability to rename Models, Operations, Interface, Unions and Enums in projections.
- Add compiler API to filter model properties and get try to find equivalent named models for anonymous models
- Rename `setDecoratorNamespace` -> `setCadlNamespace`
- Add support for operation templates and operation signature reuse
- Implement references to model, enum, union, and interface members
- Add semantic colorization
- Add completion/find-all-ref/rename support to member references
- Allow `using` before blockless `namespace`

### Patches

- Fix completion between `.` and `)`
- Fix issue with compiling virtual editor files
- Allow an emitter library to have `.cadl` files
- Fix issue with resolving node position when inside string literal
- Provide full namespace name in diagnostic
- Fix issue with server not locating main.cadl in parent folder
- Improve tracking of open documents in language server
- Fix issues with referencing enum from decorator on namespace

### Updates

- Allow cadl compile . on the compiler itself
- `getTypeName` returns type name for more types
- Upgrade to TS4.7

## 0.31.0
Fri, 06 May 2022 17:19:57 GMT

### Minor changes

- Prompt on cadl vs install if multiple versions of VS are installed
- Improve module resolution logic to allow compiling a cadl library
- Add code preview and coloring for diagnostics.
- Add ability to import library or emitter defined in parent folder. Adds the ability to use the actual emitter name in a samples folder of that emitter
- Formatter has ability to ignore patterns
- Formatter: remove quotes in model properties when not needed
- Add library loading debug logging
- Include manifest with version and commit
- Rename `mixes` to `extends` for interfaces
- Include reference from parent model to all children
- Cli: Add `--no-emit` flag configuring the `noEmit` compilerOption
- Add `warn-as-error` flag to cli that will return non zero exit code when there is a warning
- Add find references and rename support to language server
- Add goto definition of namespaces, usings, and decorators to language server
- Export `isTemplate` helper method
- Add namespace to model expressions
- Make Program.checker required
- Added formatting to a few more missing syntax(`array`, `tuple`, `template parameters`)
- Add OmitProperties type and @withoutOmittedProperties decorator
- Remove node 14 support
- Log PID and timestamps in language server
- Update to Unicode 14.0 and disallow U+FFFD
- Add option to Checker.getTypeName to filter namespaces

### Patches

- Improve tests for doc decorator
- Add workaround for npx bug causing issue with backslash in cli on windows
- Do not validate default assignment when property type is an error type. Prevent additional unrelated error to the original problem with the property type.
- Fix projection bug setting the namespace of operation with the interface
- Fix logger levels
- Fix issue with using model in template default
- Give a helpful error when code is missing from path
- Don't complete decorator names in type reference position
- Preserve namespace nesting in versioning projections

### Updates

- Add `CadlLanguageConfiguration` containing the configuration used by editor (vscode, monaco)

## 0.30.0
Thu, 31 Mar 2022 17:10:49 GMT

### Minor changes

- Add new helper `cadlTypeToJson` to convert cadl type to a Json serializable type
- Add helper methods to detect `void` and `never` types
- Prevent decorators from running if arguments are errors.
- Handle unknown identifier/error types used in spread operator.
- Add parent .model to ModelTypeProperty
- Add validation that template params cannot use latter params as default

### Patches

- support format in bytes type
- Fix: stack overflow when defining template argument where default reference argument itself. `Foo<T = T>`
- Fix formatting of comment between decorator and statement
- Fix resolving location for diagnostic in js files
- Fix formatting of comment between decorator and property
- Fix using `&` with template parameters
- Support browser builds
- Fix issues with mishandled promises
- Fix cascade of error when having unexpected token in directive

## 0.29.0
Wed, 09 Mar 2022 17:42:09 GMT

### Minor changes

- Move @key decorator to core
- Replace findChildModels with mapChildModels
- **Exports** `NodeHost` for programmatic usage of Cadl 
- **Added** `@knownValues` decorator providing set of known options for a string type
- Using `extends` with intrinsic types will emit diagnostic.
- Allow `op` in interfaces
- Complete using statements and qualified decorators.
- Add back `@inspectType` and `@inspectTypeName` decorators
- Redirect console.log to stderr in language server

### Patches

- Improve list parsing error recovery
- Use the proper symbol to use cadl exports in eval
- Fix issue with missing namespace name in certain cases
- Fix issue using `is` with intrinsic types.
- Fix decorator completion on namespaces
- refactor symbols and other improvements

## 0.28.0
Tue, 15 Feb 2022 22:35:02 GMT

### Minor changes

- Internals: Module resolver not dependent on `CompilerHost`
- Provide reusable decorator validation for target

### Patches

- Fix parser issue with missing error flag when using `interface extends` instead of `interface mixes`.
- Fix parser issue with incorrect `op` in various projection expressions, and wrong node type for `/` and `*`.
- Add support for separate `@summary` from `@doc`

## 0.27.0
Mon, 14 Feb 2022 03:01:07 GMT

### Minor changes

- Provide helper for library to validate parameter
- Update api for decorator taking `DecoratorContext` instead of `Program`

### Patches

- Fix bugs involving merged decorators
- Give nice error for using extends keyword in interfaces
- Implement template parameter defaults
- Bump dependency versions

## 0.26.0
Fri, 04 Feb 2022 18:00:18 GMT

### Minor changes

- Validate for `@doc` decorator argument is a string
- Add @error decorator in core
- **Added** --emit flag to configure the emitter(s) to use and separate library imports from emitters
- Add directory manipulation to CompilerHost
- Update to syntax tree to be readonly
- Formatter: Separate Enum members with decorator with new lines
- Implement projections and versioning

### Patches

- Adding @format decorator to compiler and openapi3 emitter
- Add `sourceObject` parameter to `@doc` decorator to aid in producing messages using a context object
- `@list` decorator will now ignore `TemplateParameter` objects
- Init include compiler as dependency in generated package.json
- Allow CLI array options to come before positional arguments
- **Fix** Diagnostic location for invalid use of templated models
- Fix path normalization issue that caused diagnostics from language server to be dropped.
- Fix error with file ending with mutline comment
- **Fix** issue when loading cadl using a different casing than the actual casing in a case insensitive file system
- Add @friendlyName decorator to customize model names for emitters
- Fix issue where identifiers could be confused with keywords when they had common endings.
- Renaming @format decorator to @pattern.
- Stop offering `true` and `false` completions after `.`
- Fix completion icon for symbols pulled in via using

## 0.25.0
Thu, 16 Dec 2021 08:02:20 GMT

### Minor changes

- **Update** reference resolution with `using` to fix duplicate symbols issues
- **Added** keyword autocomplete and icons
- **Added** support for union default values
- **Formatter** Add support for spread model formatting
- add mkdirp to compilerHost

### Patches

- Add findChildModels and getProperty utility functions
- **Fix** Circular reference in `is` or `extends` now emit a diagnostic instead of crashing
- **Fix** Circular reference in `alias` now emit a diagnostic instead of crashing
- **Fix** Circular reference between template model and non template model causing unresolved types issues.
- **Formatter** fix issues with empty model and interface with comments being moved outside.
- **Formatter** fix crash when having a comment in anonymous empty model.
- **Formatter** fix crash when using multi-line comment without each line starting with `*`.
- **Formatter** Tweak formatting of interface mixes that overflow.
- **Formatter** Keep single value decorator inline.
- **Formatter** Keep empty line seperation in interface similar to namespace (Only keeps 1 max between operation).
- Add support for `interface` as a `@tag` decorator target
- Reintroduce @list decorator to assist with collection operations
- Improve getTypeName support for Unions and UnionVariants

## 0.24.1
Wed, 01 Dec 2021 22:56:11 GMT

### Patches

- Fix issue where formatter would try to format a document with irrecoverable parse errors in certain cases
- **Fix** Wrong library import for the rest template
- Fix crash in language server
- Fix formatting bug with operations returning anonymous models
- Fix language server crashes in certain error cases
- Update README

## 0.24.0
Thu, 18 Nov 2021 13:58:15 GMT

### Minor changes

- **Added** `cadl install` command which shell out to `npm install`
- Remove @list decorator
- Show `@doc` info along with completions

### Patches

- **Fix** Logging of warning counts, showing error count
- Ensure interface is assigned for checked operations
- Add setDecoratorNamespace helper function

## 0.23.0
Thu, 11 Nov 2021 21:46:21 GMT

### Minor changes

- **Added** `duration` intrinsic type
- **Added** `--check` option to `cadl format` command to verify files are formatted
- **Added** log of the error and warning count at the end in case `cadl compile` failed.
- **Added** Support for models with mutual references
- Add completion ("IntelliSense") support to language server
- `cadl init` generate `package.json` with `private: true`

### Patches

- Add Prettier formatting support for interface mixes
- Add new --import CLI parameter to add a global import via the command line

## 0.22.0
Thu, 28 Oct 2021 21:17:50 GMT

### Minor changes

- **Added** logger functionality to log information
- Add `OmitDefaults` model to remove default values of a model

### Patches

- Return non-zero exit code when compilation has errors
- Diagnostics are strongly defined and all have a code
- **Fix** `using` formatting
- **Tweak** formatter model properties with decorators
- **Improve** decorator formatting

## 0.21.0
Fri, 15 Oct 2021 21:33:37 GMT

### Minor changes

- Add an API to clone a type
- Reverse decorator evaluation order
- **Added** Support for server default
- **Added** New library helper for strong diagnostics definitions
- **Added** New syntax to compiler for directive
- **Added** support for suppressing warning via #suppress directive
- Implement `interface`
- Add walker, colorization, printer for interfaces
- Surface decorator and emitter errors in IDE
- Add union declarations

### Patches

- Defensive code to prevent errors in decorators and onBuild from exiting the language server
- Fix options comment
- Update samples
- Fix binding JS file namespaces and namespace decorators referencing types in a later namespace.
- fix using a namespace merged after current namespace
- Fix namespace synthesis in certain contexts
- Make nextLink optional in pageable response
- Stop running decorators and emitters in language server again, fix language server crash. 
- regenerate samples

## 0.20.0
Fri, 17 Sep 2021 00:49:37 GMT

### Minor changes

- Added `cadl init` command to scaffold new cadl project
- Added semantic walker
- Add IDE go-to definition support
- Implement cadl namespace, don't merge namespaces until checking
- Remove support for multiple inheritance
- Definition for `bytes` and new number types

### Patches

- Fix issues with specs
- Update samples
- Ensure syntax nodes report correct and consistent source positions
- Fix bug that broke analyzing untitled documents in IDE
- Fix bug preventing using latest changes to document in IDE
- Update sample generation

## 0.19.0
Sat, 21 Aug 2021 00:04:02 GMT

### Minor changes

- Introduce naming convention `$name` for JavaScript-defined Cadl functions and decorators

### Patches

- Update test output

## 0.18.0
Fri, 13 Aug 2021 19:10:21 GMT

### Minor changes

- Remove `cadl generate` command

### Patches

- Add support for discovering updatable properties using visibility
- Fix error in `cadl vs uninstall` command

## 0.17.0
Tue, 10 Aug 2021 20:23:04 GMT

### Minor changes

- Rename package to @cadl-lang/compiler

## 0.16.0
Mon, 09 Aug 2021 21:14:12 GMT

### Minor changes

- Add `compile --watch` option to watch files for changes and recompile
- Implement model is

### Patches

- **Update** to yargs 17 and update args parsing to use handlers logic to have full type safety
- Report errors for duplicate model and enum members

## 0.15.0
Mon, 02 Aug 2021 18:17:00 GMT

### Minor changes

- Rename ADL to Cadl

## 0.14.0
Wed, 28 Jul 2021 19:40:06 GMT

### Minor changes

- Decorators can be put into namespaces using a .namespace property or a namespace export

### Patches

- Add service code generator module
- Allow more non-ascii characters in identifiers and normalize identifiers
- Use newer version of autorest from `adl generate`

## 0.13.0
Fri, 09 Jul 2021 20:21:06 GMT

### Minor changes

- Add OptionalProperties<T> and withOptionalProperties decorator for creating model variations with all properties set to optional
- Add semantic analysis to language server

### Patches

- **Update** Diagnostics code to be a string
- Formatter can recover from parsing error that don't affect the validity of the tree
- Use LSP to log messages from client to server

## 0.12.0
Thu, 24 Jun 2021 03:57:43 GMT

### Minor changes

- Require main.adl or adlMain in package.json
- Add mutator library which enables the programmatic addition of model properties, operation parameters, and operation return types
- Add semantic error recovery

### Patches

- **Added** ADL Configuration file loading
- Added typechecker type navigation
- Add isStringType helper function
- Fix some edge cases in config file loading
- Add support for Visual Studio 2022

## 0.11.0
Tue, 18 May 2021 23:43:31 GMT

### Minor changes

- **Added** format command to automatically format adl files

### Patches

- **Fix** Throw diagnostic when main ADL file doesn't exists
- Fix TypeError after `adl vs` command
- **Fix** formatter handling string and number literal should keep as it is.
- **Fix** Formatter not rendering template parameters of models.
- **Fix** Don't format a file with parsing errors
- Work around npm 7+ Mac OS bug in `adl code install`
- Prefer local install of adl package when running global `adl`

## 0.10.0
Thu, 06 May 2021 14:56:02 GMT

### Minor changes

- Implement alias and enum, remove model =
- Implement basic parser error recovery
- Add API to check if a node or any descendants have parse errors

### Patches

- Small parsing speed improvement when expecting one of N tokens.
- Fix blockless namespaces not accumulating decls
- Allow leading +/- in numeric literals and require fractional digits
- Fix bugs with non-ascii identifiers
- Improve CLI experience for generate command
- Replace several internal compiler errors with diagnostics
- Do not allow multi-line non-triple-quoted string literals
- Fix parsing edge cases and optimize parsing slightly

## 0.9.0
Tue, 20 Apr 2021 15:23:29 GMT

### Minor changes

- Fix parse errors from trailing commas; implement optional prefix | and &

### Patches

- Fix issue where dynamic namespaces were not evaluated
- Virtualize writting to filesystem to enable programtic usage of adl

## 0.8.0
Tue, 06 Apr 2021 01:23:07 GMT

### Minor changes

- Implement npm libraries
- Implement library import with npm, abstract out rest, openapi, rpaas

### Patches

- Add commands to install and uninstall Visual Studio extension
- Enable security and securityDefinitions metadata to be applied to emitted OpenAPI documents; add default ARM security details
- Add api-version parameter to all ARM operations
- Add operations endpoint for ARM services
- Enable creation of $refs to ARM common model and parameter definitions
- Add common ARM parameter definitions for resource operations
- remove parenless decorators

## 0.7.0
Wed, 31 Mar 2021 22:00:43 GMT

### Minor changes

- Implement usings statements
- Implement imports
- Improved OpenAPI output for ARM services, including pluralized operation groups and operation tags

### Patches

- Add service-level metadata decorators: @serviceTitle, @serviceVersion, @produces, @consumes, and @armNamespace
- Add support for OpenAPI operation overloads using x-ms-paths

## 0.6.0
Fri, 26 Mar 2021 17:06:33 GMT

### Minor changes

- Implement namespace merging, blockless namespaces, and dotted namespaces

### Patches

- Emit `readOnly: true` for model properties marked with `@visibility("read")`
- The `visibility` decorator now accepts multiple values; the Swagger emitter will write these out as an `x-ms-mutability` field.
- Adding sample generated controller for _____ service
- Add back post operation
- Add standard ARM operation and error model types
- Fix id lookup bug
- Initial check-in of adl spec and generated swagger for _____
- Update _____ spec with user comments.
- Fixing formatting to match repo prettier config
- Add `@minValue` and `@maxValue` decorators for specifying the value range of numeric types
- Allow the use of recursive type references in model definitions
- Enable metadata and extensions to be applied to $ref'd schemas
- Add missing metadata for ARM library types

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

### Updates

- Implement extends, re-implement spread to copy properties, implement visibility framework, move to explicit bodies in responses, and fix various bugs.
- Implement nostdlib option

## 0.2.1
Thu, 28 Jan 2021 21:30:01 GMT

### Patches

- Fixed standard library decorator module resolution

## 0.2.0
Wed, 27 Jan 2021 21:48:34 GMT

### Minor changes

- Initial ADL compiler preview release

