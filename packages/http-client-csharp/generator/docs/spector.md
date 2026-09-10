<!-- cspell:ignore Spector -->

By default all tests under the [http-specs folder](https://github.com/microsoft/typespec/tree/main/packages/http-specs/specs/) will be generated. In order to get coverage for a test within one of the specs you must write a test case that executes the operation.

## Generating Spector libraries

Each spec will be generated when running `./eng/scripts/Generate.ps1` within the same folder structure it exists in the http-specs package. As an example [http/authentication/api-key](https://github.com/microsoft/typespec/tree/main/packages/http-specs/specs/authentication/api-key)
will live in the following folder inside the Spector test projects

![alt text](generation-structure.png)

The files that get generated here will only be stubbed public APIs. This is done to minimize the size of the repo and reduce PR diff noise when an internal implementation is modified which can potentially effect every model. Seeing the same diff in hundreds of files doesn't provide value it only introduces noise.

If you want to manually generate the non stubbed version you can call Generate.ps1 with the name of the project you want to generate and set Stubbed to false.
For example if you want to generate the non stubbed version of `http/authentication/api-key` you can do the following.

```powershell
./eng/scripts/Generate.ps1 http/authentication/api-key -Stubbed $false
```

## Writing Spector tests

Generating the stubs allows us write tests against the public API surface that will compile. To do this we add a test class in same folder structure although this time we will modify the casing slightly to match dotnet standards.

![alt text](test-structure.png)

In this ApiKeyTests.cs we can write tests against the generated stubs like the following.

```C#
[SpectorTest]
public Task Valid() => Test(async (host) =>
{
    ClientResult response = await new ApiKeyClient(host, new ApiKeyCredential("valid-key"), null).ValidAsync();
    Assert.AreEqual(204, response.GetRawResponse().Status);
});
```

This test validates that we can successfully call the mock Spector service and verifies that we receive a successful response with code 204. Notice that we are using `SpectorTest` attribute instead of the standard NUnit `Test` attribute. This is because the test will not complete successfully against the stub and we must generate the full library before running the test.

The `SpectorTest` attribute will dynamically determine if the library is stubbed and mark the step as `Ignore` if it is. If it is not stubbed it will run the full test.

## Testing Spector scenarios

All of this is automated into a script called `./eng/scripts/Test-Spector.ps1`. This script will find all generated Spector projects and regenerate each of them without using the `StubLibraryGenerator`. It will then run dotnet test which will cause tests using the `SpectorTest` attribute to no longer be skipped. Finally it will restore the files back to the stubs if everything was successful and if not it will leave the files in place so you can investigate.

<details>
<Summary>Here is an example output for one library</Summary>

```
C:\repos\typespec\packages\http-client-csharp\eng\scripts [spector-rename +0 ~1 -0 !]> .\Test-Spector.ps1 authentication/api-key
Building emitter and generator
> npm run build:emitter

> @typespec/http-client-csharp@0.1.9 build:emitter
> tsc -p ./emitter/tsconfig.build.json

> dotnet build C:\repos\typespec\packages\http-client-csharp\eng/../generator/Microsoft.TypeSpec.Generator.ClientModel.StubLibrary/src
MSBuild version 17.9.8+610b4d3b5 for .NET
  Determining projects to restore...
  All projects are up-to-date for restore.
  Microsoft.TypeSpec.Generator.Input -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Microsoft.TypeSpec.Generator.Input\Debug\net8.0\Microsoft.TypeSpec.Generator.Input.dll
  Microsoft.TypeSpec.Generator -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Microsoft.TypeSpec.Generator\Debug\net8.0\Microsoft.TypeSpec.Generator.dll
  Microsoft.TypeSpec.Generator.ClientModel -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Microsoft.TypeSpec.Generator.ClientModel\Debug\net8.0\Microsoft.TypeSpec.Generator.ClientModel.dll
  Copying output to dist path
  Microsoft.TypeSpec.Generator.ClientModel.StubLibrary -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Microsoft.TypeSpec.Generator.ClientModel.StubLibrary\Debug\net8.0\Microsoft.TypeSpec.Generator.ClientModel.StubLibrary.dll
  Copying output to dist path

Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:00.90
Regenerating authentication\api-key
> npx tsp compile C:\repos\typespec\packages\http-client-csharp\node_modules\@typespec\http-specs\specs\authentication\api-key\main.tsp --trace @typespec/http-client-csharp --emit @typespec/http-client-csharp --option @typespec/http-client-csharp.emitter-output-dir=C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key --option @typespec/http-client-csharp.save-inputs=true
TypeSpec compiler v0.64.0

trace @typespec/http-client-csharp.info: Checking if C:/repos/typespec/packages/http-client-csharp/generator/TestProjects/Spector/http/authentication/api-key/src/Authentication.ApiKey.csproj exists
trace @typespec/http-client-csharp.info: dotnet --roll-forward Major C:/repos/typespec/packages/http-client-csharp/dist/generator/Microsoft.TypeSpec.Generator.dll C:/repos/typespec/packages/http-client-csharp/generator/TestProjects/Spector/http/authentication/api-key -p ScmCodeModelGenerator
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\Internal\CodeGenTypeAttribute.cs
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\Internal\CodeGenMemberAttribute.cs
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\Internal\CodeGenSuppressAttribute.cs
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\Internal\CodeGenSerializationAttribute.cs
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\Internal\Argument.cs
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\ApiKeyClient.cs
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\ApiKeyClient.RestClient.cs
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\ApiKeyClientOptions.cs
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\Internal\TypeFormatters.cs
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\Internal\ClientPipelineExtensions.cs
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\Internal\ErrorResult.cs
Writing C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key\src\Generated\Internal\ClientUriBuilder.cs
Compilation completed successfully.

Testing authentication\api-key
> dotnet test C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector.Tests\TestProjects.Spector.Tests.csproj --filter "FullyQualifiedName~TestProjects.Spector.Tests.Http.Authentication.ApiKey"
  Determining projects to restore...
  All projects are up-to-date for restore.
  Encode.Duration -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Encode.Duration\Debug\netstandard2.0\Encode.Duration.dll
  Client.Structure.Service.Default -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Client.Structure.Service.Default\Debug\netstandard2.0\Client.Structure.Service.Default.dll
  Parameters.CollectionFormat -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Parameters.CollectionFormat\Debug\netstandard2.0\Parameters.CollectionFormat.dll
  Payload.MediaType -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Payload.MediaType\Debug\netstandard2.0\Payload.MediaType.dll
  Parameters.Basic -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Parameters.Basic\Debug\netstandard2.0\Parameters.Basic.dll
  Client.Structure.Service.Multi.Client -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Client.Structure.Service.Multi.Client\Debug\netstandard2.0\
  Client.Structure.Service.Multi.Client.dll
  Encode.Bytes -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Encode.Bytes\Debug\netstandard2.0\Encode.Bytes.dll
  Encode.Datetime -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Encode.Datetime\Debug\netstandard2.0\Encode.Datetime.dll
  Payload.JsonMergePatch -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Payload.JsonMergePatch\Debug\netstandard2.0\Payload.JsonMergePatch.dll
  Authentication.OAuth2 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Authentication.OAuth2\Debug\netstandard2.0\Authentication.OAuth2.dll
  Client.Structure.Service -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Client.Structure.Service\Debug\netstandard2.0\Client.Structure.Service.dll
  Parameters.Spread -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Parameters.Spread\Debug\netstandard2.0\Parameters.Spread.dll
  Type.Array -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Array\Debug\netstandard2.0\Type.Array.dll
  Payload.ContentNegotiation -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Payload.ContentNegotiation\Debug\netstandard2.0\Payload.ContentNegotiation.dll
  Encode.Numeric -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Encode.Numeric\Debug\netstandard2.0\Encode.Numeric.dll
  Authentication.Http.Custom -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Authentication.Http.Custom\Debug\netstandard2.0\Authentication.Http.Custom.dll
  Type.Enum.Fixed -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Enum.Fixed\Debug\netstandard2.0\Type.Enum.Fixed.dll
  Client.Structure.Service.TwoOperationGroup -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Client.Structure.Service.TwoOperationGroup\Debug\netstandard2.0\Client.Structure.Service.TwoOperationGroup.dll
  Type.Enum.Extensible -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Enum.Extensible\Debug\netstandard2.0\Type.Enum.Extensible.dll
  Parameters.BodyOptionality -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Parameters.BodyOptionality\Debug\netstandard2.0\Parameters.BodyOptionality.dll
  Authentication.Union -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Authentication.Union\Debug\netstandard2.0\Authentication.Union.dll
  Client.Structure.Service.Renamed.Operation -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Client.Structure.Service.Renamed.Operation\Debug\netstandard2.0\Client.Structure.Service.Renamed.Operation.dll
  Resiliency.SrvDriven.V2 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Resiliency.SrvDriven.V2\Debug\netstandard2.0\Resiliency.SrvDriven.V2.dll
  Type.Model.Inheritance.EnumDiscriminator -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Model.Inheritance.EnumDiscriminator\Debug\netstandard2.0\Type.Model.Inheritance.EnumDiscriminator.dll
  Serialization.EncodedName.Json -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Serialization.EncodedName.Json\Debug\netstandard2.0\Serialization.EncodedName.Json.dll
  SpecialHeaders.Repeatability -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\SpecialHeaders.Repeatability\Debug\netstandard2.0\SpecialHeaders.Repeatability.dll
  Server.Endpoint.NotDefined -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Server.Endpoint.NotDefined\Debug\netstandard2.0\Server.Endpoint.NotDefined.dll
  Type.Property.Nullable -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Property.Nullable\Debug\netstandard2.0\Type.Property.Nullable.dll
  Type.Model.Inheritance.SingleDiscriminator -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Model.Inheritance.SingleDiscriminator\Debug\netstandard2.0\Type.Model.Inheritance.SingleDiscriminator.dll
  Server.Path.Single -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Server.Path.Single\Debug\netstandard2.0\Server.Path.Single.dll
  Server.Path.Multiple -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Server.Path.Multiple\Debug\netstandard2.0\Server.Path.Multiple.dll
  Type.Model.Usage -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Model.Usage\Debug\netstandard2.0\Type.Model.Usage.dll
  Payload.MultiPart -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Payload.MultiPart\Debug\netstandard2.0\Payload.MultiPart.dll
  Authentication.ApiKey -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Authentication.ApiKey\Debug\netstandard2.0\Authentication.ApiKey.dll
  Type.Model.Inheritance.NestedDiscriminator -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Model.Inheritance.NestedDiscriminator\Debug\netstandard2.0\Type.Model.Inheritance.NestedDiscriminator.dll
  Server.Versions.NotVersioned -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Server.Versions.NotVersioned\Debug\netstandard2.0\Server.Versions.NotVersioned.dll
  Routes -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Routes\Debug\netstandard2.0\Routes.dll
  SpecialHeaders.ConditionalRequest -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\SpecialHeaders.ConditionalRequest\Debug\netstandard2.0\SpecialHeaders.ConditionalRequest.dll
  Versioning.MadeOptional.V2 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.MadeOptional.V2\Debug\netstandard2.0\Versioning.MadeOptional.V2.dll
  SpecialWords -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\SpecialWords\Debug\netstandard2.0\SpecialWords.dll
  Type.Model.Empty -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Model.Empty\Debug\netstandard2.0\Type.Model.Empty.dll
  Type.Model.Inheritance.NotDiscriminated -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Model.Inheritance.NotDiscriminated\Debug\netstandard2.0\Type.Model.Inheritance.NotDiscriminated.dll
  Server.Versions.Versioned -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Server.Versions.Versioned\Debug\netstandard2.0\Server.Versions.Versioned.dll
  Type.Dictionary -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Dictionary\Debug\netstandard2.0\Type.Dictionary.dll
  Versioning.MadeOptional.V1 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.MadeOptional.V1\Debug\netstandard2.0\Versioning.MadeOptional.V1.dll
  Type.Scalar -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Scalar\Debug\netstandard2.0\Type.Scalar.dll
  Versioning.Added.V2 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.Added.V2\Debug\netstandard2.0\Versioning.Added.V2.dll
  Versioning.Added.V1 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.Added.V1\Debug\netstandard2.0\Versioning.Added.V1.dll
  Type.Property.Optional -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Property.Optional\Debug\netstandard2.0\Type.Property.Optional.dll
  Resiliency.SrvDriven.V1 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Resiliency.SrvDriven.V1\Debug\netstandard2.0\Resiliency.SrvDriven.V1.dll
  Type.Property.ValueTypes -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Property.ValueTypes\Debug\netstandard2.0\Type.Property.ValueTypes.dll
  Versioning.RenamedFrom.V2 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.RenamedFrom.V2\Debug\netstandard2.0\Versioning.RenamedFrom.V2.dll
  Versioning.ReturnTypeChangedFrom.V1 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.ReturnTypeChangedFrom.V1\Debug\netstandard2.0\Versioning.ReturnTypeChangedFrom.V1.dll
  Type.Union -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Union\Debug\netstandard2.0\Type.Union.dll
  Versioning.TypeChangedFrom.V2 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.TypeChangedFrom.V2\Debug\netstandard2.0\Versioning.TypeChangedFrom.V2.dll
  Microsoft.TypeSpec.Generator.Input -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Microsoft.TypeSpec.Generator.Input\Debug\net8.0\Microsoft.TypeSpec.Generator.Input.dll
  Versioning.RenamedFrom.V1 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.RenamedFrom.V1\Debug\netstandard2.0\Versioning.RenamedFrom.V1.dll
  Versioning.Removed.V2 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.Removed.V2\Debug\netstandard2.0\Versioning.Removed.V2.dll
  Versioning.Removed.V2Preview -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.Removed.V2Preview\Debug\netstandard2.0\Versioning.Removed.V2Preview.dll
  Versioning.Removed.V1 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.Removed.V1\Debug\netstandard2.0\Versioning.Removed.V1.dll
  Versioning.TypeChangedFrom.V1 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.TypeChangedFrom.V1\Debug\netstandard2.0\Versioning.TypeChangedFrom.V1.dll
  Versioning.ReturnTypeChangedFrom.V2 -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Versioning.ReturnTypeChangedFrom.V2\Debug\netstandard2.0\Versioning.ReturnTypeChangedFrom.V2.dll
  Type.Model.Visibility -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Model.Visibility\Debug\netstandard2.0\Type.Model.Visibility.dll
  Type.Property.AdditionalProperties -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Property.AdditionalProperties\Debug\netstandard2.0\Type.Property.AdditionalProperties.dll
  Type.Model.Inheritance.Recursive -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Type.Model.Inheritance.Recursive\Debug\netstandard2.0\Type.Model.Inheritance.Recursive.dll
  Microsoft.TypeSpec.Generator -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Microsoft.TypeSpec.Generator\Debug\net8.0\Microsoft.TypeSpec.Generator.dll
  Microsoft.TypeSpec.Generator.Tests.Common -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\Microsoft.TypeSpec.Generator.Tests.Common\Debug\net8.0\
  Microsoft.TypeSpec.Generator.Tests.Common.dll
  TestProjects.Spector.Tests -> C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\TestProjects.Spector.Tests\Debug\net8.0\TestProjects.Spector.Tests.dll Test run for C:\repos\typespec\packages\http-client-csharp\generator\artifacts\bin\TestProjects.Spector.Tests\Debug\net8.0\TestProjects.Spector.Tests.dll (.NETCoreApp,Version=v8.0)
Microsoft (R) Test Execution Command Line Tool Version 17.9.0 (x64)
Copyright (c) Microsoft Corporation.  All rights reserved.

Starting test execution, please wait...
A total of 1 test files matched the specified pattern.

Passed!  - Failed:     0, Passed:     2, Skipped:     0, Total:     2, Duration: 2 s - TestProjects.Spector.Tests.dll (net8.0)
Restoring authentication\api-key
> git clean -xfd C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key
Removing ../generator/TestProjects/Spector/http/authentication/api-key/src/Generated/ApiKeyClient.RestClient.cs
Removing ../generator/TestProjects/Spector/http/authentication/api-key/src/Generated/Internal/Argument.cs
Removing ../generator/TestProjects/Spector/http/authentication/api-key/src/Generated/Internal/ClientPipelineExtensions.cs
Removing ../generator/TestProjects/Spector/http/authentication/api-key/src/Generated/Internal/ClientUriBuilder.cs
Removing ../generator/TestProjects/Spector/http/authentication/api-key/src/Generated/Internal/ErrorResult.cs
Removing ../generator/TestProjects/Spector/http/authentication/api-key/src/Generated/Internal/TypeFormatters.cs
> git restore C:\repos\typespec\packages\http-client-csharp\generator\TestProjects\Spector\http\authentication\api-key
```

</details>

## Debugging generation of a Spector library

If you want to debug the generation of one of the Spector libraries you can do this with the `StubLibraryGenerator`. There are launch settings for each Spector test which are already configured to use this generator.

![alt text](launch-settings.png)

The generator does not skip generating the methods bodies and xml docs it simply removes them before saving the files to disk. Therefore you can break at any point and debug any part of the full generation without needing to constantly flip the generator being used back and forth.

## Debugging Spector tests

To debug one of the `SpectorTest` you will need to generate the non stubbed library first by calling Generate.ps1 with Stubbed set to false.

```powershell
./eng/scripts/Generate.ps1 http/authentication/api-key -Stubbed $false
```

If you don't do this the test will be ignored by `SpectorTest` attribute since you cannot run a test when the library has no implementation.

## Problematic specs

The `./eng/scripts/Generate.ps1` script allows you to exclude a problematic spec by adding it to the `$failingSpecs` list. Ideally no specs should be here, but if we need to we can temporarily add items to the list and create tracking issues in github to remove them at a later time.
