// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using Microsoft.TypeSpec.Generator.Tests.Writers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.SourceInput.CompilerBuildInputProof;

namespace Microsoft.TypeSpec.Generator.Tests.SourceInput
{
    [NonParallelizable]
    internal class BuildHostGenerationTests
    {
        [Test]
        public async Task TrustedBuildSessionWritesOnlyToIsolatedOutputAndUsesSeparateProof()
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-generation", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            var generated = Path.Combine(original, "src", "Generated");
            Directory.CreateDirectory(generated);
            Directory.CreateDirectory(isolated);
            var keep = Path.Combine(generated, "Keep.cs");
            const string originalContent = "// Existing generated source must not be deleted or replaced.\n";
            File.WriteAllText(keep, originalContent);
            var external = Path.Combine(directory, "linked.cs");
            File.WriteAllText(external, "namespace Other { class Unrelated {} }");
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var owner = new FieldOwner(target.Type);
                var generator = new ControlledGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(owner, target));
                CodeModelGenerator.Instance = generator;
                var session = new FixtureSession(original, external);

                await ExecuteIsolated(new CSharpGen(), isolated, session);

                Assert.That(File.Exists(keep), Is.True);
                Assert.That(await File.ReadAllTextAsync(keep), Is.EqualTo(originalContent));
                Assert.That(File.Exists(Path.Combine(original, "Clock.cs")), Is.False);
                Assert.That(File.Exists(Path.Combine(isolated, "Clock.cs")), Is.True);
                Assert.That(File.Exists(Path.Combine(isolated, "Widget.cs")), Is.True);
                Assert.That(session.Checks, Is.GreaterThan(2), "The live proof must be consumed by the field writer.");
                StringAssert.Contains("private Widget _value;", await File.ReadAllTextAsync(Path.Combine(isolated, "Clock.cs")));
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [TestCase("default")]
        [TestCase("disabled")]
        [TestCase("rewriter")]
        public async Task DisabledPolicyDoesNotConsultBuildSession(string mode)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-disabled", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            Directory.CreateDirectory(original);
            Directory.CreateDirectory(isolated);
            var external = Path.Combine(directory, "linked.cs");
            File.WriteAllText(external, "namespace Other { class Unrelated {} }");
            try
            {
                var options = mode switch
                {
                    "disabled" => "\"enable-pre-emission-simplification\":true,\"disable-roslyn-reduce\":true,",
                    "rewriter" => "\"enable-pre-emission-simplification\":true,",
                    _ => string.Empty
                };
                var json = "{" + options + "\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var owner = new FieldOwner(target.Type);
                var generator = new ControlledGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(owner, target));
                if (mode == "rewriter")
                {
                    generator.AddRewriter(new TestRewriter());
                }
                CodeModelGenerator.Instance = generator;
                var session = new FixtureSession(original, external);

                await ExecuteIsolated(new CSharpGen(), isolated, session);

                Assert.That(session.Checks, Is.Zero);
                Assert.That(File.Exists(Path.Combine(isolated, "Clock.cs")), Is.True);
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [TestCase("default")]
        [TestCase("disabled")]
        [TestCase("rewriter")]
        [TestCase("writer")]
        [TestCase("unsupported-proof")]
        public async Task ExistingProjectBootstrapsWhenPreparationIsUnavailable(string mode)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-bootstrap", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            var projectDirectory = Path.Combine(original, "src");
            Directory.CreateDirectory(Path.Combine(projectDirectory, "obj"));
            Directory.CreateDirectory(Path.Combine(projectDirectory, "Generated"));
            Directory.CreateDirectory(isolated);
            var keep = Path.Combine(projectDirectory, "Generated", "Keep.cs");
            File.WriteAllText(keep, "// preserved\n");
            File.WriteAllText(Path.Combine(projectDirectory, "Sample.csproj"),
                "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><TargetFramework>net10.0</TargetFramework>" +
                "<EvaluationMarker>$([System.IO.Directory]::CreateDirectory('$(MSBuildProjectDirectory)/../../nested-msbuild-evaluated'))</EvaluationMarker>" +
                "</PropertyGroup></Project>");
            File.WriteAllText(Path.Combine(original, "NuGet.Config"), "<configuration><packageSources><clear /></packageSources></configuration>");
            var assets = Path.Combine(projectDirectory, "obj", "project.assets.json");
            File.WriteAllText(assets, AssetsForProject(Path.Combine(projectDirectory, "Sample.csproj")));
            var source = Path.Combine(directory, "linked.cs");
            File.WriteAllText(source, "namespace Other { class Unrelated {} }");
            var marker = Path.Combine(directory, "nested-msbuild-evaluated");
            var previousPropertyFunctions = Environment.GetEnvironmentVariable("MSBUILDENABLEALLPROPERTYFUNCTIONS");
            try
            {
                Environment.SetEnvironmentVariable("MSBUILDENABLEALLPROPERTYFUNCTIONS", "1");
                var options = mode switch
                {
                    "default" => string.Empty,
                    "disabled" => "\"enable-pre-emission-simplification\":true,\"disable-roslyn-reduce\":true,",
                    _ => "\"enable-pre-emission-simplification\":true,"
                };
                var json = "{" + options + "\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var output = new TestOutputLibrary(new FieldOwner(target.Type), target);
                var context = new GeneratorContext(mock.Object.Configuration);
                ControlledGenerator generator = mode == "writer"
                    ? new CustomizedWriterGenerator(context, mock.Object.InputLibrary, mock.Object.TypeFactory, output)
                    : new ControlledGenerator(context, mock.Object.InputLibrary, mock.Object.TypeFactory, output);
                if (mode == "rewriter")
                {
                    generator.AddRewriter(new TestRewriter());
                }
                CodeModelGenerator.Instance = generator;
                var session = new FixtureSession(original, source, assets, unsupported: mode == "unsupported-proof");

                var result = await new CSharpGen().ExecuteForCompilerBuildAsync(isolated, session);

                Assert.That(result.UsedCapturedResidualInputs, Is.False,
                    "A build host must reject isolated output without authoritative residual inputs.");
                Assert.That(session.Checks, Is.GreaterThan(0), "Project assets require a current build-owned session.");
                Assert.That(Directory.Exists(marker), Is.False, "Bootstrap must not invoke nested restore or MSBuild.");
                Assert.That(await File.ReadAllTextAsync(keep), Is.EqualTo("// preserved\n"));
                Assert.That(File.Exists(Path.Combine(isolated, "Clock.cs")), Is.True);
                if (mode == "disabled")
                {
                    StringAssert.Contains("global::Sample.Widget", await File.ReadAllTextAsync(Path.Combine(isolated, "Clock.cs")));
                }
            }
            finally
            {
                Environment.SetEnvironmentVariable("MSBUILDENABLEALLPROPERTYFUNCTIONS", previousPropertyFunctions);
                Directory.Delete(directory, recursive: true);
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task CapturedProjectAssetsResolveActualCustomizationDependency(bool groupOnly)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-assets-dependency", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            var projectDirectory = Path.Combine(original, "src");
            Directory.CreateDirectory(Path.Combine(projectDirectory, "obj"));
            Directory.CreateDirectory(isolated);
            var project = Path.Combine(projectDirectory, "Sample.csproj");
            const string package = "Sample.Dependency";
            const string version = "1.0.0";
            File.WriteAllText(project, $"<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><TargetFramework>net10.0</TargetFramework></PropertyGroup><ItemGroup><PackageReference Include=\"{package}\" Version=\"{version}\" /></ItemGroup></Project>");
            File.WriteAllText(Path.Combine(original, "NuGet.Config"), "<configuration><packageSources><clear /></packageSources></configuration>");
            var cache = Path.Combine(directory, "packages");
            var packageDirectory = Path.Combine(cache, package.ToLowerInvariant(), version);
            var library = Path.Combine(packageDirectory, "lib", "net10.0");
            Directory.CreateDirectory(library);
            var assembly = Path.Combine(library, package + ".dll");
            var fixtureCompilation = CSharpCompilation.Create(package,
                [CSharpSyntaxTree.ParseText("namespace Dependency { public class Marker {} }")],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(fixtureCompilation.Emit(assembly).Success, Is.True);
            File.WriteAllText(Path.Combine(packageDirectory, ".nupkg.metadata"),
                "{\"version\":2,\"contentHash\":\"OPrzAveg9k9KMJ4PmDoWCNlNRDiwpFsTJoo2gRWtO4RnJ9DrJ/7NOSLkNmXWORewNDc+2WVcbEhFJ8exdIzA8A==\",\"source\":\"https://example.invalid\"}");
            File.WriteAllText(Path.Combine(packageDirectory, package.ToLowerInvariant() + ".nuspec"),
                $"<package xmlns=\"http://schemas.microsoft.com/packaging/2013/05/nuspec.xsd\"><metadata><id>{package}</id><version>{version}</version><authors>Test</authors><description>Test fixture</description></metadata></package>");
            var libraries = new Dictionary<string, object>();
            var groups = new Dictionary<string, object>();
            if (groupOnly)
            {
                groups["net10.0"] = new[] { $"{package} >= {version}" };
            }
            else
            {
                libraries[$"{package}/{version}"] = new { type = "package" };
            }
            var targets = new Dictionary<string, object> { ["net10.0"] = libraries };
            var assets = Path.Combine(projectDirectory, "obj", "project.assets.json");
            File.WriteAllText(assets, JsonSerializer.Serialize(new
            {
                targets,
                projectFileDependencyGroups = groups,
                project = new { restore = new { projectPath = project } }
            }));
            var source = Path.Combine(directory, "linked.cs");
            File.WriteAllText(source, "namespace Other { class Unrelated {} }");
            var previousPackages = Environment.GetEnvironmentVariable("NUGET_PACKAGES");
            try
            {
                Environment.SetEnvironmentVariable("NUGET_PACKAGES", cache);
                const string json = "{\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var generator = new ControlledGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(new FieldOwner(target.Type), target));
                CodeModelGenerator.Instance = generator;

                var result = await new CSharpGen().ExecuteForCompilerBuildAsync(isolated, new FixtureSession(original, source, assets));

                Assert.That(result.UsedCapturedResidualInputs, Is.False, "The disabled policy does not certify host output.");
                Assert.That(generator.AdditionalMetadataReferences.Any(reference => reference.Display == assembly), Is.True);
                Assert.That(generator.SourceInputModel.Customization!.GetTypeByMetadataName("Dependency.Marker"), Is.Not.Null);
            }
            finally
            {
                Environment.SetEnvironmentVariable("NUGET_PACKAGES", previousPackages);
                Directory.Delete(directory, recursive: true);
            }
        }

        [Test]
        public async Task MalformedAssetTargetsCannotHideARequiredCustomizationDependency()
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-assets-malformed", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            var projectDirectory = Path.Combine(original, "src");
            Directory.CreateDirectory(Path.Combine(projectDirectory, "obj"));
            Directory.CreateDirectory(Path.Combine(projectDirectory, "Generated"));
            Directory.CreateDirectory(isolated);
            var project = Path.Combine(projectDirectory, "Sample.csproj");
            File.WriteAllText(project,
                "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><TargetFramework>net10.0</TargetFramework></PropertyGroup>" +
                "<ItemGroup><PackageReference Include=\"Sample.Dependency\" Version=\"1.0.0\" /></ItemGroup></Project>");
            File.WriteAllText(Path.Combine(projectDirectory, "Customization.cs"),
                "namespace Sample { class CustomUsesDependency { public Dependency.Marker Value; } }");
            var keep = Path.Combine(projectDirectory, "Generated", "Keep.cs");
            File.WriteAllText(keep, "// preserved\n");
            var assets = Path.Combine(projectDirectory, "obj", "project.assets.json");
            File.WriteAllText(assets, JsonSerializer.Serialize(new
            {
                targets = Array.Empty<object>(),
                projectFileDependencyGroups = new { },
                project = new { restore = new { projectPath = project } }
            }));
            var source = Path.Combine(directory, "linked.cs");
            File.WriteAllText(source, "namespace Other { class Unrelated {} }");
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var generator = new ControlledGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(new FieldOwner(target.Type), target));
                CodeModelGenerator.Instance = generator;

                var error = Assert.ThrowsAsync<InvalidOperationException>(async () => await ExecuteIsolated(new CSharpGen(), isolated, new FixtureSession(original, source, assets)),
                    "A malformed targets inventory cannot certify a project with customization dependencies.");

                StringAssert.Contains("captured project assets", error!.Message);
                Assert.That(await File.ReadAllTextAsync(keep), Is.EqualTo("// preserved\n"));
                Assert.That(generator.IsCompilerBuildHost, Is.False);
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [TestCase("duplicate-type")]
        [TestCase("leading-group")]
        [TestCase("invalid-version")]
        [TestCase("invalid-group-version")]
        public async Task AmbiguousAssetInventoryCannotHideARequiredCustomizationDependency(string kind)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-assets-ambiguous", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            var projectDirectory = Path.Combine(original, "src");
            Directory.CreateDirectory(Path.Combine(projectDirectory, "obj"));
            Directory.CreateDirectory(Path.Combine(projectDirectory, "Generated"));
            Directory.CreateDirectory(isolated);
            var project = Path.Combine(projectDirectory, "Sample.csproj");
            File.WriteAllText(project,
                "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><TargetFramework>net10.0</TargetFramework></PropertyGroup>" +
                "<ItemGroup><PackageReference Include=\"Sample.Dependency\" Version=\"1.0.0\" /></ItemGroup></Project>");
            File.WriteAllText(Path.Combine(projectDirectory, "Customization.cs"),
                "namespace Sample { class CustomUsesDependency { public Dependency.Marker Value; } }");
            var keep = Path.Combine(projectDirectory, "Generated", "Keep.cs");
            File.WriteAllText(keep, "// preserved\n");
            var assets = Path.Combine(projectDirectory, "obj", "project.assets.json");
            string content;
            if (kind == "duplicate-type")
            {
                content = "{\"targets\":{\"net10.0\":{\"Sample.Dependency/1.0.0\":{\"type\":\"package\",\"type\":\"project\"}}}," +
                    "\"projectFileDependencyGroups\":{},\"project\":{\"restore\":{\"projectPath\":" + JsonSerializer.Serialize(project) + "}}}";
            }
            else
            {
                var libraries = kind == "invalid-version"
                    ? new Dictionary<string, object> { ["Sample.Dependency/not-a-version"] = new { type = "package" } }
                    : new Dictionary<string, object>();
                var groups = kind switch
                {
                    "leading-group" => new Dictionary<string, object> { ["net10.0"] = new[] { " Sample.Dependency >= 1.0.0" } },
                    "invalid-group-version" => new Dictionary<string, object> { ["net10.0"] = new[] { "Sample.Dependency >= not-a-version" } },
                    _ => new Dictionary<string, object>()
                };
                content = JsonSerializer.Serialize(new
                {
                    targets = new Dictionary<string, object> { ["net10.0"] = libraries },
                    projectFileDependencyGroups = groups,
                    project = new { restore = new { projectPath = project } }
                });
            }
            File.WriteAllText(assets, content);
            var source = Path.Combine(directory, "linked.cs");
            File.WriteAllText(source, "namespace Other { class Unrelated {} }");
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var generator = new ControlledGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(new FieldOwner(target.Type), target));
                CodeModelGenerator.Instance = generator;

                var error = Assert.ThrowsAsync<InvalidOperationException>(async () => await ExecuteIsolated(new CSharpGen(), isolated, new FixtureSession(original, source, assets)),
                    "An ambiguous dependency inventory must not be accepted by the host.");

                StringAssert.Contains("captured project assets", error!.Message);
                Assert.That(await File.ReadAllTextAsync(keep), Is.EqualTo("// preserved\n"));
                Assert.That(generator.IsCompilerBuildHost, Is.False);
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [Test]
        public async Task AssetsForAnotherProjectCannotBootstrapTheGeneratorProject()
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-assets-project", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            var projectDirectory = Path.Combine(original, "src");
            Directory.CreateDirectory(Path.Combine(projectDirectory, "obj"));
            Directory.CreateDirectory(Path.Combine(projectDirectory, "Generated"));
            Directory.CreateDirectory(isolated);
            var keep = Path.Combine(projectDirectory, "Generated", "Keep.cs");
            File.WriteAllText(keep, "// preserved\n");
            File.WriteAllText(Path.Combine(projectDirectory, "Sample.csproj"),
                "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><TargetFramework>net10.0</TargetFramework></PropertyGroup></Project>");
            var otherProject = Path.Combine(directory, "other", "Other.csproj");
            Directory.CreateDirectory(Path.GetDirectoryName(otherProject)!);
            File.WriteAllText(otherProject,
                "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><TargetFramework>net10.0</TargetFramework></PropertyGroup></Project>");
            var assets = Path.Combine(projectDirectory, "obj", "project.assets.json");
            File.WriteAllText(assets, JsonSerializer.Serialize(new
            {
                targets = new { },
                projectFileDependencyGroups = new { },
                project = new { restore = new { projectPath = otherProject } }
            }));
            var source = Path.Combine(directory, "linked.cs");
            File.WriteAllText(source, "namespace Other { class Unrelated {} }");
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var generator = new ControlledGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(new FieldOwner(target.Type), target));
                CodeModelGenerator.Instance = generator;

                Assert.ThrowsAsync<InvalidOperationException>(async () => await ExecuteIsolated(new CSharpGen(), isolated, new FixtureSession(original, source, assets)),
                    "A captured asset file for a different project cannot authorize bootstrap.");

                Assert.That(await File.ReadAllTextAsync(keep), Is.EqualTo("// preserved\n"));
                Assert.That(generator.IsCompilerBuildHost, Is.False);
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [Test]
        public async Task IsolatedGenerationDoesNotRunNestedRestoreOrProjectEvaluation()
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-no-restore", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            var projectDirectory = Path.Combine(original, "src");
            Directory.CreateDirectory(Path.Combine(projectDirectory, "obj"));
            Directory.CreateDirectory(isolated);
            var project = Path.Combine(projectDirectory, "Sample.csproj");
            File.WriteAllText(project,
                "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><TargetFramework>net10.0</TargetFramework>" +
                "<EvaluationMarker>$([System.IO.Directory]::CreateDirectory('$(MSBuildProjectDirectory)/../../nested-msbuild-evaluated'))</EvaluationMarker>" +
                "</PropertyGroup></Project>");
            File.WriteAllText(Path.Combine(original, "NuGet.Config"), "<configuration><packageSources><clear /></packageSources></configuration>");
            var assets = Path.Combine(projectDirectory, "obj", "project.assets.json");
            File.WriteAllText(assets, AssetsForProject(project));
            var source = Path.Combine(directory, "linked.cs");
            File.WriteAllText(source, "namespace Other { class Unrelated {} }");
            var marker = Path.Combine(directory, "nested-msbuild-evaluated");
            var previousPropertyFunctions = Environment.GetEnvironmentVariable("MSBUILDENABLEALLPROPERTYFUNCTIONS");
            try
            {
                Environment.SetEnvironmentVariable("MSBUILDENABLEALLPROPERTYFUNCTIONS", "1");
                var probeStart = new ProcessStartInfo("dotnet") { UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true };
                foreach (var argument in new[] { "msbuild", project, "-getProperty:ProjectAssetsFile", "--nologo" })
                {
                    probeStart.ArgumentList.Add(argument);
                }
                using (var probe = Process.Start(probeStart)!)
                {
                    var stdout = probe.StandardOutput.ReadToEndAsync();
                    var stderr = probe.StandardError.ReadToEndAsync();
                    await probe.WaitForExitAsync();
                    Assert.That(probe.ExitCode, Is.Zero, (await stdout) + Environment.NewLine + (await stderr));
                }
                Assert.That(Directory.Exists(marker), Is.True, "The temporary project must record actual MSBuild evaluation.");
                Directory.Delete(marker);

                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var owner = new FieldOwner(target.Type);
                CodeModelGenerator.Instance = new ControlledGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(owner, target));

                await ExecuteIsolated(new CSharpGen(), isolated, new FixtureSession(original, source, assets));

                Assert.That(CodeModelGenerator.Instance.IsCompilerBuildHost, Is.False, "The host mode must not leak after generation.");
                Assert.That(Directory.Exists(marker), Is.False, "A compiler-host generation must not spawn nested restore or MSBuild.");
                Assert.That(File.Exists(Path.Combine(isolated, "Clock.cs")), Is.True);
            }
            finally
            {
                Environment.SetEnvironmentVariable("MSBUILDENABLEALLPROPERTYFUNCTIONS", previousPropertyFunctions);
                Directory.Delete(directory, recursive: true);
            }
        }

        [TestCase("missing-assets")]
        [TestCase("baseline-contract")]
        [TestCase("baseline-suppression")]
        public async Task UnsupportedProjectInputsFailWithoutChangingOriginalFiles(string kind)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-inputs", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            var projectDirectory = Path.Combine(original, "src");
            var generated = Path.Combine(projectDirectory, "Generated");
            Directory.CreateDirectory(generated);
            Directory.CreateDirectory(isolated);
            var keep = Path.Combine(generated, "Keep.cs");
            File.WriteAllText(keep, "// preserved\n");
            var baseline = kind == "baseline-contract" ? "<ApiCompatVersion>1.0.0</ApiCompatVersion>" : string.Empty;
            File.WriteAllText(Path.Combine(projectDirectory, "Sample.csproj"),
                "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><TargetFramework>net10.0</TargetFramework>" + baseline + "</PropertyGroup></Project>");
            string? assets = null;
            if (kind != "missing-assets")
            {
                Directory.CreateDirectory(Path.Combine(projectDirectory, "obj"));
                assets = Path.Combine(projectDirectory, "obj", "project.assets.json");
                File.WriteAllText(assets, AssetsForProject(Path.Combine(projectDirectory, "Sample.csproj")));
            }
            if (kind == "baseline-suppression")
            {
                var baselineDirectory = Path.Combine(original, "eng", "apicompatbaselines");
                Directory.CreateDirectory(baselineDirectory);
                File.WriteAllText(Path.Combine(baselineDirectory, "Sample.xml"), "<Suppressions />");
            }
            var source = Path.Combine(directory, "linked.cs");
            File.WriteAllText(source, "namespace Other { class Unrelated {} }");
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var generator = new ControlledGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(new FieldOwner(target.Type), target));
                CodeModelGenerator.Instance = generator;

                Assert.ThrowsAsync<InvalidOperationException>(async () => await ExecuteIsolated(new CSharpGen(), isolated, new FixtureSession(original, source, assets)));

                Assert.That(await File.ReadAllTextAsync(keep), Is.EqualTo("// preserved\n"));
                Assert.That(generator.IsCompilerBuildHost, Is.False);
                Assert.That(generator.CompilerBuildAssetsFile, Is.Null);
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [TestCase("success")]
        [TestCase("invalid-output")]
        [TestCase("invalid-assets")]
        public async Task CompilerBuildContextRestoresPriorScopeOnSuccessAndFailure(string mode)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-context", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            Directory.CreateDirectory(original);
            Directory.CreateDirectory(isolated);
            if (mode == "invalid-assets")
            {
                Directory.CreateDirectory(Path.Combine(original, "src"));
                File.WriteAllText(Path.Combine(original, "src", "Sample.csproj"), "<Project />");
            }
            var source = Path.Combine(directory, "linked.cs");
            File.WriteAllText(source, "namespace Other { class Unrelated {} }");
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var generator = new ControlledGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(new FieldOwner(target.Type), target));
                CodeModelGenerator.Instance = generator;
                var session = new FixtureSession(original, source);
                var previousAssets = new BootstrapAssets(Path.Combine(directory, "parent-assets.json"), [1, 2, 3], () => true);
                var previous = new CompilerBuildGenerationContext(Path.Combine(directory, "parent"), session)
                {
                    BootstrapAssets = previousAssets,
                    UsedCapturedResidualInputs = true
                };
                generator.CompilerBuildContext = previous;
                try
                {
                    if (mode == "success")
                    {
                        await ExecuteIsolated(new CSharpGen(), isolated, session);
                    }
                    else
                    {
                        var invalid = mode == "invalid-output" ? original : isolated;
                        Assert.ThrowsAsync<InvalidOperationException>(async () => await ExecuteIsolated(new CSharpGen(), invalid, session));
                    }
                    Assert.That(generator.CompilerBuildContext, Is.SameAs(previous));
                    Assert.That(generator.IsCompilerBuildHost, Is.True);
                    Assert.That(generator.CompilerBuildAssets, Is.SameAs(previousAssets));
                    Assert.That(previous.UsedCapturedResidualInputs, Is.True);
                }
                finally
                {
                    generator.CompilerBuildContext = null;
                }
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [TestCase("same")]
        [TestCase("source-child")]
        [TestCase("ancestor")]
        [TestCase("nonempty")]
        [TestCase("relative")]
        [TestCase("hosted")]
        [TestCase("new-project")]
        public async Task UnsupportedIsolationNeverTouchesOriginalFiles(string kind)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-isolation", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var generated = Path.Combine(original, "src", "Generated");
            Directory.CreateDirectory(generated);
            var keep = Path.Combine(generated, "Keep.cs");
            File.WriteAllText(keep, "// preserved\n");
            var external = Path.Combine(directory, "linked.cs");
            File.WriteAllText(external, "namespace Other { class Unrelated {} }");
            var isolated = kind switch
            {
                "same" => original,
                "source-child" => Path.Combine(generated, "child"),
                "ancestor" => directory,
                "relative" => "relative-sandbox",
                _ => Path.Combine(directory, "isolated")
            };
            if (kind == "nonempty")
            {
                Directory.CreateDirectory(isolated);
                File.WriteAllText(Path.Combine(isolated, "retain.txt"), "preserved");
            }
            try
            {
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original,
                    configuration: "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\"}",
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                CodeModelGenerator.Instance = mock.Object;
                mock.Object.IsHosted = kind == "hosted";
                mock.Object.IsNewProject = kind == "new-project";
                var session = new FixtureSession(original, external);

                Assert.ThrowsAsync<InvalidOperationException>(async () => await ExecuteIsolated(new CSharpGen(), isolated, session));

                Assert.That(await File.ReadAllTextAsync(keep), Is.EqualTo("// preserved\n"));
                if (kind == "nonempty")
                {
                    Assert.That(await File.ReadAllTextAsync(Path.Combine(isolated, "retain.txt")), Is.EqualTo("preserved"));
                }
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        private static string AssetsForProject(string projectFile) => JsonSerializer.Serialize(new
        {
            targets = new { },
            projectFileDependencyGroups = new { },
            project = new { restore = new { projectPath = projectFile } }
        });

        private static Task ExecuteIsolated(CSharpGen generator, string isolated, ITrustedCompilerBuildSession session) =>
            generator.ExecuteForCompilerBuildAsync(isolated, session);

        private class ControlledGenerator(GeneratorContext context, InputLibrary inputLibrary, TypeFactory typeFactory,
            OutputLibrary outputLibrary) : CodeModelGenerator(context)
        {
            public override InputLibrary InputLibrary => inputLibrary;
            public override TypeFactory TypeFactory => typeFactory;
            public override OutputLibrary OutputLibrary => outputLibrary;
        }

        private sealed class CustomizedWriterGenerator(GeneratorContext context, InputLibrary inputLibrary, TypeFactory typeFactory,
            OutputLibrary outputLibrary) : ControlledGenerator(context, inputLibrary, typeFactory, outputLibrary)
        {
            public override TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);
        }

        private sealed class FieldOwner(CSharpType fieldType) : TypeProvider
        {
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "Clock.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => [new FieldProvider(FieldModifiers.Private, fieldType, "_value", this)];
        }

        private sealed class FixtureSession(string outputDirectory, string sourcePath, string? assetsPath = null, bool unsupported = false) : ITrustedCompilerBuildSession
        {
            private readonly string _sourceHash = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(sourcePath)));
            private readonly string? _assetsHash = assetsPath is null ? null : Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(assetsPath)));
            public int Checks { get; private set; }
            public CompilerBuildInputCapture Capture => new(outputDirectory, "controlled-test-epoch", "Debug|net10.0", "12.0", "Actual", [],
                [new CapturedCompilerSource(sourcePath, _sourceHash)], [], false, unsupported,
                new CSharpParseOptions(LanguageVersion.CSharp12), new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary),
                assetsPath is null ? null : new CapturedCompilerSource(assetsPath, _assetsHash!));
            public bool IsCurrent()
            {
                Checks++;
                return true;
            }
        }
    }
}
