// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
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
        [TestCase("deferred-type")]
        [TestCase("cached-type")]
        [TestCase("method")]
        public void CallDocumentationReviewHeldFactsObserveDocumentationChangesStickily(string mode)
        {
            MockHelpers.LoadMockGenerator(includeXmlDocs: true);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedKeywordCallProbe)), "Safe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            var initial = new XmlDocSummaryStatement(new FormattableString[] { $"initial" });
            if (mode == "cached-type") { owner.Update(xmlDocs: new XmlDocProvider(summary: initial)); }
            if (mode == "method") { owner.Methods[0].XmlDocs.Update(summary: initial); }
            if (mode == "deferred-type") { Assert.That(owner.CachedXmlDocs, Is.Null); }
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            var selected = occurrence.CallProofs?.Selection;
            var absent = occurrence.CallProofs?.ObservationAbsence;
            Assert.That(selected?.IsCurrent, Is.True);
            Assert.That(absent?.IsCurrent, Is.True);
            if (mode == "deferred-type") { Assert.That(owner.CachedXmlDocs, Is.Null, "Capture/currentness must not build default documentation."); }
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(owner.CachedXmlDocs, Is.Not.Null);
            Assert.That(selected!.IsCurrent, Is.True);
            Assert.That(absent!.IsCurrent, Is.True);
            var observations = prepared.SourceFiles.Single().Observations!;
            Assert.That(observations.IsCurrent, Is.True);
            var docs = mode == "method" ? owner.Methods[0].XmlDocs : owner.CachedXmlDocs!;
            var original = docs.Summary!;
            docs.Update(summary: new XmlDocSummaryStatement(new FormattableString[] { $"changed" }));
            Assert.That(selected.IsCurrent, Is.False);
            Assert.That(absent.IsCurrent, Is.False);
            Assert.That(observations.IsCurrent, Is.False);
            docs.Update(summary: original);
            Assert.That(selected.IsCurrent, Is.False);
            Assert.That(absent.IsCurrent, Is.False);
            Assert.That(observations.IsCurrent, Is.False);
            if (mode != "method") { Assert.That(prepared.SourceFiles.Single().IsCurrent(), Is.True, "Call-only confinement must not globally invalidate source/field preparation."); }
        }

        [Test]
        public void CallDocumentationReviewDisabledXmlDoesNotInspectUnwrittenFormatter()
        {
            MockHelpers.LoadMockGenerator(configuration: "{\"disable-xml-docs\":true,\"package-name\":\"Sample.Namespace\"}");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedKeywordCallProbe)), "Safe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.Update(xmlDocs: new XmlDocProvider(summary: new XmlDocSummaryStatement(Array.Empty<FormattableString>()) { StartTag = new GeneratedUnknownFormatter() }));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            Assert.That(occurrence.CallProofs?.Selection, Is.Not.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void CallDocumentationReviewUnknownBuilderDoesNotRunDuringCaptureOrVetoUri(bool enabled)
        {
            MockHelpers.LoadMockGenerator(configuration: "{\"disable-xml-docs\":" + (enabled ? "false" : "true") + ",\"package-name\":\"Sample.Namespace\"}");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedKeywordCallProbe)), "Safe", new ValueExpression[] { Literal(1) });
            var owner = new CallDocumentationBuilderOwner(call);
            owner.EnsureBuilt();
            Assert.That(owner.Callbacks, Is.Zero);
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            Assert.That(occurrence.CallProofs?.Selection, Is.Null);
            Assert.That(occurrence.CallProofs?.ObservationAbsence, Is.Null);
            Assert.That(owner.Callbacks, Is.Zero);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(owner.Callbacks, Is.EqualTo(1));
            Assert.That(output.Content, Does.Contain("private Uri _value;"));
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        private sealed class CallDocumentationBuilderOwner(ValueExpression body) : TypeProvider
        {
            internal int Callbacks { get; private set; }
            protected override string BuildName() => "DocOwner";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "DocOwner.cs";
            protected internal override FieldProvider[] BuildFields() => new[] { new FieldProvider(FieldModifiers.Private, typeof(Uri), "_value", this) };
            protected internal override MethodProvider[] BuildMethods() => new[] { new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public, typeof(string), null, Array.Empty<ParameterProvider>()), body, this) };
            protected override XmlDocProvider BuildXmlDocs() { Callbacks++; return new XmlDocProvider(summary: new XmlDocSummaryStatement(new FormattableString[] { $"ordinary" })); }
        }

        [TestCase(false, false)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(true, true)]
        public void CallDocumentationReviewActualTypeDocumentationMustRemainConfined(bool source, bool control)
        {
            MockHelpers.LoadMockGenerator(includeXmlDocs: true);
            var ns = source ? "SourceCalls" : typeof(PreparedKeywordCallProbe).Namespace!;
            var name = source ? "Probe" : nameof(PreparedKeywordCallProbe);
            var payload = "<summary>\n}\nnamespace " + ns + " { public static partial class " + name +
                " { public static string Safe(int value, [global::System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression = \"\") => \"shadow:\" + expression; } }\nnamespace " + ns + " {\n//";
            var summary = new XmlDocSummaryStatement(Array.Empty<FormattableString>())
            {
                StartTag = FormattableStringFactory.Create("{0}", new object[] { control ? "<summary>ordinary" : payload })
            };
            var compilation = source ? LoadedSourceCallCompilation("public static string Safe(object value) => \"safe\";") : CallProofCompilation();
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            CSharpType type = source ? LoadedSourceCallType() : typeof(PreparedKeywordCallProbe);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "Safe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.Update(@namespace: ns, xmlDocs: new XmlDocProvider(summary: summary));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            var selection = occurrence.CallProofs?.Selection;
            var absence = occurrence.CallProofs?.ObservationAbsence;
            var selectedCurrent = selection?.IsCurrent;
            var absentCurrent = absence?.IsCurrent;
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var tree = CSharpSyntaxTree.ParseText(output.Content);
            compilation = compilation.WithAssemblyName("DocBinding_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, output.Content);
            var invocation = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
            var actual = (IMethodSymbol)compilation.GetSemanticModel(tree).GetSymbolInfo(invocation).Symbol!;
            Assert.That(actual, Is.Not.Null);
            if (!control)
            {
                Assert.That(SymbolEqualityComparer.Default.Equals(actual.ContainingAssembly, compilation.Assembly), Is.True);
                Assert.That(actual.Parameters.Length, Is.EqualTo(2));
                Assert.That(actual.Parameters[0].Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            }
            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
            var assembly = System.Reflection.Assembly.Load(stream.ToArray());
            var runtimeType = assembly.GetType(ns + ".OccurrenceOwner")!;
            var runtime = (string)runtimeType.GetMethod("M")!.Invoke(Activator.CreateInstance(runtimeType), null)!;
            Assert.That(runtime, Is.EqualTo(control ? "safe" : "shadow:1"));
            if (control)
            {
                Assert.That(selectedCurrent, Is.True);
                Assert.That(absentCurrent, Is.True);
            }
            else
            {
                Assert.That(selection, Is.Null);
                Assert.That(absence, Is.Null);
            }
        }
    }
}
