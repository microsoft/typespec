# TypeSpec Samples

This project has a collection of samples used to demonstrate and test various TypeSpec features.

It is not published as an npm package.

Samples should teach a distinct TypeSpec concept or realistic workflow. Narrow protocol test
cases belong in the relevant package test suite instead of this collection.

Each sample directory has a `sample-config.yaml` containing a unique `title` and a
`description`. Set `playground: false` for samples that require multiple files or are not suitable
for the playground. A directory config uses `directory: true` and can provide a gallery `label`,
`order`, or an inherited `playground: false`.

```bash
npm run test    # Check Samples match snapshots
npm run test:ci # run test same as CI

npm run test:regen -- -g "<sample-name>" # Regen of this name

npm run regen-samples # Regen all samples.
```
