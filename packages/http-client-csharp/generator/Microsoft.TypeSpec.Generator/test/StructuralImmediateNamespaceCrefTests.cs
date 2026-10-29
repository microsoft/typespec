// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    // Portable policy controls supplement the authenticated full SDK workspace
    // reproduction; these small fixtures are not claims of SDK coverage.
    [NonParallelizable]
    public class StructuralImmediateNamespaceCrefTests
    {
        private string? _previous;
        private string _directory = null!;

        [SetUp]
        public void SetUp()
        {
            _previous = Environment.GetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER");
            Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", "structural");
            _directory = Path.Combine(Path.GetTempPath(), "typespec-c9-cref", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_directory);
            MockHelpers.LoadMockGenerator(outputPath: _directory, configuration: "{\"package-name\":\"Sample\",\"disable-xml-docs\":true}");
        }

        [TearDown]
        public void TearDown()
        {
            Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", _previous);
            Directory.Delete(_directory, recursive: true);
        }
        [TestCase("type", false)]
        [TestCase("constructor", false)]
        [TestCase("method", false)]
        [TestCase("type", true)]
        public void DirectNamespaceCrefDoesNotConsumeUnusedImport(string attachment, bool fileScoped)
        {
            var code = Build(attachment, fileScoped);
            var result = Reduce(code);
            Assert.That(result.Before.GetDiagnostics().Any(d => d.Id == "CS8019"), Is.True, "Original unused-import regression anchor");
            StringAssert.Contains("cref=\"T\"", result.Text);
            Preserve(code.Content, result);
        }

        [Test]
        public void SameNamespaceForeignImportDoesNotBecomeUsed()
        {
            var code = Build("type", false, "using Foreign;", "namespace Foreign { public class T {} }");
            var result = Reduce(code);
            StringAssert.Contains("cref=\"T\"", result.Text);
            Preserve(code.Content, result);
        }

        [TestCase("ancestor")]
        [TestCase("shadow")]
        [TestCase("conditional")]
        [TestCase("pragma")]
        [TestCase("enhanced-line")]
        [TestCase("hidden")]
        [TestCase("unrecorded")]
        public void UnsupportedCertificateDoesNotRelaxOriginalRetention(string kind)
        {
            var code = kind == "ancestor" ? Build("ancestor", false) : Build("method", false,
                kind == "pragma" ? "#pragma warning restore\n" :
                kind == "enhanced-line" ? "#line (100,1)-(200,10) 40 \"map.cs\"\n" : "",
                kind == "conditional" ? "#if EXPERIMENTAL\nclass Alternate {}\n#endif" : "",
                shadow: kind == "shadow", hidden: kind == "hidden");
            if (kind == "unrecorded") code = new CodeFile(code.Content, code.Name, Array.Empty<TypeReferenceSite>());
            var result = Reduce(code);
            StringAssert.Contains("cref=\"global::N.T\"", result.Text);
            Preserve(code.Content, result);
        }

        [TestCase("global using Foreign;")]
        [TestCase("using Alias = Foreign;")]
        [TestCase("using static Foreign.Utility;")]
        public void UnsupportedImportElsewhereRemainsBarrier(string import)
        {
            var code = Build("type", false, "", "namespace Foreign { public static class Utility {} }");
            var result = Reduce(code, import + "\nnamespace Other { class Additional {} }");
            StringAssert.Contains("cref=\"global::N.T\"", result.Text);
            Preserve(code.Content, result);
        }

        private static CodeFile Build(string attachment, bool fileScoped, string prefix = "", string other = "", bool shadow = false, bool hidden = false)
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine(prefix);
            writer.WriteRawLine("using N;");
            writer.WriteRawLine(fileScoped ? "namespace N;" : "namespace N {");
            writer.WriteRawLine("public partial class T {}");
            if (attachment == "ancestor") writer.WriteRawLine("namespace Inner {");
            if (attachment == "constructor") writer.WriteRawLine("public partial class T {");
            if (attachment == "method") writer.WriteRawLine("public class C {" + (shadow ? "public void T() {}" : ""));
            if (hidden) writer.WriteRawLine("#line hidden");
            using (new CodeWriter.XmlDocWritingScope(writer))
                writer.WriteLine($"/// <summary>{new CSharpType("T", "N", false, false, null, Array.Empty<CSharpType>(), true, false):C}</summary>");
            writer.WriteRawLine(attachment == "constructor" ? "public T() {}" : attachment == "method" ? "public void M() {}" : "public class C {}");
            if (hidden) writer.WriteRawLine("#line default");
            if (attachment is "constructor" or "method" or "ancestor") writer.WriteRawLine("}");
            if (!fileScoped) writer.WriteRawLine("}");
            writer.WriteRawLine(other);
            return new CodeFile(writer.ToString(), "ImmediateNamespace.cs", writer.TypeReferences);
        }

        private sealed record Result(string Text, CSharpCompilation Before, CSharpCompilation After, SyntaxTree Original, SyntaxTree Candidate);
        private static Result Reduce(CodeFile code, string? other = null)
        {
            using var workspace = new AdhocWorkspace();
            var project = workspace.AddProject("ImmediateNamespaceCref", LanguageNames.CSharp)
                .WithParseOptions(new CSharpParseOptions(preprocessorSymbols: new[] { "EXPERIMENTAL" }, documentationMode: DocumentationMode.Parse))
                .WithCompilationOptions(new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary,
                    metadataReferenceResolver: new WorkspaceMetadataReferenceResolver(), nullableContextOptions: NullableContextOptions.Disable))
                .AddMetadataReference(MetadataReference.CreateFromFile(typeof(object).Assembly.Location));
            var document = project.AddDocument(code.Name, SourceText.From(code.Content), new[] { "Generated" });
            project = document.Project;
            if (other != null) project = project.AddDocument("Other.cs", SourceText.From(other)).Project;
            document = project.GetDocument(document.Id)!;
            var compilation = (CSharpCompilation)project.GetCompilationAsync().GetAwaiter().GetResult()!;
            var tree = document.GetSyntaxTreeAsync().GetAwaiter().GetResult()!;
            var root = tree.GetRoot();
            var rewriter = new StructuralTypeNameReducer(compilation).CreateRewriter(root, code.TypeReferences!);
            var text = rewriter?.Visit(root)?.ToFullString() ?? code.Content;
            var candidate = project.GetDocument(document.Id)!.WithText(SourceText.From(text)).Project;
            var after = (CSharpCompilation)candidate.GetCompilationAsync().GetAwaiter().GetResult()!;
            return new Result(text, compilation, after, tree, candidate.GetDocument(document.Id)!.GetSyntaxTreeAsync().GetAwaiter().GetResult()!);
        }

        private static void Preserve(string original, Result result)
        {
            var prefix = "global::N.";
            var oldCref = result.Original.GetRoot().DescendantNodes(descendIntoTrivia: true).OfType<XmlCrefAttributeSyntax>().Single().Cref;
            var changed = original != result.Text;
            var start = oldCref.SpanStart;
            if (changed) Assert.That(result.Text, Is.EqualTo(original.Remove(start, prefix.Length)), "Only the witnessed namespace prefix may be deleted");
            var removed = changed ? prefix.Length : 0;
            string LocationKey(Location location, bool project)
            {
                if (!location.IsInSource) return location.Kind.ToString();
                var span = location.SourceSpan;var tree = location.SourceTree!;
                if (project && ReferenceEquals(tree, result.Original))
                {
                    Assert.That(span.Start < start + removed && span.End > start && removed != 0, Is.False, "No diagnostic intersection may be waived");
                    int Map(int p) => p <= start ? p : p - removed;
                    span = TextSpan.FromBounds(Map(span.Start), Map(span.End));tree = result.Candidate;
                }
                return tree.FilePath + "|" + span.Start + ":" + span.End + "|" + tree.GetLineSpan(span) + "|" + tree.GetMappedLineSpan(span);
            }
            string[] Bag(IEnumerable<Diagnostic> diagnostics, bool project) => diagnostics.Select(d => d.Id + "|" + d.Severity + "|" + d.IsSuppressed + "|" + d.WarningLevel + "|" + d.GetMessage() + "|" + LocationKey(d.Location, project) + "|" + string.Join(";", d.AdditionalLocations.Select(l => LocationKey(l, project)))).OrderBy(x => x, StringComparer.Ordinal).ToArray();
            Assert.That(Bag(result.After.GetDiagnostics(), false), Is.EqualTo(Bag(result.Before.GetDiagnostics(), true)), "Complete compiler diagnostic multiset");
            using var oldPe = new MemoryStream();using var oldXml = new MemoryStream();using var newPe = new MemoryStream();using var newXml = new MemoryStream();
            var before = result.Before.Emit(oldPe, xmlDocumentationStream: oldXml);var after = result.After.Emit(newPe, xmlDocumentationStream: newXml);
            Assert.That(after.Success, Is.EqualTo(before.Success));
            Assert.That(Bag(after.Diagnostics, false), Is.EqualTo(Bag(before.Diagnostics, true)), "Complete emit diagnostic multiset");
            if (before.Success) Assert.That(newXml.ToArray(), Is.EqualTo(oldXml.ToArray()), "Successful emitted XML must remain identical");
        }
    }
}
