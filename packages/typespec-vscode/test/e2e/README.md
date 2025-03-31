# TypeSpec UI Automation

## Description

- This is a project based on Vitest+Playwright. It performs UI automation testing for the plugin `typespec` in Vscode. When the program is running, the automatically started `vscode` must have the focus all the time. By executing the `yarn test` command, you can run the automated process, which will automatically start `vscode` for subsequent operations.
- **This project relies heavily on the environment required for manual testing**. For information about manual testing, please refer to [here](https://github.com/xiaohua899/typespec/tree/patch-1/packages/typespec-vscode/test/manual).
- **If want to use the latest plugin, click [here](typespec-automation-1.0.0.vsix).** Then install it manually in `vscode`.

## Prerequisites

- [Nodejs V20](https://nodejs.org/en/download)
- Npm 7+
- [Visual Code](https://code.visualstudio.com/)
- [TypeSpec Compiler CLI](https://typespec.io/docs/): "npm install -g @typespec/compiler"
- [TypeSpec Vscode Extension](https://marketplace.visualstudio.com/items?itemName=typespec.typespec-vscode)
- [.NET 8.0 SDK](https://dotnet.microsoft.com/en-us/download)
- [Java 11](https://www.oracle.com/java/technologies/downloads/) or above, and [Maven](https://maven.apache.org/download.cgi)
- [Python 3.8+](https://www.python.org/downloads/)

## Quickstart

#### Project Structure

The core directory is `src`, which contains all the `test files`. They correspond to three types of tests. In addition, there is a `common` folder, which contains some common utility functions and some specific steps.

- `common`: Public module, including some utility functions.
  - `commonSteps.ts`: Steps that are common to all tests.
  - `createStops.ts`: `create` type steps.
  - `emitSteps.ts`: `emit` type steps.
  - `utils.ts`: Utility Functions.
  - `downloadSetup.ts`: Install a new `vscode`.
- `create/createTypespec.test.ts`: New TypeSpec projects can be created using a variety of templates for specific purposes.
- `emit/emitTypespec.test.ts`: Different emitter types can be used to emit different codes to meet specific purposes.
- `import/importTypespec.test.ts`: With the TypeSpec emitter for OpenAPI3, users can import a TypeSpec file from a designated OpenAPI3 document. While it is possible to repeatedly convert OpenAPI3 to TypeSpec.

#### This quickstart will show you how to use this tool to fetch all test data and run test cases locally.

1. Clone this repo.

   ```git
   git clone https://github.com/Yionse/TypespecAutomation.git
   ```

2. Install dependencies using `yarn`.

   ```
   npm i -g yarn
   yarn
   ```

   Alternatively, you can also install dependencies using npm directly.

   ```
   npm i
   ```

3. Run the test cases.
   ```
   yarn test
   ```
   Alternatively, you can also run the tests using `npm`.
   ```
   npm run test
   ```

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit https://cla.microsoft.com.
