# Prerequisites
* Install [Node.js](https://nodejs.org/) 14 LTS
* Install [Rush](https://rushjs.io/)

```
npm install -g @microsoft/rush
```

# Installing NPM dependencies
```
rush update
```

This will install all of the npm dependencies of all projects in the
repo. Do this whenever you `git pull` or your workspace is freshly
cleaned/cloned.

Note that `rush update` must be done before building in VS Code or
using the command line.

# Using command line

## Rebuild the whole repo
```
rush rebuild
```
This will build all projects in the correct dependency order.

## Build the whole repo incrementally
```
rush build
```
This will build all projects that have changed since the last `rush build` in
dependency order.

## Build an individual package on the command line
```
cd packages/<project>
rushx build
```
## Run all tests for the whole repo
```
rush test
```
## Run tests for an individual package
```
cd packages/<project>
rushx test
```

## Verbose test logging

Tests sometimes log extra info using `logVerboseTestOutput` To see
this output on the command line, set environment variable
ADL_VERBOSE_TEST_OUPUT=true.

## Reformat source code
```
rush format
```
PR validation enforces code formatting style rules for the repo. This
command will reformat code automatically so that it passes.

You can also check if your code is formatted correctly without
reformatting anything using `rush check-format`.

See also below for having this happen automatically in VS Code
whenever you save.

# Using VS Code

## Recommended extensions
1. [Mocha Test
   Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter):
   Run tests from the IDE.
2. [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode):
   Automatically keep code formatted correctly on save.

## Opening the repo as workspace

Always open the root of the repo as the workspace. Things are setup to
allow easy development across packages rather than opening one package
at a time in the IDE.

 * File -> Open Workspace, select root folder where the Cadl repo was
   cloned
 * Or run `code /path/to/repo/root` on the command line

## Building
* Terminal -> Run Build Task (`Ctrl+Shift+B`)

This will setup a an incremental watching build for the whole
repo. From there on, your changes will be built whenever you save.

Problems will be reported in the Problems pane auotomatically and the
Terminal pane will have three parallel watch tasks running:

  * `watch-source`: tsc process that recompiles on TypeScript changes
  * `watch-spec`: process that regenerates spec.html when
    spec.emu.html changes
  * `watch-tmlanguage`: process that regenerates cadl.tmlanguage when
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
   instance of VS Code with the Cadl extension for VS Code and Cadl
   language serever running live with any of your changes. It will
   attach to both the VS Code client process and the language server
   process automatically.
2. **Compile Scratch**: Use this to debug compiling
   `packages/cadl-samples/scratch/*.cadl`. The Cadl source code in that
   folder is excluded from source control by design. Create Cadl files
   there to experiment and debug how the compiler reacts.
3. **Compile Scratch (nostdlib)**: Same as above, but skips parsing
   and evaluating the Cadl standard library. Sometimes it's easier to
4. **Attach to Default Port**: Use this to attach to a manually run
   `node --debug` command.
5. **Attach to Language Server**: Use this to attach to the language
   server process of an already running client process. Useful if you
   want to debug the language server in VS Code while debugging the VS
   client in VS.
6. **Regenerate .tmlanguage**: This runs the code that produces the
   cadl.tmlanguage file that provides syntax highlighting of Cadl in VS
   and VS Code. Select this to debug its build process.

# Developing the Visual Studio Extension

## Prerequisites
Install [Visual Studio](https://visualstudio.microsoft.com/vs/) 16.9
or later.  It is not currently possible to build the VS extension
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
* Open packages/cadl-vs/Microsoft.Cadl.VisualStudio.sln in Visual Studio
* Build -> Build solution (`Ctrl+Shift+B`)

Unlike TypeScript in VS Code above, this is not a watching build, but
it is relatively fast to run. Press Ctrl+Shift+B again to build any
changes after you make them.

## Debug VS extension
* Click on the play icon in the toolbar or press `F5`

This will run and debug an experimental instance of VS with a version
of the Cadl extension for VS Code running live with any of your changes
to the extension or the Cadl language server.

The VS debugger will attach only to the VS client process. Use "Attach
to Lanugage Server" described above to debug the language server in
VS Code.

# Publishing a release
To publish a release of the packages in this repository, first create
a branch starting with `publish/` (e.g. `publish/0.4.0`) and run the
following command:

```
rush publish --apply
```

This will bump versions across all packages and update changelogs
*without* publishing the packages to `npm`.  Stage all of the changed
files, commit them, and then send a PR.  Once the PR is merged, the
updated packages will automatically be published to `npm`.

**NOTE:** The `publish/` prefix is necessary to prevent `rush change
-v` from being run in the release preparation PR!


# Installing your build
```
rush dogfood
```

This will globally install the @cadl-lang/compiler package, putting your
build of `cadl` on PATH, and install the VS Code extension if VS Code
is installed.

Note the important difference between this and the steps to run and
debug the VS Code extension above: the `dogfood` command installs the
Cadl extension with your changes in regular, non-experimental instance
of VS Code, meaning you will have it always, and not only when running
the debug steps above. This is exactly like using `cadl vscode
install`, only instead of downloading the latest release, it uses a
build with your changes applied.

There is no automatic `dogfood` process for installing the VS
extension non-experimentally, but if you build the cadl-vs project from
the command line following the steps above, or build its Release
configuration in Visual Studio, then you can install it by
double-clicking on packages/cadl-vs/Microsoft.Cadl.VisualStudio.vsix
that gets produced.
