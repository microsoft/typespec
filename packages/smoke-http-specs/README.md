# Smoke Http Specs

This package contains all the scenarios that should be supported by a client & service generator.

## Development

1. [FOLLOW THE MONOREPO INSTRUCTION](https://github.com/microsoft/typespec) to get the environment setup.
2. Scenarios should be in `./specs` folder

#### Update version for release

```bash
pnpm change version --only "@typespec/smoke-http-specs"
```

Push the changes in branch named after the pattern `publish/xyz`. Once merged, the package will be auto-released.
