// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [Test]
        public async Task StructuralCrefDeepNamespaceAliasRetainsWithoutImportDiagnosticCertificate()
        {
            CodeModelGenerator.Instance.AddMetadataReference(MetadataReference.CreateFromFile(typeof(System.Net.Http.HttpClient).Assembly.Location));
            const string source = "using A = System.Net.Http;\n/// <summary><see cref=\"global::System.Net.Http.HttpClient\"/></summary>\npublic class Clock {}";
            var code = RecordedCrefSource(source, typeof(System.Net.Http.HttpClient));
            var output = await Reduce(code);
            StringAssert.Contains("cref=\"global::System.Net.Http.HttpClient\"", output);
            AssertStructuralCrefs(source, output);
        }

        [Test]
        public async Task StructuralCrefMissingWorkspaceMetadataRetainsQualification()
        {
            Assert.That(CodeModelGenerator.Instance.AdditionalMetadataReferences.OfType<PortableExecutableReference>()
                .Any(reference => reference.FilePath == typeof(System.Net.Http.HttpClient).Assembly.Location), Is.False);
            const string source = "using A = System.Net.Http;\n/// <summary><see cref=\"global::System.Net.Http.HttpClient\"/></summary>\npublic class Clock {}";
            var output = await Reduce(RecordedCrefSource(source, typeof(System.Net.Http.HttpClient)));
            StringAssert.Contains("cref=\"global::System.Net.Http.HttpClient\"", output);
            AssertStructuralCrefs(source, output);
        }

        [TestCase("@class", "class")]
        [TestCase("\\u0057idget", "Widget")]
        public async Task StructuralCrefTerminalEscapesAreOccurrenceOwned(string token, string name)
        {
            var source = "using Fixtures; namespace Fixtures { public class " + token + " {} }\n/// <summary><see cref=\"global::Fixtures." + token + "\"/></summary>\npublic class Clock { public " + token + " Value=>null; }";
            var output = await Reduce(RecordedCrefSource(source, CrefFixtureType(name)));
            StringAssert.Contains("cref=\"" + token + "\"", output);
            AssertStructuralCrefs(source, output);
        }

        [Test]
        public async Task StructuralCrefNongenericNestedTypeKeepsConstructedOwner()
        {
            const string source = "using Fixtures; namespace Fixtures { public class Outer { public class Inner {} } }\n/// <summary><see cref=\"global::Fixtures.Outer.Inner\"/></summary>\npublic class Clock { public Outer Value=>null; }";
            var owner = CrefFixtureType("Outer");
            var target = new CSharpType("Inner", "Fixtures", false, false, owner, Array.Empty<CSharpType>(), true, false);
            var output = await Reduce(RecordedCrefSource(source, target));
            StringAssert.Contains("cref=\"Outer.Inner\"", output);
            AssertStructuralCrefs(source, output);
        }

        [Test]
        public async Task StructuralCrefLexicalTypeParameterCannotShadowDocumentedType()
        {
            const string source = "using System; public class Clock<DateTimeOffset> {\n/// <summary><see cref=\"global::System.DateTimeOffset\"/></summary>\npublic void M() {} public TimeSpan Value=>default; }";
            var output = await Reduce(RecordedCrefSource(source, typeof(DateTimeOffset)));
            StringAssert.Contains("cref=\"System.DateTimeOffset\"", output);
            AssertStructuralCrefs(source, output);
        }

        [Test]
        public async Task StructuralCrefAmbiguousImportsKeepQualifiedAlternative()
        {
            const string source = "using Fixtures; using Other; namespace Fixtures { public class Widget {} public class FirstOnly {} } namespace Other { public class Widget {} public class OtherOnly {} }\n/// <summary><see cref=\"global::Fixtures.Widget\"/></summary>\npublic class Clock { public FirstOnly First=>null; public OtherOnly Second=>null; }";
            var output = await Reduce(RecordedCrefSource(source, CrefFixtureType("Widget")));
            StringAssert.Contains("cref=\"Fixtures.Widget\"", output);
            AssertStructuralCrefs(source, output);
        }

        [Test]
        public async Task StructuralCrefDuplicateProvenanceIsNotAnAuthorization()
        {
            const string source = "using System;\n/// <summary><see cref=\"global::System.DateTimeOffset\"/></summary>\npublic class Clock {}";
            var original = RecordedCrefSource(source, typeof(DateTimeOffset));
            var code = new CodeFile(source, "Clock.cs", original.TypeReferences!.Concat(original.TypeReferences!).ToArray());
            var output = await Reduce(code);
            StringAssert.Contains("cref=\"global::System.DateTimeOffset\"", output);
            AssertStructuralCrefs(source, output);
        }

        [TestCase("global::System.Convert.ToString(int)")]
        [TestCase("global::System.DateTimeOffset[]")]
        public async Task StructuralCrefWholeTypeRoleDoesNotAuthorizeUnsupportedShape(string spelling)
        {
            var source = "using System;\n/// <summary><see cref=\"" + spelling + "\"/></summary>\npublic class Clock {}";
            var type = spelling.Contains("Convert") ? new CSharpType(typeof(Convert)) : new CSharpType(typeof(DateTimeOffset[]));
            var output = await Reduce(RecordedCrefSource(source, type));
            StringAssert.Contains("cref=\"" + spelling + "\"", output);
            if (spelling.EndsWith("[]", StringComparison.Ordinal))
            {
                // This is malformed cref grammar, not a valid array-symbol cref.
                // Preserve it exactly; a valid-target oracle cannot certify it.
                Assert.That(output, Is.EqualTo(source));
                var options = new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose);
                Assert.That(CSharpSyntaxTree.ParseText(source, options).GetDiagnostics().Any(static d => d.Id == "CS1584"), Is.True);
            }
            else
            {
                AssertStructuralCrefs(source, output);
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralCrefVisibilityIsNotCachedAcrossOccurrences(bool hiddenFirst)
        {
            const string hidden = "\n#line hidden\n/// <summary><see cref=\"global::System.DateTimeOffset\"/></summary>\npublic class Hidden {}\n#line default\n";
            const string visible = "/// <summary><see cref=\"global::System.DateTimeOffset\"/></summary>\npublic class Visible {}\n";
            var source = "using System;\n" + (hiddenFirst ? hidden + visible : visible + hidden) + "class Uses { public DateTimeOffset Value=>default; }\n";
            var output = await Reduce(RecordedCrefSource(source, typeof(DateTimeOffset)));
            var crefs = CSharpSyntaxTree.ParseText(output).GetRoot().DescendantNodes(descendIntoTrivia: true).OfType<XmlCrefAttributeSyntax>().Select(a => a.Cref.ToString()).ToArray();
            Assert.That(crefs[hiddenFirst ? 0 : 1], Is.EqualTo("global::System.DateTimeOffset"));
            if (hiddenFirst)
            {
                Assert.That(crefs[1], Is.EqualTo("DateTimeOffset"));
            }

            AssertStructuralCrefs(source, output);
        }

        [TestCase("\n")]
        [TestCase("\r\n")]
        public async Task StructuralCrefMultilinePrefixPreservesExteriorAndLaterLine(string newline)
        {
            var source = "using System; using System.Runtime.CompilerServices;" + newline +
                "/// <summary><see cref=\"global::System." + newline + "/// DateTimeOffset\"/></summary>" + newline +
                "public class Clock { static int Line([CallerLineNumber] int line = 0) => line; public int M() => Line(); }";
            var output = await Reduce(RecordedCrefSource(source, typeof(DateTimeOffset)));
            StringAssert.Contains("global::System." + newline + "/// DateTimeOffset", output);
            AssertStructuralCrefs(source, output);
            AssertParenthesesOperations(source, output, parseOptions: new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralCrefCapturedLocalFunctionDocumentationUsesEnclosingObserver(bool explicitOverride)
        {
            var source = "using System; using System.Runtime.CompilerServices; class Clock { static string Capture(Func<int> f, [CallerArgumentExpression(\"f\")] string text = null) => text; " +
                "public string M() => Capture(() => {\n/// <summary><see cref=\"global::System.DateTimeOffset\"/></summary>\nint Local() => 1; return Local(); }" + (explicitOverride ? ", \"manual\"" : "") + "); }";
            var output = await Reduce(RecordedCrefSource(source, typeof(DateTimeOffset)));
            Assert.That(output.Contains("cref=\"global::System.DateTimeOffset\""), Is.EqualTo(!explicitOverride));
            AssertStructuralCrefs(source, output);
            AssertParenthesesOperations(source, output, parseOptions: new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose));
        }

        [TestCase("disabled")]
        [TestCase("custom")]
        [TestCase("header")]
        public async Task StructuralCrefWorkspaceAndCompilationGatesRemain(string mode)
        {
            if (mode == "disabled")
            {
                MockHelpers.LoadMockGenerator(outputPath: _directory,
                configuration: "{\"package-name\":\"Sample\",\"disable-xml-docs\":true,\"disable-roslyn-reduce\":true}");
            }

            if (mode == "custom")
            {
                CodeModelGenerator.Instance.AddRewriter(new Probe());
            }

            const string source = "using System;\n/// <summary><see cref=\"global::System.DateTimeOffset\"/></summary>\npublic class Clock {}";
            var extra = mode == "header" ? "#if NET8_0_OR_GREATER\nclass Variant<T> {}\n#else\nclass Variant {}\n#endif" : null;
            // Custom rewriters deliberately use the existing formatter route.
            // Start formatted so its unrelated brace spacing is not a cref edit.
            var formatted = source.Replace("class Clock {}", "class Clock { }");
            var output = await Reduce(RecordedCrefSource(formatted, typeof(DateTimeOffset)), extra);
            StringAssert.Contains("cref=\"global::System.DateTimeOffset\"", output);
            AssertStructuralCrefs(formatted, output);
        }

        [Test]
        public void StructuralCrefOracleRejectsChangedTargetAndOutsideXml()
        {
            const string source = "using System;\n/// <summary><see cref=\"global::System.DateTimeOffset\"/></summary>\npublic class Clock {}";
            AssertStructuralCrefs(source, source.Replace("global::System.DateTimeOffset", "DateTimeOffset"));
            Assert.Throws<AssertionException>(() => AssertStructuralCrefs(source, source.Replace("global::System.DateTimeOffset", "TimeSpan")));
            Assert.Throws<AssertionException>(() => AssertStructuralCrefs(source, source.Replace("summary", "remarks")));
        }

        [Test]
        public void StructuralCrefOracleRejectsBareTypeThatReparsesAsMethod()
        {
            const string source = "using Fixtures; namespace Fixtures { public class Widget {} } public static class Factory {\n/// <summary><see cref=\"global::Fixtures.Widget\"/></summary>\npublic static Widget Widget() => null; }";
            Assert.Throws<AssertionException>(() => AssertStructuralCrefs(source, source.Replace("global::Fixtures.Widget", "Widget")));
        }

        [Test]
        public void StructuralCrefNamespaceAliasRenderingMatchesActualXmlGrammar()
        {
            const string source = "using A = System.Net.Http;\n/// <summary><see cref=\"global::System.Net.Http.HttpClient\"/></summary>\npublic class Clock {}";
            var options = new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose);
            var tree = CSharpSyntaxTree.ParseText(source, options);
            var compilation = CSharpCompilation.Create("CrefAliasProbe", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var model = compilation.GetSemanticModel(tree);
            var cref = tree.GetRoot().DescendantNodes(descendIntoTrivia: true).OfType<XmlCrefAttributeSyntax>().Single().Cref;
            var target = (INamedTypeSymbol)model.GetSymbolInfo(cref).Symbol!;
            Assert.That(model.LookupNamespacesAndTypes(cref.SpanStart, name: "A").Single(), Is.InstanceOf<IAliasSymbol>());
            var description = StructuralTypeNameSelector.Describe(cref);
            var context = new StructuralTypeNameSelector.Context(compilation, model, cref, target, Source: description,
                KnownDeclarationType: true, PreserveTerminalArguments: true, ModeOverride: StructuralTypeNameSelector.Mode.Cref);
            var selected = StructuralTypeNameSelector.Choose(new[] { context });
            Assert.That(selected.Plan!.Render(description)!.ToString(), Is.EqualTo("A::HttpClient"), "Ordinary code rendering must not change");
            Assert.That(selected.Plan.RenderCrefName(description)!.ToString(), Is.EqualTo("A.HttpClient"));
            foreach (var text in new[] { "A::HttpClient", "A.HttpClient", "System.Net.Http.HttpClient" })
            {
                var parsed = CSharpSyntaxTree.ParseText(source.Replace("global::System.Net.Http.HttpClient", text), options);
                var attributes = parsed.GetRoot().DescendantNodes(descendIntoTrivia: true).OfType<XmlCrefAttributeSyntax>().ToArray();
                if (attributes.Length == 0)
                {
                    Assert.That(text, Is.EqualTo("A::HttpClient"));
                    Assert.That(parsed.GetRoot().DescendantNodes(descendIntoTrivia: true).OfType<XmlTextAttributeSyntax>().Count(), Is.EqualTo(1));
                    continue;
                }
                var node = attributes.Single().Cref;
                var info = model.GetSpeculativeSymbolInfo(cref.SpanStart, node, SpeculativeBindingOption.BindAsTypeOrNamespace);
                var actual = compilation.ReplaceSyntaxTree(tree, parsed).GetSemanticModel(parsed).GetSymbolInfo(node);
                Assert.That(node, Is.InstanceOf<QualifiedCrefSyntax>());
                Assert.That(parsed.GetDiagnostics(), Is.Empty);
                Assert.That(SymbolEqualityComparer.IncludeNullability.Equals(info.Symbol, target), Is.True);
                Assert.That(actual.Symbol?.GetDocumentationCommentId(), Is.EqualTo(target.GetDocumentationCommentId()));
                Assert.That(actual.Symbol?.ContainingAssembly?.Identity, Is.EqualTo(target.ContainingAssembly.Identity));
            }
        }

        [Test]
        public async Task StructuralCrefDocumentationIdTextIsNotTreatedAsCrefSyntax()
        {
            const string source = "using System;\n/// <summary><see cref=\"global::System.DateTimeOffset\"/> <see cref=\"T:System.DateTimeOffset\"/> <see cref=\"A::DateTimeOffset\"/></summary>\npublic class Clock { public DateTimeOffset Value=>default; }";
            var original = RecordedCrefSource(source, typeof(DateTimeOffset));
            var opaque = new[] { "T:System.DateTimeOffset", "A::DateTimeOffset" }.Select(text =>
                new TypeReferenceSite(new Microsoft.CodeAnalysis.Text.TextSpan(source.IndexOf(text, StringComparison.Ordinal), text.Length), typeof(DateTimeOffset), TypeReferenceRole.WholeTypeCref));
            var output = await Reduce(new CodeFile(source, "Clock.cs", original.TypeReferences!.Concat(opaque).ToArray()));
            StringAssert.Contains("cref=\"DateTimeOffset\"", output);
            StringAssert.Contains("cref=\"T:System.DateTimeOffset\"", output);
            StringAssert.Contains("cref=\"A::DateTimeOffset\"", output);
            AssertStructuralCrefs(source, output);
        }

        private static CSharpType CrefFixtureType(string name) => new(name, "Fixtures", false, false, null, Array.Empty<CSharpType>(), true, false);

        private static CodeFile RecordedCrefSource(string source, CSharpType type)
        {
            var root = CSharpSyntaxTree.ParseText(source, new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose)).GetRoot();
            var sites = root.DescendantNodes(descendIntoTrivia: true).OfType<XmlCrefAttributeSyntax>()
                .Select(a => new TypeReferenceSite(a.Cref.Span, type, TypeReferenceRole.WholeTypeCref)).ToArray();
            return new CodeFile(source, "Clock.cs", sites);
        }
    }
}
