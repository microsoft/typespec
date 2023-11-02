# Prerequisites

- Install [Node.js](https://nodejs.org/) 14 LTS or 16 LTS
- Install [Rush](https://rushjs.io/)

```bash
npm install -g @microsoft/rush
```

# Installing NPM dependencies

```bash
rush update

# To force rush to refetch the correct version of the packages
rush update --recheck
```

This will install all of the npm dependencies of all projects in the
repo. Do this whenever you `git pull` or your workspace is freshly
cleaned/cloned.

Note that `rush update` must be done before building in VS Code or
using the command line.

# Install playwright browsers for UI testing

```bash
npx playwright install
```

# Using command line

## Rebuild the whole repo

```bash
rush rebuild
```

This will build all projects in the correct dependency order.

## Build the whole repo incrementally

```bash
rush build
```

This will build all projects that have changed since the last `rush build` in
dependency order.

## Build an individual package on the command line

```bash
cd packages/<project>
rushx build
```

## Run all tests for the whole repo

```bash
rush test
```

## Start compile on save

Starting this command will rebuild the typescript files on save.

```bash
rush watch
```

## Cleanup

Sometimes there are ghost files left in the dist folder (common when renaming or deleting a TypeScript file), running this will get a clean state.

```bash
rush clean
```

## Run tests for an individual package

```bash
cd packages/<project>
rushx test
```

## Verbose test logging

Tests sometimes log extra info using `logVerboseTestOutput` To see
this output on the command line, set environment variable
TYPESPEC_VERBOSE_TEST_OUTPUT=true.

## Reformat source code

```bash
rush format
```

PR validation enforces code formatting style rules for the repo. This
command will reformat code automatically so that it passes.

You can also check if your code is formatted correctly without
reformatting anything using `rush check-format`.

See also below for having this happen automatically in VS Code
whenever you save.

## Generate changelogs

```bash
rush change
```

PR validation enforces every changes to packages have a changelog entry.

Rush change will ask for the following questions for each modified packages:

- message: This should be a good description of what the changes are to this package
- type:
  - `major`: For a breaking change. **DO NOT USE All versions remain in 0.x stage until GA.**
  - `minor`: A new functionality.
  - `patch`: A bug fix.
  - `none`: Not relevant to the consumer of the packages. For example some added tests.

## Linting

```bash
rush lint
```

PR validation enforces linting rules for the repo. This
command will run the linter on all packages.

## Regenerate Samples

```bash
rush regen-samples
```

PR validation runs OpenAPI emitters on samples and compares them to known,
reviewed, checked-in versions. If your PR would change the generated output,
run this command to regenerate any samples and check those files in with
your PR. Carefully review whether the changes are intentional.

## Regenerate Reference Docs

```bash
rush regen-docs
```

PR validation will ensure that reference docs are up to date.

# Using VS Code

## Recommended extensions

1. [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter):
   Run tests from the IDE.
2. [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode):
   Automatically keep code formatted correctly on save.
3. [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint):
   Show eslint errors in warnings in UI.
4. [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker):
   Show spell check errors in document.

## Opening the repo as workspace

Always open the root of the repo as the workspace. Things are setup to
allow easy development across packages rather than opening one package
at a time in the IDE.

- File -> Open Workspace, select root folder where the TypeSpec repo was
  cloned
- Or run `code /path/to/repo/root` on the command line

## Building

- Terminal -> Run Build Task (`Ctrl+Shift+B`)

This will setup a an incremental watching build for the whole
repo. From there on, your changes will be built whenever you save.

Problems will be reported in the Problems pane automatically and the
Terminal pane will have three parallel watch tasks running:

- `watch-source`: tsc process that recompile on TypeScript changes
- `watch-spec`: process that regenerates spec.html when
  spec.emu.html changes
- `watch-tmlanguage`: process that regenerates typespec.tmlanguage when
  tmlanguage.ts changes

## Testing

With [Mocha Test
Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter)
installed, click on its icon in the sidebar, then click on the play
button at the top or on any individual test or test group to run just
one test or just one group. You can also click on the bug icon next to
an individual test to debug it.

You can see additional information logged by each test using
`logVerboseTestOutput` by clicking on the test and looking at the
output pane. Unlike the command line, no environment variable is
needed.

## Debugging

There are several "Run and Debug" tasks set up. Click on the Run and
Debug icon on the sidebar, pick one from its down, and press F5 to
debug the last one you chose.

1. **VS Code Extension**: This will run and debug an experimental
   instance of VS Code with the TypeSpec extension for VS Code and TypeSpec
   language server running live with any of your changes. It will
   attach to both the VS Code client process and the language server
   process automatically.
2. **Compile Scratch**: Use this to debug compiling
   `packages/samples/scratch/*.tsp`. The TypeSpec source code in that
   folder is excluded from source control by design. Create TypeSpec files
   there to experiment and debug how the compiler reacts.
3. **Compile Scratch (nostdlib)**: Same as above, but skips parsing
   and evaluating the TypeSpec standard library. Sometimes it's easier to
4. **Attach to Default Port**: Use this to attach to a manually run
   `node --debug` command.
5. **Attach to Language Server**: Use this to attach to the language
   server process of an already running client process. Useful if you
   want to debug the language server in VS Code while debugging the VS
   client in VS.
6. **Regenerate .tmlanguage**: This runs the code that produces the
   typespec.tmlanguage file that provides syntax highlighting of TypeSpec in VS
   and VS Code. Select this to debug its build process.

# Developing the Visual Studio Extension

## Prerequisites

Install [Visual Studio](https://visualstudio.microsoft.com/vs/) 17.0
or later. It is not currently possible to build the VS extension
without it, and of course you'll need Visual Studio to run and debug
the Visual Studio extension.

## Build VS extension on the command line

See the command line build steps above. If you have VS installed,
the VS extension will be included in your command line full repo
builds automatically.

If you do not have VS installed the command line build steps above
will simply skip building the VS extension and only build the VS Code
extension.

## Build VS extension in VS

- Open packages/typespec-vs/Microsoft.TypeSpec.VisualStudio.sln in Visual Studio
- Build -> Build solution (`Ctrl+Shift+B`)

Unlike TypeScript in VS Code above, this is not a watching build, but
it is relatively fast to run. Press Ctrl+Shift+B again to build any
changes after you make them.

## Debug VS extension

- Click on the play icon in the toolbar or press `F5`

This will run and debug an experimental instance of VS with a version
of the TypeSpec extension for VS Code running live with any of your changes
to the extension or the TypeSpec language server.

The VS debugger will attach only to the VS client process. Use "Attach
to Language Server" described above to debug the language server in
VS Code.

# Installing your build

```
rush dogfood
```

This will globally install the @typespec/compiler package, putting your
build of `typespec` on PATH, and install the VS Code extension if VS Code
is installed.

Note the important difference between this and the steps to run and
debug the VS Code extension above: the `dogfood` command installs the
TypeSpec extension with your changes in regular, non-experimental instance
of VS Code, meaning you will have it always, and not only when running
the debug steps above. This is exactly like using `tsp vscode install`,
only instead of downloading the latest release, it uses a build with your
changes applied.

There is no automatic `dogfood` process for installing the VS
extension non-experimentally, but if you build the typespec-vs project from
the command line following the steps above, or build its Release
configuration in Visual Studio, then you can install it by
double-clicking on packages/typespec-vs/Microsoft.TypeSpec.VisualStudio.vsix
that gets produced.

# Pull request

## Trigger TypeSpec Playground Try It build

For contributors of the repo the build will trigger automatically but for other's forks it will need a manual trigger from a contributor.
As a contributor you can run the following command to trigger the build and create a typespec playground link for this PR.

```
/azp run TypeSpec Pull Request Try It
```

## Run formatter

Trigger a workflow that will format the code, commit and push.

```
/typespeceng format
```

# TypeSpec website

## Run locally

Go to `packages/website` and run the command:

```
npm start
```

## Publish website to github.io

The website on github.io should be published when releasing new packages.

To release:

- Go to https://github.com/microsoft/typespec/actions/workflows/website-gh-pages.yml
- Click the `Run workflow` dropdown and select the `main` branch.
