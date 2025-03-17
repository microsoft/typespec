---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Stop exposing APIs that were not meant for external users. Please file issue if you had legitmate use of some of those APIs.
- `Checker`: The check itself should be used very carefully and its wouldn't be covered under the compatibility guarantees. There is some apis that were explicitly marked as internal while other remained until we provide a better way to do the same thing:
  - `getGlobalNamespaceType();` -> `program.getGlobalNamespaceType();`
  - `resolveTypeReference();` -> `program.resolveTypeReference();`
  - `checkProgram();` This isn't meant to be used by external users.
  - `getLiteralType()` This isn't meant to be used by external users.
  - `resolveRelatedSymbols()` This isn't meant to be used by external users.
  - `resolveCompletions()` This isn't meant to be used by external users.

- `Program`: Exposed functions on the program are safe to use but a few have been updated to be internal:
  - `mainFile` -> Use `projectRoot` instead.
  - `literalTypes` This isn't meant to be used by external users.
  - `checker`: This is still exposed but to be used carefully, see above.
  - `loadTypeSpecScript`: This isn't meant to be used by external users.
  - `onValidate`: This isn't meant to be used by external users.
  - `reportDuplicateSymbols`: This isn't meant to be used by external users.

- `logVerboseTestOutput` Internal test util, not meant for external users
- `validateDecoratorTarget` -> migrate to `extern dec` declaration
- `validateDecoratorParamCount`: Same as above
- `altDirectorySeparator`: Internal path utils
- `directorySeparator`: Internal path utils
- `isIntrinsicType`: Internal check
- `getFullyQualifiedSymbolName` Symbols are an internal aspect of the compiler
- Scanner related APIs:
  - `createScanner`
  - `isComment`
  - `isKeyword`
  - `isModifier`
  - `isPunctuation`
  - `isStatementKeyword`
  - `isTrivia`
  - `skipContinuousIdentifier`
  - `skipTrivia`
  - `skipTriviaBackward`
  - `skipWhiteSpace`
  - `Token`
  - `TokenFlags`
  - `type`DocToken,
  - `type`Scanner,
  - `type`StringTemplateToken,
- Types
  - `Sym` Symbols are an internal aspect of the compiler 
  - `SymbolLinks` Symbols are an internal aspect of the compiler 
  - `SymbolTable` Symbols are an internal aspect of the compiler 
  - `SymbolFlags` Symbols are an internal aspect of the compiler 
  - `MutableSymbolTable` Symbols are an internal aspect of the compiler 
  - `ResolutionResult` Internal type used in non exposed resolver 
  - `NodeLinks` Internal type used in non exposed resolver 
  - `ResolutionResultFlags` Internal type used in non exposed resolver 
  - `MetaMemberKey` Unused type
  - `MetaMembersTable` Unused type
  - `Dirent` Unused type
