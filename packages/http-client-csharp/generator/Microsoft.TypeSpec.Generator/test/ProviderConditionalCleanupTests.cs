// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    [NonParallelizable]
    public class ProviderConditionalCleanupTests
    {
        private string? _previous;
        private static readonly MetadataReference[] References = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator).Select(static p => MetadataReference.CreateFromFile(p)).ToArray();
        [SetUp]
        public void SetUp()
        {
            _previous = Environment.GetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER");
            Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", "true");
            MockHelpers.LoadMockGenerator();
        }
        [TearDown]
        public void TearDown() => Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", _previous);

        [Test]
        public void BodyOnlyBranchesShortenRecordedSitesInBothBranches()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer { public object M() {");
            writer.WriteRawLine("#if NET6_0_OR_GREATER");
            writer.WriteLine($"return new {typeof(DateTimeOffset)}();");
            writer.WriteRawLine("#else");
            writer.WriteLine($"return new {typeof(TimeSpan)}();");
            writer.WriteRawLine("#endif");
            writer.WriteRawLine("} } }");
            var output = Reduce(writer, true);
            StringAssert.DoesNotContain("global::System.DateTimeOffset", output);
            StringAssert.DoesNotContain("global::System.TimeSpan", output);
        }

        [Test]
        public void InactiveBranchLocalsCannotCaptureStaticPrefixes()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer { public object M() {");
            writer.WriteRawLine("#if NET6_0_OR_GREATER");
            writer.WriteRawLine("object DateTimeOffset = null;");
            writer.WriteLine($"return {typeof(DateTimeOffset)}.Now;");
            writer.WriteRawLine("#else");
            writer.WriteLine($"return {typeof(DateTimeOffset)}.Now;");
            writer.WriteRawLine("#endif");
            writer.WriteRawLine("} } }");
            StringAssert.Contains("global::System.DateTimeOffset.Now", Reduce(writer, true));
        }

        [TestCase("NET6_0_OR_GREATER")]
        [TestCase("NETCOREAPP2_1_OR_GREATER")]
        [TestCase("NET5_0_OR_GREATER")]
        public void ConditionalExternalPartialCannotChangeOrdinaryDocumentBinding(string frameworkSymbol)
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public partial class Consumer {");
            writer.WriteLine($"public {typeof(DateTimeOffset)} Value => default;");
            writer.WriteRawLine("} }");
            var source = writer.ToString();
            var extra = "namespace Example { public partial class Consumer {\n#if " + frameworkSymbol + "\npublic class DateTimeOffset {}\n#endif\n} }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("ExternalPartial", new[] { tree, CSharpSyntaxTree.ParseText(extra) }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.False(new ProviderNameReducer(compilation).TryPlan(tree.GetRoot(), writer.TypeReferences!, out _),
                "Framework-conditional declarations anywhere must keep the ordinary target qualified");
            foreach (var symbols in new[] { Array.Empty<string>(), new[] { frameworkSymbol } })
            {
                var options = new CSharpParseOptions(preprocessorSymbols: symbols);
                var target = CSharpSyntaxTree.ParseText(source, options);
                var variant = compilation.RemoveAllSyntaxTrees().AddSyntaxTrees(target, CSharpSyntaxTree.ParseText(extra, options));
                var property = target.GetRoot().DescendantNodes().OfType<Microsoft.CodeAnalysis.CSharp.Syntax.PropertyDeclarationSyntax>().Single();
                Assert.AreEqual("System.DateTimeOffset", variant.GetSemanticModel(target).GetTypeInfo(property.Type).Type!.ToDisplayString());
            }
        }

        [TestCase("NET6_0_OR_GREATER")]
        [TestCase("CUSTOM_FEATURE")]
        public void ConditionalDeclarationsRemainOpaque(string symbol)
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteRawLine("#if " + symbol);
            writer.WriteLine($"public {typeof(DateTimeOffset)} Value => default;");
            writer.WriteRawLine("#else");
            writer.WriteLine($"public {typeof(TimeSpan)} Value => default;");
            writer.WriteRawLine("#endif");
            writer.WriteRawLine("} }");
            StringAssert.Contains("global::", Reduce(writer, false));
        }

        [TestCase("DEBUG", false)]
        [TestCase("DEBUG", true)]
        [TestCase("HAS_INTERNALS_VISIBLE_CORE", false)]
        [TestCase("HAS_INTERNALS_VISIBLE_CORE", true)]
        [TestCase("NETCOREAPP2_1_OR_GREATER", false)]
        [TestCase("NET5_0_OR_GREATER", false)]
        public void HeaderInvariantSharedSourceDoesNotDisableOrdinaryPlans(string symbol, bool defined)
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteLine($"public {typeof(DateTimeOffset)} Value => default;");
            writer.WriteRawLine("} }");
            var options = new CSharpParseOptions(preprocessorSymbols: defined ? new[] { symbol } : Array.Empty<string>());
            var target = CSharpSyntaxTree.ParseText(writer.ToString(), options);
            var shared = symbol == "HAS_INTERNALS_VISIBLE_CORE"
                ? "namespace Shared { public class Helper {\n#if HAS_INTERNALS_VISIBLE_CORE\ninternal\n#endif\nvoid M() {} } }"
                : "namespace Shared { public class Helper { public void M() {\n#if " + symbol + "\nSystem.Console.WriteLine(1);\n#endif\n} } }";
            var extra = CSharpSyntaxTree.ParseText(shared, options);
            var compilation = CSharpCompilation.Create("FixedFlags", new[] { target, extra }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.True(new ProviderNameReducer(compilation).TryPlan(target.GetRoot(), writer.TypeReferences!, out var plan));
            StringAssert.DoesNotContain("global::System.DateTimeOffset", plan!.Apply().ToString());
            if (symbol == "DEBUG" || symbol == "HAS_INTERNALS_VISIBLE_CORE")
            {
                Assert.False(new ProviderNameReducer(compilation).TryPlan(extra.GetRoot(), Array.Empty<TypeReferenceSite>(), out _),
                    "Unknown project-conditional documents remain opaque themselves");
            }
        }

        [Test]
        public void ConditionalNullableStateCannotEscapeIgnoredMethodBody()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteLine($"public {typeof(DateTimeOffset)} Value => default;");
            writer.WriteRawLine("} }");
            var target = CSharpSyntaxTree.ParseText(writer.ToString());
            var extra = CSharpSyntaxTree.ParseText("namespace Shared { public class Helper { public int M() {\n#if NET6_0_OR_GREATER\n#nullable enable\n#endif\nreturn 1; } } }");
            var compilation = CSharpCompilation.Create("NullableState", new[] { target, extra }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.False(new ProviderNameReducer(compilation).TryPlan(target.GetRoot(), writer.TypeReferences!, out _));
        }

        [Test]
        public void FrameworkConditionalGlobalAliasRejectsOrdinaryTarget()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteLine($"public {typeof(DateTimeOffset)} Value => default;");
            writer.WriteRawLine("} }");
            var target = CSharpSyntaxTree.ParseText(writer.ToString());
            var extra = CSharpSyntaxTree.ParseText("#if NET5_0_OR_GREATER\nglobal using DateTimeOffset = Other.DateTimeOffset;\n#endif\nnamespace Other { public class DateTimeOffset {} }");
            var compilation = CSharpCompilation.Create("AliasHeaders", new[] { target, extra }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.False(new ProviderNameReducer(compilation).TryPlan(target.GetRoot(), writer.TypeReferences!, out _));
        }

        [Test]
        public void OriginalNoncanonicalFrameworkBranchContributesLexicalBlockers()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer { public object M() {");
            writer.WriteRawLine("#if NET6_0_OR_GREATER");
            writer.WriteLine($"return {typeof(DateTimeOffset)}.Now;");
            writer.WriteRawLine("#else\n#if NET9_0_OR_GREATER\nobject DateTimeOffset = null;");
            writer.WriteLine($"return {typeof(DateTimeOffset)}.Now;");
            writer.WriteRawLine("#else");
            writer.WriteLine($"return {typeof(DateTimeOffset)}.Now;");
            writer.WriteRawLine("#endif\n#endif\n} } }");
            var options = new CSharpParseOptions(preprocessorSymbols: new[] { "NET9_0_OR_GREATER" });
            var tree = CSharpSyntaxTree.ParseText(writer.ToString(), options);
            var compilation = CSharpCompilation.Create("OriginalFrameworkState", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.True(new ProviderNameReducer(compilation).TryPlan(tree.GetRoot(), writer.TypeReferences!, out var plan));
            StringAssert.Contains("global::System.DateTimeOffset.Now", plan!.Apply().ToString());
        }

        private static string Reduce(CodeWriter writer, bool expectedPlan)
        {
            var source = writer.ToString();
            var root = CSharpSyntaxTree.ParseText(source).GetRoot();
            var compilation = CSharpCompilation.Create("ConditionalCleanup", new[] { root.SyntaxTree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var canPlan = new ProviderNameReducer(compilation).TryPlan(root, writer.TypeReferences!, out var plan);
            Assert.AreEqual(expectedPlan, canPlan);
            var output = canPlan ? plan!.Apply().ToString() : source;
            foreach (var symbols in new[] { Array.Empty<string>(), new[] { "NET6_0_OR_GREATER" }, new[] { "NET6_0_OR_GREATER", "NET9_0_OR_GREATER" } })
            {
                var options = new CSharpParseOptions(preprocessorSymbols: symbols);
                foreach (var text in new[] { source, output })
                {
                    var variant = CSharpCompilation.Create("ConditionalVariant", new[] { CSharpSyntaxTree.ParseText(text, options) }, References,
                        new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                    Assert.That(variant.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                }
            }
            return output;
        }
    }
}
