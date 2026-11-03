// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.SourceInput.CompilerBuildInputProof;

namespace Microsoft.TypeSpec.Generator.Tests.SourceInput
{
    [NonParallelizable]
    internal class ResidualHostBindingTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task ResidualReductionPreservesCapturedShadowBinding(bool conditional)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-shadow", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            Directory.CreateDirectory(original);
            Directory.CreateDirectory(isolated);
            var external = Path.Combine(directory, "linked.cs");
            File.WriteAllText(external, conditional
                ? "namespace Sample { partial class Clock {\n#if SHADOW\n private class Widget {}\n#endif\n} }"
                : "namespace Sample { partial class Clock { private class Widget {} } }");
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var clock = new FieldOwner("Clock", target.Type);
                var meter = new FieldOwner("Meter", target.Type);
                var generator = new FixtureGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(clock, meter, target));
                CodeModelGenerator.Instance = generator;
                generator.SourceInputModel = new SourceInputModel(CSharpCompilation.Create("Customization"), null);
                var session = new FixtureSession(original, external, conditional ? ["SHADOW"] : []);
                var proof = CompilerBuildInputProof.TryCreate(session, original);
                Assert.That(proof, Is.Not.Null);
                string rawClock;
                using (var prepared = PreparedFieldTypes.Create([clock, meter, target], proof!.Compilation, _ => true, original))
                {
                    Assert.That(prepared.CanWriteSimpleName(clock, clock.Fields[0]), Is.False);
                    Assert.That(prepared.CanWriteSimpleName(meter, meter.Fields[0]), Is.EqualTo(!conditional),
                        "The linked-shadow case must keep a separate prepared candidate active.");
                    rawClock = new TypeProviderWriter(clock) { PreparedFieldTypes = prepared }.Write().Content;
                }
                StringAssert.Contains("private global::Sample.Widget _value;", rawClock);

                var result = await new CSharpGen().ExecuteForCompilerBuildAsync(isolated, session);

                var clockCode = await File.ReadAllTextAsync(Path.Combine(isolated, "Clock.cs"));
                var meterCode = await File.ReadAllTextAsync(Path.Combine(isolated, "Meter.cs"));
                var widgetCode = await File.ReadAllTextAsync(Path.Combine(isolated, "Widget.cs"));
                var parseOptions = (CSharpParseOptions)proof!.Compilation.SyntaxTrees.Single().Options;
                var clockTree = CSharpSyntaxTree.ParseText(clockCode, parseOptions, path: "Clock.cs");
                var fieldType = clockTree.GetRoot().DescendantNodes().OfType<FieldDeclarationSyntax>()
                    .Single(field => field.Declaration.Variables.Any(variable => variable.Identifier.ValueText == "_value"))
                    .Declaration.Type;
                var baselineRoot = clockTree.GetRoot().ReplaceNode(fieldType,
                    SyntaxFactory.ParseTypeName("global::Sample.Widget").WithTriviaFrom(fieldType));
                var baselineTree = CSharpSyntaxTree.ParseText(baselineRoot.ToFullString(), parseOptions, path: "Clock.cs");
                var sharedTrees = new[]
                {
                    CSharpSyntaxTree.ParseText(meterCode, parseOptions, path: "Meter.cs"),
                    CSharpSyntaxTree.ParseText(widgetCode, parseOptions, path: "Widget.cs")
                };
                var candidate = proof.Compilation.AddSyntaxTrees(sharedTrees).AddSyntaxTrees(clockTree);
                var baseline = proof.Compilation.AddSyntaxTrees(sharedTrees).AddSyntaxTrees(baselineTree);
                var baselineErrors = baseline.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error).ToArray();
                var candidateErrors = candidate.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error).ToArray();
                Assert.That(baselineErrors, Is.Empty, string.Join("\n", baselineErrors.Select(error => error.ToString())));
                Assert.That(candidateErrors, Is.Empty, string.Join("\n", candidateErrors.Select(error => error.ToString())));
                var baselineField = (IFieldSymbol)baseline.GetTypeByMetadataName("Sample.Clock")!.GetMembers("_value").Single();
                var candidateField = (IFieldSymbol)candidate.GetTypeByMetadataName("Sample.Clock")!.GetMembers("_value").Single();
                Assert.That(SymbolEqualityComparer.Default.Equals(baselineField.Type, baseline.GetTypeByMetadataName("Sample.Widget")), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(candidateField.Type, candidate.GetTypeByMetadataName("Sample.Widget")), Is.True,
                    $"Final host output changed the field binding to {candidateField.Type.ToDisplayString()}.");
                Assert.That(result.UsedCapturedResidualInputs, Is.True);
                Assert.That(candidate.GetDiagnostics().Select(diagnostic => (diagnostic.Id, diagnostic.Severity, diagnostic.GetMessage())).ToArray(),
                    Is.EquivalentTo(baseline.GetDiagnostics().Select(diagnostic => (diagnostic.Id, diagnostic.Severity, diagnostic.GetMessage())).ToArray()));
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [Test]
        public async Task CaseOnlyDiscardedAliasCannotAuthorizeHostOutput()
        {
            if (!OperatingSystem.IsLinux())
            {
                Assert.Ignore("The case-only source witness requires a case-sensitive Linux filesystem.");
            }
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-case-alias", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            Directory.CreateDirectory(original);
            Directory.CreateDirectory(isolated);
            var first = Path.Combine(directory, "shadow.cs");
            var second = Path.Combine(directory, "Shadow.cs");
            const string firstText = "// intentionally empty\n";
            File.WriteAllText(first, firstText);
            File.WriteAllText(second, "global using S = global::Sample.Widget;\n");
            if (File.ReadAllText(first) != firstText)
            {
                Directory.Delete(directory, recursive: true);
                Assert.Ignore("The test filesystem does not distinguish case-only paths.");
            }
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var clock = new FieldOwner("Clock", target.Type);
                var generator = new FixtureGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(clock, target));
                CodeModelGenerator.Instance = generator;
                var originalSession = new FixtureSession(original, first, []);
                var capture = originalSession.Capture with
                {
                    Sources = [new CapturedCompilerSource(first, Hash(first)), new CapturedCompilerSource(second, Hash(second))]
                };
                var result = await new CSharpGen().ExecuteForCompilerBuildAsync(isolated, new FixedSession(capture));
                if (result.UsedCapturedResidualInputs)
                {
                    var clockPath = Path.Combine(isolated, "Clock.cs");
                    var widgetPath = Path.Combine(isolated, "Widget.cs");
                    var root = CSharpSyntaxTree.ParseText(await File.ReadAllTextAsync(clockPath)).GetRoot();
                    var field = root.DescendantNodes().OfType<FieldDeclarationSyntax>().Single();
                    var spelling = field.Declaration.Type.ToString();
                    TestContext.WriteLine($"Captured residual field spelling: {spelling}");
                    if (spelling == "S" || spelling.StartsWith("S.", StringComparison.Ordinal))
                    {
                        var compiler = await CompilerCommandLineCaptureTests.FindSdkCompilerAsync(directory);
                        var reference = typeof(object).Assembly.Location;
                        var response = Path.Combine(directory, "consumer.rsp");
                        File.WriteAllText(response, $"/target:library /nostdlib+ /langversion:12.0 /out:Actual.dll /reference:\"{reference}\" \"{first}\" \"{second}\" \"{clockPath}\" \"{widgetPath}\"");
                        var actual = await CompilerCommandLineCaptureTests.RunDotNetAsync(directory, compiler, "/noconfig", "@" + response);
                        Assert.That(actual.ExitCode, Is.Not.Zero, actual.Output);
                        StringAssert.Contains("CS2002", actual.Output);
                        StringAssert.Contains("CS0246", actual.Output);
                        var baselineRoot = root.ReplaceNode(field.Declaration.Type,
                            SyntaxFactory.ParseTypeName("global::Sample.Widget").WithTriviaFrom(field.Declaration.Type));
                        var baseline = Path.Combine(directory, "Clock.Baseline.cs");
                        File.WriteAllText(baseline, baselineRoot.ToFullString());
                        File.WriteAllText(response, $"/target:library /nostdlib+ /langversion:12.0 /out:Actual.dll /reference:\"{reference}\" \"{first}\" \"{second}\" \"{baseline}\" \"{widgetPath}\"");
                        var qualified = await CompilerCommandLineCaptureTests.RunDotNetAsync(directory, compiler, "/noconfig", "@" + response);
                        Assert.That(qualified.ExitCode, Is.Zero, qualified.Output);
                        StringAssert.Contains("CS2002", qualified.Output);
                        TestContext.WriteLine("Actual Csc rejected the alias spelling but accepted the qualified baseline.");
                    }
                }

                Assert.That(result.UsedCapturedResidualInputs, Is.False,
                    "A compiler host must discard output when its proof includes a case-only source Csc drops.");
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [Test]
        public async Task UntrustedCaseOnlyAliasWitnessMatchesActualCsc()
        {
            if (!OperatingSystem.IsLinux())
            {
                Assert.Ignore("The case-only source witness requires a case-sensitive Linux filesystem.");
            }
            var directory = Path.Combine(Path.GetTempPath(), "typespec-case-alias-witness", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                var first = Path.Combine(directory, "shadow.cs");
                var second = Path.Combine(directory, "Shadow.cs");
                const string firstText = "// intentionally empty\n";
                const string secondText = "global using S = global::Sample.Widget;\n";
                File.WriteAllText(first, firstText);
                File.WriteAllText(second, secondText);
                if (File.ReadAllText(first) != firstText)
                {
                    Assert.Ignore("The test filesystem does not distinguish case-only paths.");
                }
                await MockHelpers.LoadMockGeneratorAsync(outputPath: directory,
                    configuration: "{\"package-name\":\"Sample\"}",
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var parseOptions = new CSharpParseOptions(LanguageVersion.CSharp12);
                var sourceTrees = new[]
                {
                    CSharpSyntaxTree.ParseText(firstText, parseOptions, path: first),
                    CSharpSyntaxTree.ParseText(secondText, parseOptions, path: second)
                };
                var reference = typeof(object).Assembly.Location;
                var compilation = CSharpCompilation.Create("Witness", sourceTrees,
                    [MetadataReference.CreateFromFile(reference)], new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                // This deliberately untrusted snapshot recreates the old residual
                // workspace only for the test; it cannot authorize host output.
                var snapshot = new CompleteSourceInputSnapshot(directory, "untrusted-test-witness", compilation,
                    ["test"], () => true, parseOptions: parseOptions);
                var workspace = await GeneratedCodeWorkspace.CreateForCompilerProof(snapshot);
                await workspace.AddGeneratedFile(new CodeFile(
                    "namespace Sample { partial class Clock { private global::Sample.Widget _value; } }\n", "Clock.cs"));
                await workspace.AddGeneratedFile(new CodeFile("namespace Sample { class Widget {} }\n", "Widget.cs"));
                var generated = new Dictionary<string, string>();
                await foreach (var file in workspace.GetGeneratedFilesAsync())
                {
                    generated.Add(file.Name, file.Text);
                }
                var root = CSharpSyntaxTree.ParseText(generated["Clock.cs"]).GetRoot();
                var field = root.DescendantNodes().OfType<FieldDeclarationSyntax>().Single();
                Assert.That(field.Declaration.Type.ToString(), Is.EqualTo("S"),
                    "The test must exercise the residual reducer's alias spelling.");
                var clockPath = Path.Combine(directory, "Clock.cs");
                var widgetPath = Path.Combine(directory, "Widget.cs");
                File.WriteAllText(clockPath, generated["Clock.cs"]);
                File.WriteAllText(widgetPath, generated["Widget.cs"]);
                var compiler = await CompilerCommandLineCaptureTests.FindSdkCompilerAsync(directory);
                var response = Path.Combine(directory, "consumer.rsp");
                File.WriteAllText(response, $"/target:library /nostdlib+ /langversion:12.0 /out:Actual.dll /reference:\"{reference}\" \"{first}\" \"{second}\" \"{clockPath}\" \"{widgetPath}\"");
                var actual = await CompilerCommandLineCaptureTests.RunDotNetAsync(directory, compiler, "/noconfig", "@" + response);
                Assert.That(actual.ExitCode, Is.Not.Zero, actual.Output);
                StringAssert.Contains("CS2002", actual.Output);
                StringAssert.Contains("CS0246", actual.Output);

                var baselineRoot = root.ReplaceNode(field.Declaration.Type,
                    SyntaxFactory.ParseTypeName("global::Sample.Widget").WithTriviaFrom(field.Declaration.Type));
                var baseline = Path.Combine(directory, "Clock.Baseline.cs");
                File.WriteAllText(baseline, baselineRoot.ToFullString());
                File.WriteAllText(response, $"/target:library /nostdlib+ /langversion:12.0 /out:Actual.dll /reference:\"{reference}\" \"{first}\" \"{second}\" \"{baseline}\" \"{widgetPath}\"");
                var qualified = await CompilerCommandLineCaptureTests.RunDotNetAsync(directory, compiler, "/noconfig", "@" + response);
                Assert.That(qualified.ExitCode, Is.Zero, qualified.Output);
                StringAssert.Contains("CS2002", qualified.Output);
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task HostRejectsOutputWhenProofOrRewriterPolicyChangesDuringWriting(bool lateRewriter)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-build-invalidated", Guid.NewGuid().ToString("N"));
            var original = Path.Combine(directory, "original");
            var isolated = Path.Combine(directory, "isolated");
            Directory.CreateDirectory(original);
            Directory.CreateDirectory(isolated);
            var external = Path.Combine(directory, "linked.cs");
            File.WriteAllText(external, "namespace Other { class Unrelated {} }");
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: original, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var session = new FixtureSession(original, external, []);
                var target = new TestTypeProvider(name: "Widget", ns: "Sample",
                    declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
                var rewriter = new QualifiedFieldRewriter();
                var calls = 0;
                var owner = new FieldOwner("Clock", target.Type, () =>
                {
                    calls++;
                    if (lateRewriter)
                    {
                        CodeModelGenerator.Instance.AddRewriter(rewriter);
                    }
                    else
                    {
                        session.Alive = false;
                    }
                });
                var generator = new FixtureGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(owner, target));
                CodeModelGenerator.Instance = generator;

                var result = await new CSharpGen().ExecuteForCompilerBuildAsync(isolated, session);

                Assert.That(session.Checks, Is.GreaterThan(0));
                Assert.That(calls, Is.EqualTo(1), "Rejecting the speculative output must not replay callbacks.");
                Assert.That(result.UsedCapturedResidualInputs, Is.False, "A caller must discard this output.");
                if (lateRewriter)
                {
                    Assert.That(rewriter.Matches, Is.EqualTo(1), "The late rewriter must receive the qualified spelling.");
                    StringAssert.Contains("private readonly Widget _value = default;", await File.ReadAllTextAsync(Path.Combine(isolated, "Clock.cs")));
                }
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        private sealed class QualifiedFieldRewriter : LibraryRewriter
        {
            internal int Matches { get; private set; }
            public override SyntaxNode? VisitFieldDeclaration(FieldDeclarationSyntax node)
            {
                if (node.Declaration.Type.ToString() == "global::Sample.Widget")
                {
                    Matches++;
                    return node.AddModifiers(SyntaxFactory.Token(SyntaxKind.ReadOnlyKeyword));
                }
                return base.VisitFieldDeclaration(node);
            }
        }

        private sealed record InitializerCallback(Action Callback) : ValueExpression
        {
            internal override void WriteCore(CodeWriter writer)
            {
                Callback();
                writer.AppendRaw("default");
            }
        }

        private sealed class FixtureGenerator(GeneratorContext context, InputLibrary inputLibrary, TypeFactory typeFactory,
            OutputLibrary outputLibrary) : CodeModelGenerator(context)
        {
            public override InputLibrary InputLibrary => inputLibrary;
            public override TypeFactory TypeFactory => typeFactory;
            public override OutputLibrary OutputLibrary => outputLibrary;
        }

        private sealed class FieldOwner(string name, CSharpType fieldType, Action? onInitializer = null) : TypeProvider
        {
            protected override string BuildName() => name;
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => name + ".cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() =>
                [new FieldProvider(FieldModifiers.Private, fieldType, "_value", this,
                    initializationValue: onInitializer is null ? null : new InitializerCallback(onInitializer))];
        }

        private static string Hash(string path) => Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path)));

        private sealed class FixedSession(CompilerBuildInputCapture capture) : ITrustedCompilerBuildSession
        {
            public CompilerBuildInputCapture Capture => capture;
            public bool IsCurrent() => true;
        }

        private sealed class FixtureSession(string outputDirectory, string sourcePath, string[] symbols) : ITrustedCompilerBuildSession
        {
            private static string Hash(string path) => Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path)));
            private readonly string _sourceHash = Hash(sourcePath);
            private readonly string _coreLibrary = typeof(object).Assembly.Location;
            private readonly string _coreHash = Hash(typeof(object).Assembly.Location);
            public CompilerBuildInputCapture Capture => new(outputDirectory, "controlled-test-epoch", "Debug|net10.0", "12.0", "Actual", symbols,
                [new CapturedCompilerSource(sourcePath, _sourceHash)],
                [new CapturedCompilerReference(_coreLibrary, _coreHash, [], false)], false, false,
                new CSharpParseOptions(LanguageVersion.CSharp12, preprocessorSymbols: symbols),
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            internal bool Alive { get; set; } = true;
            internal int Checks { get; private set; }
            public bool IsCurrent()
            {
                Checks++;
                return Alive;
            }
        }
    }
}
