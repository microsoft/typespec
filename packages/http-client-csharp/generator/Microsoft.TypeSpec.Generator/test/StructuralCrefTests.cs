// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase("using System;", "DateTimeOffset")]
        [TestCase("using A = System;", "global::System.DateTimeOffset")]
        [TestCase("using Moment = System.DateTimeOffset;", "global::System.DateTimeOffset")]
        public async Task StructuralCrefRecordedNamedTypeKeepsWholeTarget(string imports, string expected)
        {
            var code = Recorded(writer =>
            {
                // CodeWriter already adds System. Keep the ordinary-import
                // positive diagnostic-clean and genuinely used; aliases retain
                // without the separate import-usage certificate they require.
                if (imports != "using System;") writer.WriteRawLine(imports);
                using (new CodeWriter.XmlDocWritingScope(writer)) writer.WriteLine($"/// <summary>{typeof(DateTimeOffset):C}</summary>");
                writer.WriteRawLine(imports == "using System;" ? "public class Clock { public DateTimeOffset Value=>default; }" : "public class Clock {}");
            });
            if (imports != "using System;")
            {
                // CodeWriter adds System for the recorded type. Remove that one
                // generated using AND remap its recorded spans so these cases
                // actually exercise namespace aliases / closed-alias retention.
                const string autoUsing = "using System;\n";
                var start = code.Content.IndexOf(autoUsing, StringComparison.Ordinal);
                Assert.That(start, Is.GreaterThanOrEqualTo(0));
                Assert.That(code.Content.IndexOf(autoUsing, start + autoUsing.Length, StringComparison.Ordinal), Is.EqualTo(-1));
                var sites = code.TypeReferences!.Select(site => site with
                {
                    Span = site.Span.Start >= start + autoUsing.Length ? new TextSpan(site.Span.Start - autoUsing.Length, site.Span.Length) : site.Span
                }).ToArray();
                code = new CodeFile(code.Content.Remove(start, autoUsing.Length), code.Name, sites);
            }
            var output = await Reduce(code);
            StringAssert.Contains("cref=\"" + expected + "\"", output);
            AssertStructuralCrefs(code.Content, output);
        }

        [Test]
        public async Task StructuralCrefSameNamedMethodRequiresQualifiedAlternative()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Fixtures { public class Widget {} } public static class Factory {");
                using (new CodeWriter.XmlDocWritingScope(writer)) writer.WriteLine($"/// <summary>{new CSharpType("Widget", "Fixtures", false, false, null, Array.Empty<CSharpType>(), true, false):C}</summary>");
                writer.WriteRawLine("public static Widget Widget() => null; }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("cref=\"Fixtures.Widget\"", output);
            AssertStructuralCrefs(code.Content, output);
        }

        [Test]
        public async Task StructuralCrefRecordedOccurrenceDoesNotAuthorizeUnrecordedSibling()
        {
            var code = Recorded(writer =>
            {
                using (new CodeWriter.XmlDocWritingScope(writer))
                {
                    writer.WriteLine($"/// <summary>{typeof(DateTimeOffset):C}");
                    writer.WriteRawLine("/// <see cref=\"global::System.DateTimeOffset\"/></summary>");
                }
                // A real code use preserves the imported namespace independently
                // of both the recorded and deliberately unrecorded crefs.
                writer.WriteRawLine("public class Clock { public DateTimeOffset Value=>default; }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("cref=\"DateTimeOffset\"", output);
            StringAssert.Contains("cref=\"global::System.DateTimeOffset\"", output);
            AssertStructuralCrefs(code.Content, output);
        }

        [TestCase("missing")]
        [TestCase("wrongSpan")]
        [TestCase("wrongType")]
        [TestCase("wrongRole")]
        public async Task StructuralCrefInvalidOrAbsentProvenanceRetains(string mode)
        {
            var original = Recorded(writer =>
            {
                writer.WriteRawLine("using System;");
                using (new CodeWriter.XmlDocWritingScope(writer)) writer.WriteLine($"/// <summary>{typeof(DateTimeOffset):C}</summary>");
                writer.WriteRawLine("public class Clock {}");
            });
            var sites = original.TypeReferences!.Select(site => mode switch
            {
                "wrongSpan" => site with { Span = new TextSpan(site.Span.Start + 1, site.Span.Length - 1) },
                "wrongType" => site with { Type = typeof(TimeSpan) },
                "wrongRole" => site with { Role = TypeReferenceRole.Code },
                _ => site
            }).ToArray();
            var code = new CodeFile(original.Content, original.Name, mode == "missing" ? Array.Empty<TypeReferenceSite>() : sites);
            var output = await Reduce(code);
            StringAssert.Contains("cref=\"global::System.DateTimeOffset\"", output);
            AssertStructuralCrefs(code.Content, output);
        }

        [Test]
        public async Task StructuralCrefProseCodeAndMemberSignatureRemainUntouched()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;");
                using (new CodeWriter.XmlDocWritingScope(writer))
                {
                    writer.WriteLine($"/// <summary>{typeof(DateTimeOffset):C}");
                    writer.WriteLine($"/// <c>{typeof(DateTimeOffset)}</c> prose {typeof(DateTimeOffset)}.");
                    writer.WriteLine($"/// <see cref=\"{typeof(Convert)}.ToString(int)\"/></summary>");
                }
                writer.WriteRawLine("public class Clock {}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("<c>global::System.DateTimeOffset</c>", output);
            StringAssert.Contains("prose global::System.DateTimeOffset", output);
            StringAssert.Contains("cref=\"global::System.Convert.ToString(int)\"", output);
            AssertStructuralCrefs(code.Content, output);
        }

        [Test]
        public async Task StructuralCrefGenericDeclarationIsNotTreatedAsLexicalConstruction()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using System.Collections.Generic;");
                using (new CodeWriter.XmlDocWritingScope(writer)) writer.WriteLine($"/// <summary>{typeof(List<DateTimeOffset>):C}</summary>");
                writer.WriteRawLine("public class Clock {}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("cref=\"global::System.Collections.Generic.List{T}\"", output);
            AssertStructuralCrefs(code.Content, output);
        }

        [Test]
        public async Task StructuralCrefConditionalDocumentRemainsConservative()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; class Clock {");
                using (new CodeWriter.XmlDocWritingScope(writer)) writer.WriteLine($"/// <summary>{typeof(DateTimeOffset):C}</summary>");
                writer.WriteRawLine("public void M() {} private int V() {\n#if NET8_0_OR_GREATER\nreturn 8;\n#else\nreturn 6;\n#endif\n} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("cref=\"global::System.DateTimeOffset\"", output);
            AssertStructuralCrefs(code.Content, output);
        }

        private static void AssertStructuralCrefs(string before, string after)
        {
            string TypeIdentity(ITypeSymbol? type) => type switch
            {
                null => "<none>",
                // Cref-declared generic parameters are not lexical parameters:
                // their public symbol can have no ContainingSymbol at all.
                ITypeParameterSymbol parameter => "parameter:" + parameter.TypeParameterKind + ":" + parameter.Ordinal + ":" + parameter.Name + ":" +
                    parameter.ContainingSymbol?.GetDocumentationCommentId() + ":" + parameter.NullableAnnotation,
                INamedTypeSymbol named => named.ContainingAssembly?.Identity + ":" + named.OriginalDefinition.GetDocumentationCommentId() + ":" + named.NullableAnnotation +
                    ":owner=" + TypeIdentity(named.ContainingType) + "<" + string.Join(",", named.TypeArguments.Select(TypeIdentity)) + ">",
                IArrayTypeSymbol array => "array:" + array.Rank + ":" + TypeIdentity(array.ElementType) + ":" + array.NullableAnnotation,
                _ => StructuralTypeNameRuleOracleTests.TypeIdentity(type)
            };
            (string[] Targets, string Outside) Snapshot(string source)
            {
                var tree = CSharpSyntaxTree.ParseText(source, new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose));
                var compilation = CSharpCompilation.Create("StructuralCrefOracle", new[] { tree }, References,
                    new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                Assert.That(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error || d.Id is "CS1574" or "CS1584" or "CS0419"), Is.Empty);
                var model = compilation.GetSemanticModel(tree);
                var crefs = tree.GetRoot().DescendantNodes(descendIntoTrivia: true).OfType<XmlCrefAttributeSyntax>().Select(a => a.Cref).ToArray();
                var targets = crefs.Select(cref =>
                {
                    var info = model.GetSymbolInfo(cref);
                    Assert.That(info.CandidateReason, Is.EqualTo(CandidateReason.None));
                    Assert.That(info.CandidateSymbols, Is.Empty);
                    Assert.That(info.Symbol, Is.Not.Null, cref.ToString());
                    return info.Symbol is ITypeSymbol type ? TypeIdentity(type) :
                        info.Symbol!.Kind + ":" + info.Symbol.GetDocumentationCommentId() + ":" + TypeIdentity(info.Symbol.ContainingType);
                }).ToArray();
                return (targets, tree.GetText().WithChanges(crefs.Select(cref => new TextChange(cref.Span, "__CREF__"))).ToString());
            }
            var original = Snapshot(before); var candidate = Snapshot(after);
            Assert.That(candidate.Targets, Is.EqualTo(original.Targets), "Every complete cref must retain its exact documented target");
            Assert.That(candidate.Outside, Is.EqualTo(original.Outside), "All source/XML/trivia outside cref spans must remain exact");
            Assert.That(System.Text.RegularExpressions.Regex.Matches(after, "\\r\\n|\\r|\\n").Select(m => m.Value),
                Is.EqualTo(System.Text.RegularExpressions.Regex.Matches(before, "\\r\\n|\\r|\\n").Select(m => m.Value)));
        }
    }
}
