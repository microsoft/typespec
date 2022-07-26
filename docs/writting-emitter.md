# Writting an emitter

An emitter is a cadl package that can consume the compiler Cadl Program and produce any new artifact(openapi spec, python client SDK, etc.)

## Guidelines

### Emitter options vs decorator

An emitter can both define some emitter options as well as provide some decorators to be used in the Cadl spec.

When should you use which one?
