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
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    [NonParallelizable]
    public class ProviderCrefCleanupTests
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
        public void RecordedWholeTypeCrefIsShortenedAndKeepsItsDocumentationId()
        {
            using var writer = new CodeWriter();
            using (new CodeWriter.XmlDocWritingScope(writer))
                writer.WriteLine($"/// <summary>{typeof(DateTimeOffset):C}</summary>");
            writer.WriteRawLine("public class Consumer {} ");
            var output = Reduce(writer);
            StringAssert.Contains("cref=\"DateTimeOffset\"", output);
        }

        [Test]
        public void GenericDefinitionAndArgumentDescriptionKeepTheirIds()
        {
            using var writer = new CodeWriter();
            using (new CodeWriter.XmlDocWritingScope(writer))
                writer.WriteLine($"/// <summary>{typeof(List<DateTimeOffset>):C}</summary>");
            writer.WriteRawLine("public class Consumer {} ");
            var output = Reduce(writer);
            StringAssert.Contains("cref=\"List{T}\"", output);
            StringAssert.Contains("cref=\"DateTimeOffset\"", output);
        }

        [Test]
        public void UnrecordedMemberContainerKeepsSelectedOverload()
        {
            using var writer = new CodeWriter();
            using (new CodeWriter.XmlDocWritingScope(writer))
                writer.WriteLine($"/// <summary><see cref=\"{typeof(Convert)}.ToString(int)\"/></summary>");
            writer.WriteRawLine("public class Consumer {} ");
            StringAssert.Contains("cref=\"global::System.Convert.ToString(int)\"", Reduce(writer));
        }

        [Test]
        public void ProseCodeTextAndUnrecordedCrefAreNotRewritten()
        {
            using var writer = new CodeWriter();
            using (new CodeWriter.XmlDocWritingScope(writer))
            {
                writer.WriteLine($"/// <summary><c>{typeof(DateTimeOffset)}</c> text {typeof(DateTimeOffset)}.");
                writer.WriteRawLine("/// <see cref=\"global::System.DateTimeOffset\"/></summary>");
            }
            writer.WriteRawLine("public class Consumer {} ");
            var output = Reduce(writer);
            StringAssert.Contains("<c>global::System.DateTimeOffset</c>", output);
            StringAssert.Contains("text global::System.DateTimeOffset", output);
            StringAssert.Contains("cref=\"global::System.DateTimeOffset\"", output);
        }

        private static string Reduce(CodeWriter writer)
        {
            var source = writer.ToString();
            var options = new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose);
            var tree = CSharpSyntaxTree.ParseText(source, options);
            var compilation = CSharpCompilation.Create("CrefCleanup", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            AssertNoErrors(compilation);
            var root = tree.GetRoot();
            var beforeModel = compilation.GetSemanticModel(tree);
            var before = root.DescendantNodes(descendIntoTrivia: true).OfType<XmlCrefAttributeSyntax>()
                .Select(n => (n.Cref.Span, Id(beforeModel, n.Cref))).ToArray();
            Assert.True(new ProviderNameReducer(compilation).TryPlan(root, writer.TypeReferences!, out var plan));
            var output = plan!.Apply().ToString();
            var parsed = CSharpSyntaxTree.ParseText(output, options);
            var after = compilation.ReplaceSyntaxTree(tree, parsed);
            AssertNoErrors(after);
            var model = after.GetSemanticModel(parsed);
            foreach (var (span, id) in before)
            {
                var start = span.Start - plan.Deletions.Where(c => c.End <= span.Start).Sum(static c => c.Length);
                var end = span.End - plan.Deletions.Where(c => c.End <= span.End).Sum(static c => c.Length);
                var mapped = parsed.GetRoot().DescendantNodes(descendIntoTrivia: true).OfType<XmlCrefAttributeSyntax>()
                    .Single(n => n.Cref.Span == TextSpan.FromBounds(start, end));
                Assert.AreEqual(id, Id(model, mapped.Cref));
            }
            return output;
        }
        private static string Id(SemanticModel model, CrefSyntax cref)
        {
            var info = model.GetSymbolInfo(cref);
            Assert.NotNull(info.Symbol, cref.ToString());
            return info.Symbol!.ContainingAssembly?.Identity + ":" + info.Symbol.OriginalDefinition.GetDocumentationCommentId();
        }
        private static void AssertNoErrors(Compilation c) => Assert.That(c.GetDiagnostics()
            .Where(static d => d.Severity == DiagnosticSeverity.Error || d.Id == "CS1574" || d.Id == "CS1584"), Is.Empty);
    }
}
