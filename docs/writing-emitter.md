# Writing an emitter

An emitter is a cadl package that can consume the compiler Cadl Program and produce any new artifact(openapi spec, python client SDK, etc.)

## Prerequisite

- Setup Cadl
- Setup a new Cadl package

## Basics

An emitter in its most basic form is just a Cadl package that export an `$onEmit` hook.

```ts
import { Program } from "@cadl-lang/compiler";
export function $onEmit(program: Program) {
  // emitter logic can happen here.
}
```

## Emitter options

See [emitter options vs decorator](#emitter-options-vs-decorator) for when to emitter options.

## Guidelines

### Emitter options vs decorator

An emitter can both define some emitter options as well as provide some decorators to be used in the Cadl spec.

When wanting to let user add some customization specific to your emitter which one should you use?

- **Decorators**: Cadl is meant to describe the service not just the api. This include the generated client, server and other artifact.
  - Use decorator when configuration affect the logical representation of the artifact.
- **Emitter options**: Emitter options are meant to be used to configure the emitted artifacts, this is for example the file name(s)

#### Examples

- Line endings: This only affect the way the generated content gets written so this should be an **emitter option**
-
