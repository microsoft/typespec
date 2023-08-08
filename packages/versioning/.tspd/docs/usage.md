### Consuming versioning library from an emitter

#### Get the service representation at a given version

Versioning library works with projection to project the service at a given version.

```ts
// Get a list of all the different version of the service and the projections
const projections = buildVersionProjections(program, serviceNamespace);

for (const projection of projections) {
  const projectedProgram = projectProgram(program, projection.projections);
  // projectedProgram now contains the representation of the service at the given version.
}
```

#### Get list of versions and version dependency across namespaces

Versioning library works with projection to project the service at a given version.

```ts
const versions = resolveVersions(program, serviceNamespace);
// versions now contain a list of all the version of the service namespace and what version should all the other dependencies namespace use.
```

#### Consume versioning manually

If the emitter needs to have the whole picture of the service evolution across the version then using the decorator accessor will provide the metadata for each type:

- `getAddedOn`
- `getRemovedOn`
- `getRenamedFromVersion`
- `getMadeOptionalOn`
