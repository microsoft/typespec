# Using spector

Install `spector` CLI globally or as a local dependency:

- **Globally**: run `npm install -g @typespec/spector`. You can then use `tsp-spector` as a CLI tool.
- **Locally**: run `npm install @typespec/spector` which should add the dependency to package.json. You can then use `tsp-spector` with `npx tsp-spector`.

**NOTE** With local install you'll need to prefix `tsp-spector` with `npx`(unless commands are written directly as npm scripts)

## Test against scenarios

### Spector Config

Spector supports a config file where you can configure scenarios that are not supported by your generator.

Create a `spector-config.yaml` file.

```yaml
# List of unsupported scenarios
unsupportedScenarios:
  - Foo_Bar
```

### Run mock api server

```bash
# Minimal
tsp-spector serve ./path/to/scenarios

# Change the port
tsp-spector serve ./path/to/scenarios --port 1234

# Specify where the coverage file should go
tsp-spector serve ./path/to/scenarios --coverageFile ./path/to/spector-coverage.json
```

Alternative to start in background

```bash
tsp-spector server start ./path/to/scenarios # Takes the same arguments as serve
```

### Stop running server

```bash
tsp-spector server stop             # Stop at the default port
tsp-spector server stop --port 1234 # If started the server at another port
```

### Validate and merge coverage

```bash
# Minimal
tsp-spector check-coverage ./path/to/scenarios

# Path to tsp-spector config file for generator
tsp-spector check-coverage ./path/to/scenarios --configFile ./spector-config.yaml

# In case where there was multiple serve instance each creating their own coverage file
tsp-spector check-coverage ./path/to/scenarios --coverageFiles ./path/to/*-coverage.json --coverageFiles ./other/to/*-coverage.json

# Specify where the merged coverage file should go
tsp-spector check-coverage ./path/to/scenarios --mergedCoverageFile ./path/to/spector-final-coverage.json
```

### Upload coverage

Upload the coverage. Upload from the `main` branch. DO NOT upload on PR this WILL override the latest index.

```bash
# Minimal
tsp-spector upload-coverage --generatorName typescript --version=0.1.0

# Specify Coverage file
tsp-spector upload-coverage --generatorName typescript --version=0.1.0 --coverageFile ./path/to/spector-final-coverage.json
```

Options:

- `--storageAccountName`: Name of the storage account to publish coverage. Use `typespec` for Spector/Azure Spector dashboard.
- `--generatorName`: Name of the generator. Must be one of `"@typespec/http-client-python", "@typespec/http-client-csharp", "@azure-tools/typespec-ts-rlc", "@azure-tools/typespec-ts-modular", "@typespec/http-client-js", "@typespec/http-client-java"`.
- `--generatorVersion`: Version of the generator
- `--coverageFile`: Path to the coverage file

#### Upload in azure devops

**This is applicable in the azure-sdk/internal ado project only.**

Add the following step

```yaml
- task: AzureCLI@2
  displayName: Upload scenario coverage
  inputs:
    azureSubscription: "Typespec Storage"
    scriptType: "bash"
    scriptLocation: "inlineScript"
    inlineScript: `tsp-spector upload-coverage --storageAccountName typespec --containerName coverages --generatorMode standard  ... FILL options fitting your generator here as described above...`
```
