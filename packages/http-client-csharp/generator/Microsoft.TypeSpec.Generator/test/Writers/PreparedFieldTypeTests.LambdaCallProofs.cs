// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
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
        [TestCase("literal")]
        [TestCase("call")]
        [TestCase("block")]
        public void LambdaCallProofActualFormalReturnConversionEstablishesParentCapture(string form)
        {
            ValueExpression body = form == "literal" ? Literal("leaf")
                : new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Leaf", Array.Empty<ValueExpression>());
            var closure = form == "block"
                ? new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), new ExpressionStatement(new KeywordExpression("return", body)))
                : new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), body);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Observe", new ValueExpression[] { closure });
            var compilation = CallProofCompilation();
            var actual = EmitLambdaRoot(call, compilation);
            Assert.That(actual.Value, Does.Contain("=>"));
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var parent = nodes.Single(n => ReferenceEquals(n.Producer, call));
            var leaf = nodes.Single(n => ReferenceEquals(n.Producer, body));
            var selected = parent.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, actual.Method), Is.True);
            Assert.That(GraphItems(GraphFacts(prepared, leaf), "EnclosingCaptures"), Has.Length.EqualTo(1));
            if (form != "literal") { Assert.That(leaf.CallProofs?.ObservationAbsence, Is.Not.Null); }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void LambdaCallProofOuterOverrideReleasesOnlyAncestorCapture(bool explicitOverride)
        {
            var value = Literal(1);
            var body = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "LeafObserve", new ValueExpression[] { value });
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), body);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Observe", explicitOverride
                ? new ValueExpression[] { closure, new PositionalParameterReferenceExpression("expression", Literal("fixed")) }
                : new ValueExpression[] { closure });
            var compilation = CallProofCompilation();
            var actual = EmitLambdaRoot(call, compilation);
            Assert.That(actual.Value, explicitOverride ? Is.EqualTo("fixed") : Does.Contain("=>"));
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var parent = nodes.Single(n => ReferenceEquals(n.Producer, call));
            var child = nodes.Single(n => ReferenceEquals(n.Producer, body));
            Assert.That(parent.CallProofs?.Selection, Is.Not.Null);
            Assert.That(GraphItems(GraphFacts(prepared, child), "EnclosingCaptures"), Has.Length.EqualTo(explicitOverride ? 0 : 1));
            Assert.That(GraphItems(GraphFacts(prepared, child), "OwnCaptures"), Has.Length.EqualTo(1));
            Assert.That(GraphItems(GraphFacts(prepared, nodes.Single(n => ReferenceEquals(n.Producer, value))), "EnclosingCaptures"), Has.Length.EqualTo(explicitOverride ? 1 : 2));
        }

        [Test]
        public void LambdaCallProofSharedClosureKeepsCapturedAndSafeEdgesSeparate()
        {
            var body = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Leaf", Array.Empty<ValueExpression>());
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), body);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Pair", new ValueExpression[] { closure, closure });
            var compilation = CallProofCompilation();
            Assert.That(EmitLambdaRoot(call, compilation).Value, Does.Contain("=>"));
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            Assert.That(nodes.Single(n => ReferenceEquals(n.Producer, call)).CallProofs?.Selection, Is.Not.Null);
            var leaves = nodes.Where(n => ReferenceEquals(n.Producer, body)).ToArray();
            Assert.That(leaves, Has.Length.EqualTo(2));
            Assert.That(leaves.All(n => n.CallProofs?.ObservationAbsence is not null), Is.True);
            Assert.That(leaves.Select(n => GraphItems(GraphFacts(prepared, n), "EnclosingCaptures").Length), Is.EqualTo(new[] { 1, 0 }));
        }

        [Test]
        public void LambdaCallProofVoidTargetRemainsOutsideBoundedConversion()
        {
            var body = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Leaf", Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "ActionOnly", new ValueExpression[] { new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), body) });
            var compilation = CallProofCompilation();
            Assert.That(EmitLambdaRoot(call, compilation).Value, Is.EqualTo("action"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LambdaCallProofOpaqueReturnDoesNotSupplyApplicability()
        {
            var callbacks = 0;
            var body = new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("\"opaque\""); });
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Observe", new ValueExpression[] { new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), body) });
            var compilation = CallProofCompilation();
            Assert.That(EmitLambdaRoot(call, compilation).Value, Does.Contain("opaque"));
            callbacks = 0;
            var node = CaptureCallProof(call, compilation);
            Assert.That(callbacks, Is.Zero);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LambdaCallProofInvalidReturnConversionRetains()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Wrong", new ValueExpression[] { new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), Literal("not-int")) });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            call.Write(writer);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText("class Run { string M() => " + writer.ToString(false) + "; }")).GetDiagnostics()
                .Any(d => d.Id == "CS0029" && d.Severity == DiagnosticSeverity.Error), Is.True);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase(LanguageVersion.CSharp2, false)]
        [TestCase(LanguageVersion.CSharp3, true)]
        public void LambdaCallProofRequiresLambdaLanguageVersion(LanguageVersion version, bool supported)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Safe", new ValueExpression[] { new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), Literal("leaf")) });
            var options = new CSharpParseOptions(version);
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText("class VersionAnchor {}", options));
            using var writer = new CodeWriter();
            call.Write(writer);
            var tree = CSharpSyntaxTree.ParseText("class Run { string M() { return " + writer.ToString(false) + "; } }", options);
            Assert.That(compilation.AddSyntaxTrees(tree).GetDiagnostics().Any(d => d.Severity == DiagnosticSeverity.Error), Is.EqualTo(!supported));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection is not null, Is.EqualTo(supported));
            Assert.That(node.CallProofs?.ObservationAbsence is not null, Is.EqualTo(supported));
        }

        [Test]
        public void LambdaCallProofExpressionTreeConversionRetains()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "ExpressionOnly", new ValueExpression[] { new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), Literal("leaf")) });
            var compilation = CallProofCompilation();
            Assert.That(EmitLambdaRoot(call, compilation).Value, Is.EqualTo("tree"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LambdaCallProofMultipleStatementBodyRemainsUnknown()
        {
            var leaf = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Leaf", Array.Empty<ValueExpression>());
            var body = new MethodBodyStatements(new MethodBodyStatement[] { new ExpressionStatement(leaf), new ExpressionStatement(new KeywordExpression("return", leaf)) });
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Observe", new ValueExpression[] { new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), body) });
            var compilation = CallProofCompilation();
            Assert.That(EmitLambdaRoot(call, compilation).Value, Does.Contain("=>"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LambdaCallProofNamedWrapperPreservesSuppliedAndValueEdges()
        {
            var closure = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), Literal("leaf"));
            var value = new Microsoft.TypeSpec.Generator.Snippets.ScopedApi<int>(closure);
            var supplied = new PositionalParameterReferenceExpression("callback", value);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Observe", new ValueExpression[] { supplied });
            var compilation = CallProofCompilation();
            Assert.That(EmitLambdaRoot(call, compilation).Value, Does.Contain("=>"));
            var selected = CaptureCallProof(call, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.Parameters[0].SuppliedExpression, Is.SameAs(supplied));
            Assert.That(selected.Arguments.Parameters[0].Value, Is.SameAs(value));
        }

        [Test]
        public void LambdaCallProofRetainedBinderMutationInvalidatesHeldParent()
        {
            var parameters = new List<CodeWriterDeclaration?>();
            var closure = new FuncExpression(parameters, Literal("leaf"));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Observe", new ValueExpression[] { closure });
            var held = CaptureCallProof(call, CallProofCompilation()).CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            parameters.Add(new CodeWriterDeclaration("p"));
            Assert.That(held!.IsCurrent, Is.False);
            parameters.Clear();
            Assert.That(held.IsCurrent, Is.False);
        }

        [Test]
        public void LambdaCallProofSelectedReturnValueAlsoSupportsOrdinaryArgument()
        {
            var leaf = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Leaf", Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { leaf });
            var compilation = CallProofCompilation();
            Assert.That(EmitLambdaRoot(call, compilation).Value, Does.Contain("Leaf()"));
            Assert.That(CaptureCallProof(call, compilation).CallProofs?.Selection, Is.Not.Null);
        }

        [Test]
        public void LambdaCallProofAwaitCannotBorrowDeclaredTaskReturnType()
        {
            var awaited = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "LeafTask", Array.Empty<ValueExpression>()) { CallAsAsync = true };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "OnlyTask", new ValueExpression[] { awaited });
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            call.Write(writer);
            var source = "class Run { async global::System.Threading.Tasks.Task<string> M() { return " + writer.ToString(false) + "; } }";
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(source)).GetDiagnostics().Any(d => d.Id == "CS1503" && d.Severity == DiagnosticSeverity.Error), Is.True);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void LambdaCallProofStandardWriterConsumptionAndDisposal()
        {
            var leaf = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Leaf", Array.Empty<ValueExpression>());
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedLambdaObservationProbe)), "Observe", new ValueExpression[] { new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), leaf) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var held = node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(held!.IsCurrent, Is.True);
            prepared.Dispose();
            Assert.That(held.IsCurrent, Is.False);
        }

        private static (string Value, IMethodSymbol Method) EmitLambdaRoot(InvokeMethodExpression call, CSharpCompilation compilation)
        {
            using var writer = new CodeWriter();
            call.Write(writer);
            var tree = CSharpSyntaxTree.ParseText("public class Run { public static string M() => " + writer.ToString(false) + "; }");
            compilation = compilation.WithAssemblyName("LambdaProof_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var root = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().First();
            var actual = (IMethodSymbol)compilation.GetSemanticModel(tree).GetSymbolInfo(root).Symbol!;
            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
            var assembly = Assembly.Load(stream.ToArray());
            return ((string)assembly.GetType("Run")!.GetMethod("M")!.Invoke(null, null)!, actual);
        }
    }
}
