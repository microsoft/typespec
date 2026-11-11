// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void ReducedImportPurityRegularOptionUsingsAreNotWriterRegisteredImports(bool writerImport)
        {
            var parameter = new ParameterProvider("p", $"receiver", typeof(int));
            CSharpType hint = writerImport ? new CSharpType("Competitor", "LateReduced", false, false, null, Array.Empty<CSharpType>(), true, false) : typeof(PreparedStaticExtensionProbe);
            var call = new InvokeMethodExpression(parameter.AsVariable(), "LateOnly", new ValueExpression[] { Literal(2) }) { ExtensionType = hint };
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            _ = owner.BaseType;
            _ = owner.DeclaringTypeProvider;
            _ = owner.CustomCodeView;
            _ = owner.WhereClause;
            FinalizeGeneratedCallFixture(owner);
            var compilation = CallProofCompilation();
            compilation = compilation.WithOptions(compilation.Options.WithUsings(new[] { "LateReduced" })).AddSyntaxTrees(CSharpSyntaxTree.ParseText(
                "namespace LateReduced { public static class Competitor { public static string LateOnly(this int receiver, int value) => \"late\"; } }"));
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, call);
            var selected = node.CallProofs?.Selection;
            var scope = PreparedCallImportScope.TryCapture(new TypeProvider[] { owner }, compilation);
            Assert.That(scope, Is.Not.Null);
            var group = scope!.Lookup(compilation.GetSpecialType(SpecialType.System_Int32), "LateOnly", call.ExtensionType, owner.Type.Namespace);
            Assert.That(group, Is.Not.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var tree = CSharpSyntaxTree.ParseText(output.Content);
            var actual = compilation.AddSyntaxTrees(tree);
            var errors = actual.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors.Length == 0, Is.EqualTo(writerImport), string.Join("\n", errors.Select(d => d.ToString())));
            if (!writerImport) { Assert.That(errors.Any(d => d.Id == "CS1061"), Is.True); }
            else
            {
                var symbol = (IMethodSymbol)actual.GetSemanticModel(tree).GetSymbolInfo(tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single()).Symbol!;
                Assert.That(symbol.ReducedFrom!.ContainingNamespace.ToDisplayString(), Is.EqualTo("LateReduced"));
            }
            Assert.That(selected is not null, Is.EqualTo(writerImport));
            Assert.That(group!.VisibleNamespaces.Contains("LateReduced"), Is.EqualTo(writerImport));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ReducedImportPurityReflectionDocTypeCannotIntroduceUncapturedUsing(bool escape)
        {
            MockHelpers.LoadMockGenerator(includeXmlDocs: true);
            var proxy = new ReducedImportReflectionType();
            CSharpType documentationType = escape ? new CSharpType(proxy) : typeof(Uri);
            var parameter = new ParameterProvider("p", $"receiver", typeof(int));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "ObserveReceiver", new ValueExpression[] { Literal(2) }) { ExtensionType = typeof(PreparedStaticExtensionProbe) };
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            _ = owner.BaseType;
            _ = owner.DeclaringTypeProvider;
            _ = owner.CustomCodeView;
            _ = owner.WhereClause;
            owner.Update(xmlDocs: new XmlDocProvider(summary: new XmlDocSummaryStatement(new[]
            {
                FormattableStringFactory.Create("see {0}", new object[] { documentationType })
            })));
            FinalizeGeneratedCallFixture(owner);
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(
                "namespace LateReduced { public static class Competitor { public static string ObserveReceiver(this int receiver, int value) => \"shadow\"; } }"));
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, call);
            var selected = node.CallProofs?.Selection;
            proxy.Escape = escape;
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var tree = CSharpSyntaxTree.ParseText(output.Content);
            var actual = compilation.WithAssemblyName("ReducedDoc_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            Assert.That(actual.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, output.Content);
            var symbol = (IMethodSymbol)actual.GetSemanticModel(tree).GetSymbolInfo(tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single()).Symbol!;
            Assert.That(symbol.ReducedFrom!.ContainingNamespace.ToDisplayString(), Is.EqualTo(escape ? "LateReduced" : typeof(PreparedStaticExtensionProbe).Namespace));
            using var stream = new MemoryStream();
            var emitted = actual.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
            var assembly = Assembly.Load(stream.ToArray());
            var runtime = (string)assembly.GetType("Sample.ParameterValueOwner")!.GetMethod("M")!.Invoke(null, new object[] { 1 })!;
            Assert.That(runtime, Is.EqualTo(escape ? "shadow" : "p"));
            Assert.That(selected is not null, Is.EqualTo(!escape));
        }

        private sealed class ReducedImportReflectionType() : TypeDelegator(typeof(Uri))
        {
            internal bool Escape { get; set; }
            public override bool IsGenericParameter => Escape;
            public override string Name => Escape ? "T\nusing LateReduced;\n//" : base.Name;
        }
    }
}
