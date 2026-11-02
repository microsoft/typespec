// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.SourceInput;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.SourceInput.CompilerBuildInputProof;

namespace Microsoft.TypeSpec.Generator.Tests.SourceInput
{
    [NonParallelizable]
    internal class CompilerBuildInputProofTests
    {
        private string _directory = null!;

        [SetUp]
        public void SetUp()
        {
            _directory = Path.Combine(Path.GetTempPath(), "typespec-build-proof", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_directory);
        }

        [TearDown]
        public void TearDown() => Directory.Delete(_directory, recursive: true);

        [Test]
        public void LiveBuildCaptureCreatesProofIncludingLinkedSource()
        {
            var session = CreateSession("namespace Sample { partial class Clock { class Widget {} } }");

            var snapshot = BuildProof(session);

            Assert.That(snapshot, Is.Not.Null);
            Assert.That(snapshot!.IsCurrentFor(_directory), Is.True);
            var clock = snapshot.Compilation.Assembly.GetTypeByMetadataName("Sample.Clock");
            Assert.That(clock, Is.Not.Null);
            Assert.That(clock!.GetTypeMembers("Widget"), Has.Length.EqualTo(1));
        }

        [Test]
        public void DirectProofRejectsCaseOnlySourceCollisions()
        {
            if (!OperatingSystem.IsLinux())
            {
                Assert.Ignore("The case-only source witness requires a case-sensitive Linux filesystem.");
            }
            const string firstText = "namespace Sample { class FirstMarker {} }";
            var session = CreateSession(firstText);
            var second = Path.Combine(Path.GetDirectoryName(session.SourcePath)!, "partial.cs");
            File.WriteAllText(second, "namespace Sample { class SecondMarker {} }");
            if (File.ReadAllText(session.SourcePath) != firstText)
            {
                Assert.Ignore("The test filesystem does not distinguish case-only paths.");
            }
            var capture = session.Capture with
            {
                Sources = [new CapturedCompilerSource(session.SourcePath, session.SourceHash), new CapturedCompilerSource(second, Hash(second))]
            };

            Assert.That(CompilerBuildInputProof.TryCreate(new FixedSession(capture), _directory), Is.Null,
                "A direct proof must not parse both files when Csc keeps only the first.");
        }

        [Test]
        public void ChangedOrDisconnectedInputsInvalidateProof()
        {
            var session = CreateSession("namespace Sample { class Clock {} }");
            var snapshot = BuildProof(session);
            Assert.That(snapshot, Is.Not.Null);
            Assert.That(snapshot!.IsCurrentFor(_directory), Is.True);

            File.WriteAllText(session.SourcePath, "namespace Sample { class Changed {} }");
            Assert.That(snapshot.IsCurrentFor(_directory), Is.False);

            File.WriteAllText(session.SourcePath, "namespace Sample { class Clock {} }");
            Assert.That(snapshot.IsCurrentFor(_directory), Is.False, "A stale build epoch cannot become current again.");
            var fresh = BuildProof(session);
            Assert.That(fresh, Is.Not.Null);
            Assert.That(fresh!.IsCurrentFor(_directory), Is.True);
            session.Alive = false;
            Assert.That(fresh.IsCurrentFor(_directory), Is.False);
        }

        [Test]
        public void ChangedReferencePermanentlyInvalidatesTheBuildEpoch()
        {
            var session = CreateSession("namespace Sample { class Clock {} }");
            var reference = Path.Combine(_directory, "reference.dll");
            File.Copy(session.ReferencePath, reference);
            session.ReferencePath = reference;
            session.ReferenceHash = Hash(reference);
            var snapshot = BuildProof(session);
            Assert.That(snapshot, Is.Not.Null);

            File.AppendAllText(reference, "changed");

            Assert.That(snapshot!.IsCurrentFor(_directory), Is.False);
        }

        [Test]
        public void MultiModuleReferenceCannotBecomeAnIncompleteProof()
        {
            var session = CreateSession("namespace Sample { class Clock {} }");
            var core = MetadataReference.CreateFromFile(typeof(object).Assembly.Location);
            var modulePath = Path.Combine(_directory, "Part.netmodule");
            var module = CSharpCompilation.Create("Part", [CSharpSyntaxTree.ParseText("namespace Sample { public class InModule {} }")],
                [core], new CSharpCompilationOptions(OutputKind.NetModule));
            using (var stream = File.Create(modulePath))
            {
                var result = module.Emit(stream);
                Assert.That(result.Success, Is.True, string.Join(Environment.NewLine, result.Diagnostics));
            }
            var moduleReference = MetadataReference.CreateFromFile(modulePath, new MetadataReferenceProperties(MetadataImageKind.Module));
            var assemblyPath = Path.Combine(_directory, "Library.dll");
            var library = CSharpCompilation.Create("Library", [CSharpSyntaxTree.ParseText("public class Anchor {}")],
                [core, moduleReference], new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using (var stream = File.Create(assemblyPath))
            {
                var result = library.Emit(stream);
                Assert.That(result.Success, Is.True, string.Join(Environment.NewLine, result.Diagnostics));
            }
            var libraryReference = MetadataReference.CreateFromFile(assemblyPath);
            var probe = CSharpCompilation.Create("Probe", references: [core, libraryReference],
                options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var symbol = (IAssemblySymbol)probe.GetAssemblyOrModuleSymbol(libraryReference)!;
            Assert.That(symbol.Modules.Count(), Is.EqualTo(2));
            session.ReferencePath = assemblyPath;
            session.ReferenceHash = Hash(assemblyPath);

            Assert.That(BuildProof(session), Is.Null);
        }

        [Test]
        public void ChangedCapturedProjectAssetsInvalidateTheBuildEpoch()
        {
            var session = CreateSession("namespace Sample { class Clock {} }");
            session.AssetsPath = Path.Combine(_directory, "project.assets.json");
            File.WriteAllText(session.AssetsPath, "{\"targets\":{}}");
            session.AssetsHash = Hash(session.AssetsPath);
            var snapshot = BuildProof(session);
            Assert.That(snapshot, Is.Not.Null);
            Assert.That(snapshot!.ProjectAssetsFile, Is.EqualTo(session.AssetsPath));

            File.WriteAllText(session.AssetsPath, "{\"targets\":{\"changed\":{}}}");

            Assert.That(snapshot.IsCurrentFor(_directory), Is.False);
        }

        [Test]
        public void BootstrapAssetsAreIndependentImmutableAndPermanentlyInvalidatedWhenChanged()
        {
            var session = CreateSession("namespace Sample { class Clock {} }");
            session.AssetsPath = Path.Combine(_directory, "project.assets.json");
            var project = Path.Combine(_directory, "Sample.csproj");
            File.WriteAllText(project, "<Project />");
            var original = JsonSerializer.Serialize(new { targets = new { }, project = new { restore = new { projectPath = project } } });
            File.WriteAllText(session.AssetsPath, original);
            session.AssetsHash = Hash(session.AssetsPath);
            session.HasAnalyzers = true;
            session.HasUnsupportedInputs = true;

            var bootstrap = CompilerBuildInputProof.TryCaptureBootstrapAssets(session, _directory, project);

            Assert.That(bootstrap, Is.Not.Null);
            Assert.That(bootstrap!.IsCurrent(), Is.True);
            Assert.That(Encoding.UTF8.GetString(bootstrap.Contents.Span), Is.EqualTo(original));
            File.WriteAllText(session.AssetsPath, "{\"targets\":{\"changed\":{}}}");
            Assert.That(bootstrap.IsCurrent(), Is.False);
            Assert.That(Encoding.UTF8.GetString(bootstrap.Contents.Span), Is.EqualTo(original));
            File.WriteAllText(session.AssetsPath, original);
            Assert.That(bootstrap.IsCurrent(), Is.False, "A changed build epoch cannot become current again.");
            session.Alive = false;
            Assert.That(CompilerBuildInputProof.TryCaptureBootstrapAssets(session, _directory, project), Is.Null);
            session.Alive = true;
            Assert.That(CompilerBuildInputProof.TryCaptureBootstrapAssets(session, Path.Combine(_directory, "other"), project), Is.Null);
        }

        [TestCase("missing-targets")]
        [TestCase("targets-array")]
        [TestCase("framework-array")]
        [TestCase("library-array")]
        [TestCase("library-name")]
        [TestCase("missing-library-type")]
        [TestCase("unknown-library-type")]
        [TestCase("groups-array")]
        [TestCase("group-value")]
        [TestCase("group-member")]
        [TestCase("duplicate-targets")]
        public void BootstrapAssetsRejectUnsupportedInventoryShapes(string kind)
        {
            var session = CreateSession("namespace Sample { class Clock {} }");
            var project = Path.Combine(_directory, "Sample.csproj");
            File.WriteAllText(project, "<Project />");
            session.AssetsPath = Path.Combine(_directory, "project.assets.json");
            var library = kind switch
            {
                "library-array" => (object)Array.Empty<object>(),
                "missing-library-type" => new { },
                "unknown-library-type" => new { type = "unknown" },
                _ => new { type = "package" }
            };
            var libraryName = kind == "library-name" ? "Malformed" : "Sample.Dependency/1.0.0";
            var framework = kind == "framework-array" ? (object)Array.Empty<object>() :
                new Dictionary<string, object> { [libraryName] = library };
            var targets = kind == "targets-array" ? (object)Array.Empty<object>() :
                new Dictionary<string, object> { ["net10.0"] = framework };
            var groups = kind switch
            {
                "groups-array" => (object)Array.Empty<object>(),
                "group-value" => new Dictionary<string, object> { ["net10.0"] = new { } },
                "group-member" => new Dictionary<string, object> { ["net10.0"] = new object[] { 1 } },
                _ => new Dictionary<string, object>()
            };
            var root = new Dictionary<string, object>
            {
                ["project"] = new { restore = new { projectPath = project } },
                ["projectFileDependencyGroups"] = groups
            };
            if (kind != "missing-targets")
            {
                root["targets"] = targets;
            }
            var content = kind == "duplicate-targets"
                ? "{\"targets\":{},\"targets\":{},\"project\":{\"restore\":{\"projectPath\":" + JsonSerializer.Serialize(project) + "}}}"
                : JsonSerializer.Serialize(root);
            File.WriteAllText(session.AssetsPath, content);
            session.AssetsHash = Hash(session.AssetsPath);

            Assert.That(CompilerBuildInputProof.TryCaptureBootstrapAssets(session, _directory, project), Is.Null);
        }

        [TestCase("Sample.Dependency", "1.0.0")]
        [TestCase("Sample.Dependency >= 1.0.0", "1.0.0")]
        [TestCase("Sample.Dependency >= 1.2.3-beta.1", "1.2.3-beta.1+build.5")]
        public void BootstrapAssetsAcceptSupportedPackageVersionsAndDependencyGroups(string group, string version)
        {
            var session = CreateSession("namespace Sample { class Clock {} }");
            var project = Path.Combine(_directory, "Sample.csproj");
            File.WriteAllText(project, "<Project />");
            session.AssetsPath = Path.Combine(_directory, "project.assets.json");
            var targets = new Dictionary<string, object>
            {
                ["net10.0"] = new Dictionary<string, object>
                {
                    [$"Sample.Dependency/{version}"] = new { type = "package" },
                    ["Sample.Project/1.0.0"] = new { type = "project" }
                }
            };
            var groups = new Dictionary<string, object> { ["net10.0"] = new[] { group } };
            File.WriteAllText(session.AssetsPath, JsonSerializer.Serialize(new
            {
                targets,
                projectFileDependencyGroups = groups,
                project = new { restore = new { projectPath = project } }
            }));
            session.AssetsHash = Hash(session.AssetsPath);

            Assert.That(CompilerBuildInputProof.TryCaptureBootstrapAssets(session, _directory, project), Is.Not.Null);
        }

        [Test]
        public void ReferenceAliasesArePreservedInTheProof()
        {
            var session = CreateSession("namespace Sample { class Clock {} }");
            session.Aliases = ["AliasOnly"];
            var snapshot = BuildProof(session);

            Assert.That(snapshot, Is.Not.Null);
            Assert.That(snapshot!.Compilation.References.Single().Properties.Aliases, Is.EqualTo(new[] { "AliasOnly" }));
        }

        [Test]
        public void GeneratedOutputInvalidEncodingAndBadMetadataAreNotProofInputs()
        {
            var session = CreateSession("namespace Sample { class Clock {} }");
            var generatedDirectory = Path.Combine(_directory, "src", "Generated");
            Directory.CreateDirectory(generatedDirectory);
            session.SourcePath = Path.Combine(generatedDirectory, "Clock.cs");
            File.WriteAllText(session.SourcePath, "namespace Sample { class Clock {} }");
            session.SourceHash = Hash(session.SourcePath);
            Assert.That(BuildProof(session), Is.Null);

            session.SourcePath = Path.Combine(_directory, "linked", "Partial.cs");
            File.WriteAllBytes(session.SourcePath, [0xC3, 0x28]);
            session.SourceHash = Hash(session.SourcePath);
            Assert.That(BuildProof(session), Is.Null);

            File.WriteAllText(session.SourcePath, "namespace Sample { class Clock {} }");
            session.SourceHash = Hash(session.SourcePath);
            session.ReferencePath = Path.Combine(_directory, "bad.dll");
            File.WriteAllBytes(session.ReferencePath, [0, 1, 2, 3]);
            session.ReferenceHash = Hash(session.ReferencePath);
            Assert.That(BuildProof(session), Is.Null);
        }

        [Test]
        public void InvalidSymbolsAndUnrepresentedCompilerInputsFailClosed()
        {
            var session = CreateSession("namespace Sample { class Clock {} }");
            session.Symbols = ["not-a-valid-symbol"];
            Assert.That(BuildProof(session), Is.Null);
            session.Symbols = ["DEBUG"];
            session.HasUnsupportedInputs = true;
            Assert.That(BuildProof(session), Is.Null);
        }

        [Test]
        public void MissingHostStaleHashAndUnsupportedCompilerInputsFailClosed()
        {
            var session = CreateSession("namespace Sample { class Clock {} }");
            session.Alive = false;
            Assert.That(BuildProof(session), Is.Null);
            session.Alive = true;
            session.SourceHash = new string('0', 64);
            Assert.That(BuildProof(session), Is.Null);
            session.SourceHash = Hash(session.SourcePath);
            session.HasAnalyzers = true;
            Assert.That(BuildProof(session), Is.Null);
            session.HasAnalyzers = false;
            session.LanguageVersion = "14.0";
            Assert.That(BuildProof(session), Is.Null);
        }

        private FixtureSession CreateSession(string source)
        {
            var linkedDirectory = Path.Combine(_directory, "linked");
            Directory.CreateDirectory(linkedDirectory);
            var sourcePath = Path.Combine(linkedDirectory, "Partial.cs");
            File.WriteAllText(sourcePath, source);
            var referencePath = typeof(object).Assembly.Location;
            return new FixtureSession
            {
                OutputDirectory = _directory,
                SourcePath = sourcePath,
                SourceHash = Hash(sourcePath),
                ReferencePath = referencePath,
                ReferenceHash = Hash(referencePath)
            };
        }

        private static string Hash(string path) => Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path)));

        private static CompleteSourceInputSnapshot? BuildProof(FixtureSession session) =>
            CompilerBuildInputProof.TryCreate(session, session.OutputDirectory);

        private sealed class FixedSession(CompilerBuildInputCapture capture) : ITrustedCompilerBuildSession
        {
            public CompilerBuildInputCapture Capture => capture;
            public bool IsCurrent() => true;
        }

        private sealed class FixtureSession : ITrustedCompilerBuildSession
        {
            public string OutputDirectory { get; init; } = null!;
            public string SourcePath { get; set; } = null!;
            public string SourceHash { get; set; } = null!;
            public string ReferencePath { get; set; } = null!;
            public string ReferenceHash { get; set; } = null!;
            public string LanguageVersion { get; set; } = "12.0";
            public string[] Symbols { get; set; } = ["DEBUG"];
            public string[] Aliases { get; set; } = [];
            public string? AssetsPath { get; set; }
            public string? AssetsHash { get; set; }
            public bool HasAnalyzers { get; set; }
            public bool HasUnsupportedInputs { get; set; }
            public bool Alive { get; set; } = true;

            public CompilerBuildInputCapture Capture => new(
                OutputDirectory, "controlled-test-epoch", "Debug|net10.0", LanguageVersion, "Actual", Symbols,
                [new CapturedCompilerSource(SourcePath, SourceHash)],
                [new CapturedCompilerReference(ReferencePath, ReferenceHash, Aliases, false)],
                HasAnalyzers, HasUnsupportedInputs,
                new CSharpParseOptions(LanguageVersionFacts.TryParse(LanguageVersion, out var languageVersion)
                    ? languageVersion : Microsoft.CodeAnalysis.CSharp.LanguageVersion.CSharp12, preprocessorSymbols: Symbols),
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary),
                AssetsPath is null ? null : new CapturedCompilerSource(AssetsPath, AssetsHash!));

            public bool IsCurrent() => Alive;
        }
    }
}
