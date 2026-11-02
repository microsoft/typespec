// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;
using System.Security;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.SourceInput;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.SourceInput.CompilerBuildInputProof;

namespace Microsoft.TypeSpec.Generator.Tests.SourceInput
{
    [NonParallelizable]
    internal class CompilerCommandLineCaptureTests
    {
        private string _directory = null!;
        private string _outputDirectory = null!;
        private string _generated = null!;
        private string _linked = null!;
        private string _response = null!;

        [SetUp]
        public void SetUp()
        {
            _directory = Path.Combine(Path.GetTempPath(), "typespec-csc-capture", Guid.NewGuid().ToString("N"));
            _outputDirectory = Path.Combine(_directory, "sdk");
            Directory.CreateDirectory(Path.Combine(_outputDirectory, "src", "Generated"));
            Directory.CreateDirectory(Path.Combine(_directory, "linked source"));
            _generated = Path.Combine(_outputDirectory, "src", "Generated", "Clock.cs");
            _linked = Path.Combine(_directory, "linked source", "Partial.cs");
            _response = Path.Combine(_directory, "compile.rsp");
            File.WriteAllText(_generated, "namespace Sample { partial class Clock {} }");
            File.WriteAllText(_linked, "namespace Sample { partial class Clock { class Widget {} } }");
        }

        [TearDown]
        public void TearDown() => Directory.Delete(_directory, recursive: true);

        [Test]
        public void CapturesActualCompilerSourcesAndExcludesReplacedGeneratedFiles()
        {
            WriteResponse();

            var capture = Capture(["/noconfig", "@" + _response]);

            Assert.That(capture, Is.Not.Null);
            Assert.That(capture!.Inputs.Sources.Select(source => source.Path), Is.EquivalentTo(new[] { _linked }));
            Assert.That(capture.GeneratedSources, Is.EquivalentTo(new[] { _generated }));
            Assert.That(capture.Inputs.References.Select(reference => reference.Path),
                Is.EquivalentTo(new[] { Path.GetFullPath(typeof(object).Assembly.Location) }));
            Assert.That(capture.Inputs.PreprocessorSymbols, Does.Contain("DEBUG"));
            Assert.That(capture.Inputs.LanguageVersion, Is.EqualTo("12.0"));
            Assert.That(capture.Inputs.AssemblyName, Is.EqualTo("Actual"));
            Assert.That(capture.Inputs.HasAnalyzers, Is.False);
        }

        [Test]
        public async Task ActualCscDropsCaseOnlySourcesAndCaptureRejectsCollision()
        {
            if (!OperatingSystem.IsLinux())
            {
                Assert.Ignore("The case-only source witness requires a case-sensitive Linux filesystem.");
            }
            var first = Path.Combine(_directory, "shadow.cs");
            var second = Path.Combine(_directory, "Shadow.cs");
            const string firstText = "namespace Sample { class FirstMarker {} }";
            File.WriteAllText(first, firstText);
            File.WriteAllText(second, "namespace Sample { class SecondMarker {} }");
            if (File.ReadAllText(first) != firstText)
            {
                Assert.Ignore("The test filesystem does not distinguish case-only paths.");
            }
            WriteResponse($"\"{first}\" \"{second}\"");
            var compiler = await FindSdkCompilerAsync(_directory);
            var result = await RunDotNetAsync(_directory, compiler, "/noconfig", "@" + _response);
            Assert.That(result.ExitCode, Is.Zero, result.Output);
            StringAssert.Contains("CS2002", result.Output);
            using (var stream = File.OpenRead(Path.Combine(_directory, "Actual.dll")))
            using (var image = new PEReader(stream))
            {
                var metadata = image.GetMetadataReader();
                var names = metadata.TypeDefinitions.Select(handle => metadata.GetString(metadata.GetTypeDefinition(handle).Name)).ToArray();
                Assert.That(names, Does.Contain("FirstMarker"));
                Assert.That(names, Does.Not.Contain("SecondMarker"));
            }

            Assert.That(Capture(["/noconfig", "@" + _response]), Is.Null,
                "The proof must not include a source that the actual Csc discards.");
        }

        [Test]
        public void CaptureRejectsCaseOnlyCollisionAcrossGeneratedAndOtherSources()
        {
            if (!OperatingSystem.IsLinux())
            {
                Assert.Ignore("The case-only source witness requires a case-sensitive Linux filesystem.");
            }
            var otherDirectory = Path.Combine(_outputDirectory, "src", "generated");
            if (Directory.Exists(otherDirectory))
            {
                Assert.Ignore("The test filesystem does not distinguish case-only paths.");
            }
            Directory.CreateDirectory(otherDirectory);
            var other = Path.Combine(otherDirectory, "clock.cs");
            File.WriteAllText(other, "namespace Other { class Separate {} }");
            WriteResponse($"\"{other}\"");

            Assert.That(Capture(["/noconfig", "@" + _response]), Is.Null,
                "Generated/non-generated partitioning must not hide a Csc source collision.");
        }

        [Test]
        public async Task AnalyzerConfigWithoutAnalyzerAssemblyCannotAuthorizeCapture()
        {
            File.WriteAllText(_linked, "namespace Sample { partial class Clock { private int _unused; } }");
            var config = Path.Combine(_directory, ".editorconfig");
            File.WriteAllText(config, "root = true\n\n[*.cs]\ndotnet_diagnostic.CS0169.severity = error\n");
            var compiler = await FindSdkCompilerAsync(_directory);
            WriteResponse();
            var baseline = await RunDotNetAsync(_directory, compiler, "/noconfig", "@" + _response);
            Assert.That(baseline.ExitCode, Is.Zero, baseline.Output);
            StringAssert.Contains("warning CS0169", baseline.Output);

            WriteResponse($"/analyzerconfig:\"{config}\"");
            var parsed = CSharpCommandLineParser.Default.Parse(["/noconfig", "@" + _response], _directory, null, null);
            Assert.That(parsed.Errors.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(parsed.AnalyzerReferences, Is.Empty);
            Assert.That(parsed.AnalyzerConfigPaths, Has.Length.EqualTo(1));
            var configured = await RunDotNetAsync(_directory, compiler, "/noconfig", "@" + _response);
            Assert.That(configured.ExitCode, Is.Not.Zero, configured.Output);
            StringAssert.Contains("error CS0169", configured.Output);

            Assert.That(Capture(["/noconfig", "@" + _response]), Is.Null,
                "Analyzer-config effects and freshness are not represented in the proof.");
        }

        [Test]
        public async Task PathMapDoesNotRestoreOriginalCompilerDiagnosticPaths()
        {
            if (!OperatingSystem.IsLinux())
            {
                Assert.Ignore("The preserved diagnostic-path witness was reproduced on Linux.");
            }
            var originalRoot = Path.Combine(_directory, "original");
            var sandboxRoot = Path.Combine(_directory, "sandbox");
            var original = Path.Combine(originalRoot, "src", "Generated", "Broken.cs");
            var sandbox = Path.Combine(sandboxRoot, "src", "Generated", "Broken.cs");
            Directory.CreateDirectory(Path.GetDirectoryName(original)!);
            Directory.CreateDirectory(Path.GetDirectoryName(sandbox)!);
            const string text = "namespace Sample { class Broken { MissingType field; } }\n";
            File.WriteAllText(original, text);
            File.WriteAllText(sandbox, text);
            var compiler = await FindSdkCompilerAsync(_directory);
            var reference = "/reference:" + typeof(object).Assembly.Location;
            var originalResult = await RunDotNetAsync(_directory, compiler, "/nologo", "/target:library", "/nostdlib+",
                reference, "/out:" + Path.Combine(_directory, "Original.dll"), original);
            var mappedResult = await RunDotNetAsync(_directory, compiler, "/nologo", "/target:library", "/nostdlib+",
                reference, "/out:" + Path.Combine(_directory, "Sandbox.dll"), $"/pathmap:{sandboxRoot}={originalRoot}", sandbox);

            Assert.That(originalResult.ExitCode, Is.Not.Zero, originalResult.Output);
            Assert.That(mappedResult.ExitCode, Is.Not.Zero, mappedResult.Output);
            StringAssert.Contains("error CS0246", originalResult.Output);
            StringAssert.Contains("error CS0246", mappedResult.Output);
            var originalPath = Path.GetRelativePath(_directory, original);
            var sandboxPath = Path.GetRelativePath(_directory, sandbox);
            StringAssert.Contains(originalPath, originalResult.Output);
            StringAssert.Contains(sandboxPath, mappedResult.Output);
            StringAssert.DoesNotContain(originalPath, mappedResult.Output);
            Assert.That(mappedResult.ExitCode, Is.EqualTo(originalResult.ExitCode));
            Assert.That(mappedResult.Output.Replace(sandboxPath, originalPath, StringComparison.Ordinal), Is.EqualTo(originalResult.Output),
                "The real compiler diagnostics must otherwise match, including severity, message and location.");
        }

        [Test]
        public void ProofPreservesTheCompilerAssemblyIdentity()
        {
            WriteResponse();
            var capture = Capture(["/noconfig", "@" + _response]);
            Assert.That(capture, Is.Not.Null);

            var proof = CompilerBuildInputProof.TryCreate(new CapturedSession(capture!.Inputs), _outputDirectory);

            Assert.That(proof, Is.Not.Null);
            Assert.That(proof!.Compilation.AssemblyName, Is.EqualTo("Actual"));
        }

        [Test]
        public async Task CapturesFinalMsBuildResponseIncludingLateTargetAndLinkedSources()
        {
            if (OperatingSystem.IsWindows())
            {
                Assert.Ignore("The controlled compiler-tool fixture currently uses a Unix shell.");
            }
            var projectDirectory = Path.Combine(_directory, "project");
            var toolDirectory = Path.Combine(_directory, "tool");
            Directory.CreateDirectory(projectDirectory);
            Directory.CreateDirectory(toolDirectory);
            var late = Path.Combine(projectDirectory, "Late.cs");
            var early = Path.Combine(_directory, "early.txt");
            var argsFile = Path.Combine(_directory, "compiler-args.txt");
            var capturedResponse = Path.Combine(_directory, "actual.rsp");
            var tool = Path.Combine(toolDirectory, "capture-csc");
            File.WriteAllText(late, "namespace Sample { class AddedByTarget {} }");
            File.WriteAllText(tool, "#!/bin/sh\nset -eu\nprintf '%s\\n' \"$@\" > \"$TYPESPEC_CAPTURE_ARGS\"\n" +
                "for arg in \"$@\"; do case \"$arg\" in @*) cp \"${arg#@}\" \"$TYPESPEC_CAPTURE_RSP\";; esac; done\n" +
                "exec dotnet \"$TYPESPEC_CSC_DLL\" \"$@\"\n");
            if (!OperatingSystem.IsWindows())
            {
                File.SetUnixFileMode(tool, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
            }
            var configFile = Path.Combine(_directory, "NuGet.Config");
            File.WriteAllText(configFile, "<configuration><packageSources><clear /></packageSources></configuration>");
            var project = Path.Combine(projectDirectory, "Capture.csproj");
            File.WriteAllText(project, $"""
                <Project Sdk="Microsoft.NET.Sdk">
                  <PropertyGroup>
                    <TargetFramework>net10.0</TargetFramework>
                    <LangVersion>12.0</LangVersion>
                    <EnableDefaultCompileItems>false</EnableDefaultCompileItems>
                    <EnableNETAnalyzers>false</EnableNETAnalyzers>
                    <DiscoverEditorConfigFiles>false</DiscoverEditorConfigFiles>
                    <DiscoverGlobalAnalyzerConfigFiles>false</DiscoverGlobalAnalyzerConfigFiles>
                    <GenerateMSBuildEditorConfigFile>false</GenerateMSBuildEditorConfigFile>
                    <DebugType>none</DebugType>
                    <DebugSymbols>false</DebugSymbols>
                    <EmbedAllSources>false</EmbedAllSources>
                    <UseSharedCompilation>false</UseSharedCompilation>
                    <CscToolPath>{SecurityElement.Escape(toolDirectory)}</CscToolPath>
                    <CscToolExe>capture-csc</CscToolExe>
                    <CscEnvironment>TYPESPEC_CAPTURE_ARGS={SecurityElement.Escape(argsFile)};TYPESPEC_CAPTURE_RSP={SecurityElement.Escape(capturedResponse)};TYPESPEC_CSC_DLL=$(MSBuildToolsPath)/Roslyn/bincore/csc.dll</CscEnvironment>
                  </PropertyGroup>
                  <ItemGroup>
                    <Compile Include="{SecurityElement.Escape(_generated)}" />
                    <Compile Include="{SecurityElement.Escape(_linked)}" />
                  </ItemGroup>
                  <Target Name="CaptureBeforeLateInput" BeforeTargets="CoreCompile">
                    <WriteLinesToFile File="{SecurityElement.Escape(early)}" Lines="@(Compile->'%(FullPath)')" Overwrite="true" />
                  </Target>
                  <Target Name="AddLateInputAndDisableAnalyzers" BeforeTargets="CoreCompile" DependsOnTargets="CaptureBeforeLateInput">
                    <PropertyGroup>
                      <InterceptorsPreviewNamespaces></InterceptorsPreviewNamespaces>
                      <InterceptorsNamespaces></InterceptorsNamespaces>
                      <SourceLink></SourceLink>
                    </PropertyGroup>
                    <ItemGroup>
                      <Compile Include="Late.cs" />
                      <Analyzer Remove="@(Analyzer)" />
                      <EditorConfigFiles Remove="@(EditorConfigFiles)" />
                      <EmbeddedFiles Remove="@(EmbeddedFiles)" />
                    </ItemGroup>
                  </Target>
                </Project>
                """);

            var start = new ProcessStartInfo("dotnet") { WorkingDirectory = projectDirectory, RedirectStandardOutput = true, RedirectStandardError = true };
            foreach (var argument in new[] { "build", project, "--nologo", "-v:quiet", $"-p:RestoreConfigFile={configFile}" })
            {
                start.ArgumentList.Add(argument);
            }
            using var process = Process.Start(start)!;
            var stdout = process.StandardOutput.ReadToEndAsync();
            var stderr = process.StandardError.ReadToEndAsync();
            using var timeout = new CancellationTokenSource(TimeSpan.FromMinutes(2));
            try
            {
                await process.WaitForExitAsync(timeout.Token);
            }
            catch (OperationCanceledException)
            {
                process.Kill(entireProcessTree: true);
                Assert.Fail("The controlled MSBuild process timed out.");
            }
            Assert.That(process.ExitCode, Is.Zero, (await stdout) + Environment.NewLine + (await stderr));
            Assert.That(File.ReadAllLines(early), Does.Not.Contain(late));
            var actualArgs = File.ReadAllLines(argsFile);
            Assert.That(actualArgs, Has.Length.EqualTo(2));
            var actualParsed = CSharpCommandLineParser.Default.Parse([actualArgs[0], "@" + capturedResponse], projectDirectory, null, null);
            Assert.That(actualParsed.AnalyzerConfigPaths, Is.Empty, "The accepted fixture must actually disable analyzer configs.");
            var capture = CompilerCommandLineCapture.TryCapture([actualArgs[0], "@" + capturedResponse], projectDirectory,
                _outputDirectory, "controlled-test-epoch", "Debug|net10.0");

            Assert.That(capture, Is.Not.Null);
            Assert.That(capture!.Inputs.Sources.Select(source => source.Path), Does.Contain(_linked).And.Contain(late));
            Assert.That(capture.GeneratedSources, Is.EquivalentTo(new[] { _generated }));
            var proof = CompilerBuildInputProof.TryCreate(new CapturedSession(capture.Inputs), _outputDirectory);
            Assert.That(proof, Is.Not.Null);
            Assert.That(proof!.Compilation.Assembly.GetTypeByMetadataName("Sample.Clock")!.GetTypeMembers("Widget"), Has.Length.EqualTo(1));
            Assert.That(proof.Compilation.Assembly.GetTypeByMetadataName("Sample.AddedByTarget"), Is.Not.Null);
            var actualAssets = Path.Combine(projectDirectory, "obj", "project.assets.json");
            var assetsHash = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(actualAssets)));
            var captureWithAssets = capture.Inputs with { ProjectAssetsFile = new CapturedCompilerSource(actualAssets, assetsHash) };
            var bootstrap = CompilerBuildInputProof.TryCaptureBootstrapAssets(new CapturedSession(captureWithAssets), _outputDirectory, project);
            Assert.That(bootstrap, Is.Not.Null, "A real SDK-restored assets inventory must remain supported.");
        }

        [Test]
        public void CapturedCompilerOptionsMatchTheActualCompilerConfiguration()
        {
            WriteResponse("/nullable:enable /checked+");
            var actual = CSharpCommandLineParser.Default.Parse(["/noconfig", "@" + _response], _directory, null, null);
            Assert.That(actual.Errors.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            var capture = Capture(["/noconfig", "@" + _response]);
            Assert.That(capture, Is.Not.Null);

            var snapshot = CompilerBuildInputProof.TryCreate(new CapturedSession(capture!.Inputs), _outputDirectory);

            Assert.That(snapshot, Is.Not.Null);
            Assert.That(snapshot!.Compilation.Options.NullableContextOptions, Is.EqualTo(actual.CompilationOptions.NullableContextOptions));
            Assert.That(snapshot.Compilation.Options.CheckOverflow, Is.EqualTo(actual.CompilationOptions.CheckOverflow));
            Assert.That(snapshot.ParseOptions, Is.EqualTo(actual.ParseOptions));
        }

        [Test]
        public void MissingOrInconsistentCapturedOptionsFailClosed()
        {
            WriteResponse();
            var capture = Capture(["/noconfig", "@" + _response]);
            Assert.That(capture, Is.Not.Null);
            var inputs = capture!.Inputs;
            Assert.That(CompilerBuildInputProof.TryCreate(new CapturedSession(inputs with { ParseOptions = null! }), _outputDirectory), Is.Null);
            Assert.That(CompilerBuildInputProof.TryCreate(new CapturedSession(inputs with { CompilationOptions = null! }), _outputDirectory), Is.Null);
            Assert.That(CompilerBuildInputProof.TryCreate(new CapturedSession(inputs with
            {
                ParseOptions = inputs.ParseOptions.WithPreprocessorSymbols("UNRECORDED")
            }), _outputDirectory), Is.Null);
            Assert.That(CompilerBuildInputProof.TryCreate(new CapturedSession(inputs with
            {
                CompilationOptions = inputs.CompilationOptions.WithOutputKind(OutputKind.ConsoleApplication)
            }), _outputDirectory), Is.Null);
        }

        [Test]
        public void ResponseCommentsDoNotHideLaterSourceInputs()
        {
            var late = Path.Combine(_directory, "Late.cs");
            File.WriteAllText(late, "namespace Sample { class Late {} }");
            File.WriteAllText(_response, ResponseText() + "\n# comment\n" + $"\"{late}\"\n");
            var compiler = CSharpCommandLineParser.Default.Parse(["/noconfig", "@" + _response], _directory, null, null);
            Assert.That(compiler.Errors.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(compiler.SourceFiles.Select(source => Path.GetFullPath(source.Path)), Does.Contain(late));

            var capture = Capture(["/noconfig", "@" + _response]);

            Assert.That(capture, Is.Not.Null);
            Assert.That(capture!.Inputs.Sources.Select(source => source.Path), Does.Contain(late));
        }

        [Test]
        public void WildcardSourceInputsAreNotAcceptedAsStableInventories()
        {
            var wildcardDirectory = Path.Combine(_directory, "wild");
            Directory.CreateDirectory(wildcardDirectory);
            var source = Path.Combine(wildcardDirectory, "One.cs");
            File.WriteAllText(source, "namespace Sample { class One {} }");
            WriteResponse($"\"{Path.Combine(wildcardDirectory, "*.cs")}\"");
            var compiler = CSharpCommandLineParser.Default.Parse(["/noconfig", "@" + _response], _directory, null, null);
            Assert.That(compiler.Errors.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(compiler.SourceFiles.Select(file => Path.GetFullPath(file.Path)), Does.Contain(source));

            Assert.That(Capture(["/noconfig", "@" + _response]), Is.Null);
        }

        [Test]
        public async Task ResponseTokensAndParsedInputsCannotComeFromDifferentReads()
        {
            if (OperatingSystem.IsWindows())
            {
                Assert.Ignore("The controlled response-file race fixture requires a Unix FIFO.");
            }
            var late = Path.Combine(_directory, "Late.cs");
            File.WriteAllText(late, "namespace Sample { class Late {} }");
            using (var makeFifo = Process.Start(new ProcessStartInfo("mkfifo") { ArgumentList = { _response } })!)
            {
                await makeFifo.WaitForExitAsync();
                Assert.That(makeFifo.ExitCode, Is.Zero);
            }
            var first = ResponseText();
            var second = ResponseText($"\"{late}\"");
            var start = new ProcessStartInfo("/bin/sh") { RedirectStandardOutput = true, RedirectStandardError = true };
            start.ArgumentList.Add("-c");
            start.ArgumentList.Add("printf %s \"$FIRST\" > \"$FIFO\"; printf %s \"$SECOND\" > \"$FIFO\"");
            start.Environment["FIRST"] = first;
            start.Environment["SECOND"] = second;
            start.Environment["FIFO"] = _response;
            using var producer = Process.Start(start)!;
            try
            {
                var task = Task.Run(() => Capture(["/noconfig", "@" + _response]));
                if (await Task.WhenAny(task, Task.Delay(TimeSpan.FromSeconds(15))) != task)
                {
                    Assert.Fail("The response capture did not complete.");
                }
                var capture = await task;
                if (capture is not null)
                {
                    Assert.That(capture.Inputs.Sources.Select(source => source.Path), Is.EquivalentTo(new[] { _linked }));
                }
            }
            finally
            {
                if (!producer.HasExited)
                {
                    producer.Kill(entireProcessTree: true);
                }
                await producer.WaitForExitAsync();
            }
        }

        [TestCase("/analyzer:UnknownGenerator.dll")]
        [TestCase("/langversion:14.0")]
        [TestCase("/codepage:1252")]
        [TestCase("/appconfig:app.config")]
        [TestCase("/keyfile:key.snk")]
        [TestCase("/publicsign+")]
        [TestCase("/debug:portable")]
        [TestCase("/embed:embedded.cs")]
        [TestCase("/sourcelink:sourcelink.json")]
        [TestCase("/pathmap:/before=/after")]
        [TestCase("@nested.rsp")]
        public void UnsupportedOrUnrepresentedCompilerInputsFailClosed(string additional)
        {
            if (additional.StartsWith('@'))
            {
                File.WriteAllText(Path.Combine(_directory, "nested.rsp"), "");
            }
            File.WriteAllText(Path.Combine(_directory, "app.config"), "<configuration />");
            File.WriteAllText(Path.Combine(_directory, "embedded.cs"), "// embedded");
            File.WriteAllText(Path.Combine(_directory, "sourcelink.json"), "{}");
            File.WriteAllBytes(Path.Combine(_directory, "key.snk"), [0, 1, 2]);
            WriteResponse(additional);

            Assert.That(Capture(["/noconfig", "@" + _response]), Is.Null);
        }

        internal static async Task<string> FindSdkCompilerAsync(string workingDirectory)
        {
            string? globalJson = null;
            for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
            {
                if (directory.Name == "http-client-csharp")
                {
                    var candidate = Path.Combine(directory.FullName, "global.json");
                    if (File.Exists(candidate))
                    {
                        globalJson = candidate;
                        break;
                    }
                }
            }
            Assert.That(globalJson, Is.Not.Null, "The test must use the C# emitter's pinned SDK.");
            File.Copy(globalJson!, Path.Combine(workingDirectory, "global.json"));
            var project = Path.Combine(workingDirectory, "compiler-path.proj");
            File.WriteAllText(project, "<Project />");
            var sdk = await RunDotNetAsync(workingDirectory, "msbuild", project, "-getProperty:MSBuildToolsPath", "-nologo");
            Assert.That(sdk.ExitCode, Is.Zero, sdk.Output);
            var compiler = Path.Combine(sdk.Output.Trim(), "Roslyn", "bincore", "csc.dll");
            Assert.That(File.Exists(compiler), Is.True, $"SDK compiler not found: {compiler}");
            var version = await RunDotNetAsync(workingDirectory, compiler, "-version");
            Assert.That(version.ExitCode, Is.Zero, version.Output);
            TestContext.WriteLine($"SDK Csc: {version.Output.Trim()}");
            return compiler;
        }

        internal static async Task<(int ExitCode, string Output)> RunDotNetAsync(string workingDirectory, params string[] arguments)
        {
            var start = new ProcessStartInfo("dotnet")
            {
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };
            foreach (var argument in arguments)
            {
                start.ArgumentList.Add(argument);
            }
            using var process = Process.Start(start)!;
            var stdout = process.StandardOutput.ReadToEndAsync();
            var stderr = process.StandardError.ReadToEndAsync();
            using var timeout = new CancellationTokenSource(TimeSpan.FromMinutes(2));
            try
            {
                await process.WaitForExitAsync(timeout.Token);
            }
            catch (OperationCanceledException)
            {
                process.Kill(entireProcessTree: true);
                Assert.Fail("The SDK compiler fixture timed out.");
            }
            return (process.ExitCode, (await stdout) + (await stderr));
        }

        private void WriteResponse(string additional = "") => File.WriteAllText(_response, ResponseText(additional));

        private string ResponseText(string additional = "")
        {
            var reference = typeof(object).Assembly.Location;
            return $"/target:library /nostdlib+ /langversion:12.0 /out:Actual.dll /define:DEBUG;TRACE /reference:\"{reference}\" \"{_linked}\" \"{_generated}\" {additional}";
        }

        private FixtureResult? Capture(string[] args)
        {
            var capture = CompilerCommandLineCapture.TryCapture(args, _directory, _outputDirectory,
                "controlled-test-epoch", "Debug|net10.0");
            return capture is null ? null : new FixtureResult(capture.Inputs, capture.GeneratedSources);
        }

        private sealed class CapturedSession(CompilerBuildInputCapture capture) : ITrustedCompilerBuildSession
        {
            public CompilerBuildInputCapture Capture => capture;
            public bool IsCurrent() => true;
        }

        private sealed record FixtureResult(CompilerBuildInputCapture Inputs, IReadOnlyList<string> GeneratedSources);
    }
}
