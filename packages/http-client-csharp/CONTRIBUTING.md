# Contributing

## PR Process

When making changes to `@typespec/http-client-csharp`, the downstream effects on the Azure SDK for .NET need to be considered.

### Automated PR Creation

The publishing pipeline for `@typespec/http-client-csharp` includes automated steps to create a PR in the [azure-sdk-for-net](https://github.com/Azure/azure-sdk-for-net) repository to update the dependency on `Microsoft.TypeSpec.Generator.ClientModel`.

The process works as follows:

1. Create your PR to the [microsoft/typespec](https://github.com/microsoft/typespec) repository for `@typespec/http-client-csharp`
2. After your PR is merged and a release happens, the publishing pipeline will:
   a. Publish the NuGet packages
   b. Automatically create a PR in [azure-sdk-for-net](https://github.com/Azure/azure-sdk-for-net) to update the dependency

3. The automated PR in azure-sdk-for-net will:
   - Update the package references in Directory.Packages.props
   - Include a reference to the original TypeSpec PR
   - Include details about the changes

4. Once the PR in azure-sdk-for-net is merged, the update is complete

### Manual Process (if automation fails)

If the automated PR creation fails, you can manually create the PR following these steps:

1. Clone the azure-sdk-for-net repository
2. Create a new branch
3. Update the package references in Directory.Packages.props
4. Create a PR with a description referencing the TypeSpec PR