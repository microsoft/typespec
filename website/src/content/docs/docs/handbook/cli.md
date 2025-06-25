---
id: cli
title: Cli usage
---

See full usage documentation by typing `tsp --help`:

```bash
>tsp --help
TypeSpec compiler v0.36.1

tsp <command>

Commands:
  tsp compile <path>       Compile TypeSpec source.
  tsp code                 Manage VS Code Extension.
  tsp vs                   Manage Visual Studio Extension.
  tsp format <include...>  Format given list of TypeSpec files.
  tsp init [templatesUrl]  Create a new TypeSpec project.
  tsp install              Install TypeSpec dependencies
  tsp info                 Show information about the current TypeSpec compiler.

Options:
  --help     Show help                                                 [boolean]
  --debug    Output debug log messages.               [boolean] [default: false]
  --pretty   Enable color and formatting in TypeSpec's output to make compiler error
             s easier to read.                         [boolean] [default: true]
  --version  Show version number                                       [boolean]
```
