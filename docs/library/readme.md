# Writing a Cadl package(Library or/and emitter)

A Cadl package is a node package that provide either(or both):

- Cadl construct: Models, enums, etc and decorators
- An emitter

This guide will explain on how to setup a new package boilerplate. For documention on how to write the content see:

- [Library (TODO)]()
- [Emitter][emitter]

## Setup

**NOTE** This guide assume a standalone library(not in a monorepo with another package management system)

### 1. Create node package

Create a new directory for you package and run in it:

```bash
npm init
```

Answer the prompts for your package and this should create a `package.json` file.

### 2. Add CADL dependencies to `package.json`

Add the Cadl compiler and other cadl library you might want a dependency on to the `peerDependencies` entry. Create it at the root if not present.

Look for the version on [npmjs.com](https://www.npmjs.com/)

```jsonc
{
  "peerDependencies": {
    "@cadl-lang/compiler": "~<version>",

    // Other libraries for example
    "@cadl-lang/rest": "~<version>",
    "@cadl-lang/versioning": "~<version>"
  }
}
```

Alternatively you can run `npm install @cadl-lang/compiler @cadl-lang/rest` which will automatically add those packages to `dependencies` entry using the latest version. They SHOULD then move the entry under `peerDepdendencies`. Not doing so risk duplicate library loading which will cause issue in the Cadl Compiler.

After this you can run this to install the dependencies.

```bash
npm install
```

### 3. Update pacakge type to be `module`

Add this entry to the `package.json`

```jsonc
{
  "type": "module"
}
```

Cadl is using ES Modules and expect library to do the same.

### 4. Fill extra field in `package.json`

There is a few extra field that are used for documentation/reference in Cadl and is good practice to fill.

```jsonc
{
  "bugs": {
    "url": "https://github.com/foo/bar/issues" // Where bugs should be filled for that package.
  }
}
```

### 5. [Optional] Setup typescript

If the Cadl package is going to have Javascript code for decorators or emitter, typescript can be used instead.

For that refer to [Typescript documentation](https://www.typescriptlang.org/download)

### 6. Write library or emitter

See coresponding documentation

- [Library (TODO)](): For Cadl construct and decorators
- [Emitter][emitter]: For emitting output from the Cadl program

[library]: ./writing-library.md
[emitter]: ./writing-emitter.md
