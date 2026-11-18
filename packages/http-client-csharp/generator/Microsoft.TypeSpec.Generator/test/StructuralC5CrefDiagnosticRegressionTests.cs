// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        // Global imports can affect OTHER documents and remain unsupported.
        [TestCase("global using System;")]
        public async Task StructuralC5CrefPreservesHiddenUnusedImportDiagnostic(string directive)
        {
            var code = C5DiagnosticCrefCode(directive, "");
            var output = await Reduce(code);
            var before = C5CrefDiagnostics(code.Content);
            Assert.That(before.Any(static d => d.StartsWith("CS8019|Hidden|", StringComparison.Ordinal)), Is.True, "The original import must genuinely be unused.");
            Assert.That(C5CrefDiagnostics(output), Is.EqualTo(before), "Equal cref symbols and XML do not establish preservation of import diagnostics.");
        }

        [Test]
        public async Task StructuralCrefImportActivationChangesOnlyHiddenUnusedImport()
        {
            // Preserve the original C5 ordinary-import regression input. Its old
            // exact-Hidden-equality expectation is now an explicit policy delta:
            // this same import becomes genuinely used by the bare type cref.
            var code = C5DiagnosticCrefCode("using System;", "");
            var before = C5CrefDiagnostics(code.Content);
            Assert.That(before, Is.EqualTo(new[] { "CS8019|Hidden|False|Unnecessary using directive." }));
            var output = await Reduce(code);
            StringAssert.Contains("cref=\"DateTimeOffset\"", output);
            Assert.That(C5CrefDiagnostics(output), Is.Empty);
            AssertStructuralCrefs(code.Content, output);
        }

        [Test]
        public async Task StructuralC5CrefGenuinelyUsedImportStillSimplifies()
        {
            var code = C5DiagnosticCrefCode("using System;", "public DateTimeOffset Value=>default;");
            var output = await Reduce(code);
            Assert.That(C5CrefDiagnostics(code.Content).Any(static d => d.StartsWith("CS8019|", StringComparison.Ordinal)), Is.False);
            StringAssert.Contains("cref=\"DateTimeOffset\"", output);
            Assert.That(C5CrefDiagnostics(output), Is.EqualTo(C5CrefDiagnostics(code.Content)));
        }

        [Test]
        public async Task StructuralC5CrefNoImportRetainsUsefulQualifiedReduction()
        {
            var code = C5DiagnosticCrefCode("", "");
            var output = await Reduce(code);
            StringAssert.Contains("cref=\"System.DateTimeOffset\"", output);
            Assert.That(C5CrefDiagnostics(output), Is.EqualTo(C5CrefDiagnostics(code.Content)));
        }

        [Test]
        public async Task StructuralC5CrefWorkspaceDiagnosticCertificateEnvironment()
        {
            var probe = new C5CrefEnvironmentProbe();
            CodeModelGenerator.Instance.AddRewriter(probe);
            await Reduce(C5DiagnosticCrefCode("using System;", "public DateTimeOffset Value=>default;"));
            Assert.That(probe.Seen, Is.True);
        }

        private sealed class C5CrefEnvironmentProbe : LibraryRewriter
        {
            internal bool Seen { get; private set; }
            public override SyntaxNode? VisitCompilationUnit(Microsoft.CodeAnalysis.CSharp.Syntax.CompilationUnitSyntax node)
            {
                var compilation = SemanticModel!.Compilation;
                var options = (CSharpCompilationOptions)compilation.Options;
                var provider = options.SyntaxTreeOptionsProvider;
                TestContext.Progress.WriteLine("C5 cref environment: " + options.GeneralDiagnosticOption + " | specific=" + options.SpecificDiagnosticOptions.Count + " | provider=" + provider?.GetType().FullName + " | imports=" + string.Join(",", options.Usings) + " | supported=" + StructuralCrefImportRules.SupportsCompilation(compilation) + " | tree=" + StructuralCrefImportRules.HasSafeOriginalTreeDiagnostics(SemanticModel));
                TestContext.Progress.WriteLine("C5 cref original diagnostics: " + string.Join(";", SemanticModel.GetDiagnostics().Select(static d => d.ToString())));
                Seen = true;
                return base.VisitCompilationUnit(node);
            }
        }

        private static CodeFile C5DiagnosticCrefCode(string directive, string extra)
        {
            const string type = "global::System.DateTimeOffset";
            var source = directive + "\nclass Clock{\n/// <summary><see cref=\"" + type + "\"/></summary>\npublic void M(){}" + extra + "}";
            return new CodeFile(source, "Clock.cs", new[] { new TypeReferenceSite(new TextSpan(source.IndexOf(type, StringComparison.Ordinal), type.Length), typeof(DateTimeOffset), TypeReferenceRole.WholeTypeCref) });
        }

        private static string[] C5CrefDiagnostics(string source)
        {
            var tree = CSharpSyntaxTree.ParseText(source, new CSharpParseOptions(LanguageVersion.Preview, DocumentationMode.Diagnose), "Clock.cs");
            var compilation = CSharpCompilation.Create("C5CrefDiagnostics", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, reportSuppressedDiagnostics: true));
            return compilation.GetDiagnostics().Select(static d => d.Id + "|" + d.Severity + "|" + d.IsSuppressed + "|" + d.GetMessage()).OrderBy(static d => d, StringComparer.Ordinal).ToArray();
        }
    }
}
