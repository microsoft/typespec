# Generate from TypeSpec Test Scenario

Different emitter types can be used to generate different codes to meet specific purposes. TypeSpec supports the following emitter types:

- Client Code
- Server Stub
- OpenAPI Document

**Important: There must be at least one TypeSpec project in the project folder.**

## Test Environment

- OS : Windows or Linux
- Emitter: Client Code, Server Stub, OpenAPI Document
- Language : Python, Java, JavaScript, .NET, OpenAPI3

> Note: The extension should support all test cases in VS Code for Windows and Linux. Mac support is a stretch goal for Selenium semester.

## Prerequisites

Install TypeSpec Compiler before starting to write TypeSpec.

- [Node.js 20+](https://nodejs.org/download/)
- Npm 7+
- [Install TypeSpec Compiler CLI](https://typespec.io/docs/): `"npm install -g @typespec/compiler"`

Install required SDK/runtime for executing the specified language:

- [.NET 8.0 SDK](https://dotnet.microsoft.com/en-us/download)
- [Java 11 or above](https://www.oracle.com/java/technologies/downloads/), and [Maven](https://maven.apache.org/download.cgi)
- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 20+](https://nodejs.org/download/)

## Test Steps

### Step 1: Install the typespec extension.

_Option 1_. Install using .vsix file:
Click `Extension` -> `…` -> `Install form VSIX...`. Choose the `.vsix` file you want to install locally.

![alt text](./images/InstallTypespec_VSIX.png)

_Option 2_. Install typespec with vscode extension marketplace:
`Extension` -> input `TypeSpec` -> `Install`

![alt text](./images/InstallTypespec_ExtensionMarketplaceTest01.png)

### Step 2: Trigger generate from TypeSpec

Generation from a TypeSpec can be triggered in two ways:

_Option 1_. Clicking `Generate from TypeSpec` in the _Context Menu_ for a .tsp file in the extended TypeSpec project.

![alt text](./images/TriggerGeneratefromTypeSpec_ContextMenu.png)

_Option 2_. Typing `>TypeSpec: Generate from TypeSpec` in the _Command Palette_ with at least a TypeSpec project folder extended in the _Side Bar_.

![alt text](./images/TriggerGeneratefromTypeSpec_CommandPalette.png)

### Step 3: Click the command `TypeSpec: Generate from TypeSpec`, and choose a project.

**Validate:** There should be a prompt "Select a Typespec Project".

![alt text](./images/GeneratefromTypeSpec_SelectTypespecProject.png)

### Step 4: Select an Emitter Type.

**Validate:** There should be a prompt "Select an Emitter Type", and should see three emitter types: `Client Code`, `<PREVIEW> Server Stub`, `OpenAPI Document`.

![alt text](./images/GeneratefromTypeSpec_SelectEmitter_client.png)

### Step 5: Click an Emitter Type, Select a Language and Generate Code.

- For Emitter Type `Client Code`:

  Generate `client code` from TypeSpec. In VS Code extension, we can complete code generation with step-by-step guidance. TypeSpec Extension support will be extended to client code generation for first-class languages: `.NET`, `Python`, `Java`, and `JavaScript`.

  1. Click `Client Code`.

     **Validate:** There should be a prompt "Select a Language", and should see four languages: `DotNet`, `Java`, `JavaScript`, `Python`.

  2. Select a Language, Confirm the emitter type. (e.g. Select `DotNet`)

     **Validate**: There should be a prompt `Select an emitter for code generation`.

     ![alt text](./images/GenerateClientCode_ConfirmEmittersType_DotNet.png)

  3. Check if the package needs to be installed or updated.

     - If installation or update is required, it will prompt `Here are libraries to install or update`. Click `OK` to install.

       **Validate:** There should be a prompt `Here are libraries to install or update`, and TypeSpec emitters to install and their minimum requirements.

       ![alt text](./images/GenerateClientCode_ConfirmTypeSpecEmitters.png)

     - If already installed, it will be skipped.

  4. Initiate the generation of client code on the backend.

     **Validate:** The emitter package is already installed and the client folder is generated. The result appears in the lower right corner as a notification.

     - For `DotNet`:

       ![alt text](./images/GenerateClientCode_VerifyGenerateCodeSucceeded_DotNet.png)

     - For `Java`:

       ![alt text](./images/GenerateClientCode_VerifyGenerateCodeSucceeded_Java.png)

     - For `JavaScript`:

       ![alt text](./images/GenerateClientCode_VerifyGenerateCodeSucceeded_JS.png)

     - For `Python`:

       ![alt text](./images/GenerateClientCode_VerifyGenerateCodeSucceeded_Python.png)

- For Emitter Type `<PREVIEW> Server Stub`:

  The service stub generation support will be PREVIEWED for 2 languages: `.NET` and `JavaScript`.

  > Note: Server Stub Emitter is currently under PREVIEW.

  1. Click `<PREVIEW> Server Stub`.

     **Validate:** There should be a prompt "Select a Language", and should see two languages: `DotNet`, `JavaScript`.

  2. Select a Language, confirm the TypeSpec emitters you want to install and their minimum requirements.

     **Validate:** There should be a prompt `Here are libraries to install or update`, and TypeSpec emitters to install and their minimum requirements.

     ![alt text](./images/GenerateClientCode_ConfirmTypeSpecEmitters_serverstub.png)

  3. Initiate the generation of Server Stub on the backend.

     **Validate:** The result appears as a Notification in the bottom right corner, and generate the server folder.

     > Note: JavaScript server code emitter is experimental.

     - For `DotNet`:

       ![alt text](./images/GeneratefromTypeSpec_GenerateServerCodePrompt_DotNet.png)

- For Emitter Type `OpenAPI Document`:

  Emit OpenAPI3 from TypeSpec to automate API-related tasks: generate API documentation, test API, etc.

  The TypeSpec file itself is not sufficient to generate OpenAPI3. The conversion process will always reference the entry point (main.tsp) of the TypeSpec build, which includes the main definitions of models, services, and operations.

  1. Click `OpenAPI Document`.

     **Validate:** There should be a prompt "Select a Language", and should see languages: `OpenAPI3`.

  2. Select a Language, Confirm the emitter type.

     **Validate**: There should be a prompt `Select an emitter for code generation`.

     ![alt text](./images/GenerateOpenAPI_ConfirmEmittersType_OpenAPI3.png)

  3. Check if the package needs to be installed or updated.

     - If installation or update is required, it will prompt `Here are libraries to install or update`. Click `OK` to install.

       **Validate**: There should be a prompt `Here are libraries to install or update`, and confirming installation of the required TypeSpec library `@typespec/openapi3`.

       ![alt text](./images/GenerateOpenAPI_ConfirmTypeSpecEmitters.png)

     - If already installed, it will be skipped.

  4. Initiate the generation of OpenAPI on the backend.

     **Validate:** A detailed trace log should be printed in the OUTPUT window. The result appears as a Notification in the bottom right corner, and generate the schema folder.

     ![alt text](./images/GeneratefromTypeSpec_GenerateOpenAPIResult_prompt.png)

## Issue Report

When an error is detected, it's necessary to document the findings by using the following form:

| No  |              Title               | Emitter Type |              Language              |                       Issue Description                        |                                                                                       Repro Steps                                                                                       |                 Expected Results                  |                         Actual Results                         |  Comments  |
| --- | :------------------------------: | :----------: | :--------------------------------: | :------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------: | :------------------------------------------------------------: | :--------: |
| 1   | e.g. Generate Client Code failed | Client Code  | DotNet/ Java / JavaScript / Python | Exception occurred when generating client code for JavaScript. | 1. Typing `>TypeSpec: Generate from TypeSpec` in the _Command Palette_. <br> 2. Choose a project. <br> 3. Select a template. <br> 4. Select an Emitter Type. <br> 5. Select a Language. | Generate client code for JavaScript ...Succeeded. | Exception occurred when generating client code for JavaScript. | Issue link |

## Test Results Summary

The test results will be presented in the following form:

| NO  |             Test Cases             |   Platform    |          Language           | Result | Issues | Comments |
| --- | :--------------------------------: | :-----------: | :-------------------------: | :----: | :----: | :------: |
| 1   | Generate Client Code from TypeSpec | Windows/Linux |           Python            |        |        |          |
| 2   | Generate Client Code from TypeSpec | Windows/Linux |            Java             |        |        |          |
| 3   | Generate Client Code from TypeSpec | Windows/Linux |            .NET             |        |        |          |
| 4   | Generate Client Code from TypeSpec | Windows/Linux |         JavaScript          |        |        |          |
| 5   | Generate Server Stub from TypeSpec | Windows/Linux |           DotNet            |        |        |          |
| 6   | Generate Server Stub from TypeSpec | Windows/Linux | JavaScript _(Experimental)_ |        |        |          |
| 7   | Generate OpenAPI 3.x from TypeSpec | Windows/Linux |          OpenAPI3           |        |        |          |
