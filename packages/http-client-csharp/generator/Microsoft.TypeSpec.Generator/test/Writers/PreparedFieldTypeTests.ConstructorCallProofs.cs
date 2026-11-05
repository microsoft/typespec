// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void ConstructorCallProofSelectsUniqueMetadataConstructor(bool explicitCapture)
        {
            var creation = new NewInstanceExpression(typeof(PreparedConstructorProbe), explicitCapture ?
                new ValueExpression[] { Literal(1), Literal("fixed") } : new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            var observed = EmitConstructorCallProof(creation, compilation);
            Assert.That(observed.Value, Is.EqualTo(explicitCapture ? "fixed|1" : "1|1"));
            var node = CaptureConstructorCallProof(creation, compilation);
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, observed.Symbol), Is.True);
            Assert.That(selected.Occurrence, Is.EqualTo(node.Id));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(explicitCapture ? Array.Empty<int>() : new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
            Assert.That(node.CallProofs!.ObservationAbsence, Is.Null);
        }

        [TestCase("value", "fixed")]
        [TestCase("null", "")]
        [TestCase("default", "")]
        public void ConstructorCallProofNamedOverridesPreserveEvaluationAndCallerLine(string kind, string expected)
        {
            var creation = new NewInstanceExpression(typeof(PreparedConstructorProbe), new ValueExpression[]
            {
                new PositionalParameterReferenceExpression("expression", kind switch
                {
                    "default" => Default,
                    "null" => Null,
                    _ => Literal("fixed")
                }),
                new PositionalParameterReferenceExpression("value", Literal(1))
            });
            var compilation = CallProofCompilation();
            Assert.That(EmitConstructorCallProof(creation, compilation).Value, Is.EqualTo(expected + "|1"));
            var selected = CaptureConstructorCallProof(creation, compilation).CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.EvaluationOrder.Select(a => a.Formal.Ordinal), Is.EqualTo(new[] { 1, 0 }));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ConstructorCallProofNonobservingOverloadsNeedNoWinner(bool argument)
        {
            var creation = new NewInstanceExpression(typeof(Exception), argument ? new ValueExpression[] { Literal("message") } : Array.Empty<ValueExpression>());
            var compilation = CallProofCompilation();
            using var writer = new CodeWriter();
            creation.Write(writer);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText("class Run { object M() => " + writer.ToString(false) + "; }")).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var node = CaptureConstructorCallProof(creation, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void ConstructorCallProofDoesNotConstructAbstractType()
        {
            var creation = new NewInstanceExpression(typeof(PreparedAbstractConstructorProbe), new ValueExpression[] { Literal(1) });
            var node = CaptureConstructorCallProof(creation, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void ConstructorCallProofUnknownTargetCannotBorrowDeclarationIntent()
        {
            var creation = new NewInstanceExpression(null, new ValueExpression[] { Literal(1) });
            var node = CaptureConstructorCallProof(creation, CallProofCompilation());
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void ConstructorCallProofDoesNotRunOpaqueArgumentForApplicability()
        {
            var callbacks = 0;
            var creation = new NewInstanceExpression(typeof(PreparedConstructorProbe), new ValueExpression[]
            {
                new SourceCallbackExpression(w => { callbacks++; w.AppendRaw("1"); })
            });
            var node = CaptureConstructorCallProof(creation, CallProofCompilation());
            Assert.That(callbacks, Is.Zero);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            using var writer = new CodeWriter();
            creation.Write(writer);
            Assert.That(callbacks, Is.EqualTo(1));
        }

        [Test]
        public void ConstructorCallProofRetainedArgumentMutationInvalidatesHeldCertificate()
        {
            var values = new List<ValueExpression> { Literal(1) };
            var creation = new NewInstanceExpression(typeof(PreparedConstructorProbe), values);
            var node = CaptureConstructorCallProof(creation, CallProofCompilation());
            var held = node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            var original = values[0];
            values[0] = Literal(2);
            Assert.That(held!.IsCurrent, Is.False);
            values[0] = original;
            Assert.That(held.IsCurrent, Is.False);
        }

        [Test]
        public void ConstructorCallProofIsConsumedInStandardWriterLifetime()
        {
            var creation = new NewInstanceExpression(typeof(PreparedConstructorProbe), new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(creation, returnType: typeof(PreparedConstructorProbe));
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
            var held = node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(held!.IsCurrent, Is.True);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            prepared.Dispose();
            Assert.That(held.IsCurrent, Is.False);
        }

        private static PreparedSourceOccurrence CaptureConstructorCallProof(NewInstanceExpression creation, CSharpCompilation compilation)
        {
            var owner = new OccurrenceOwner(creation, returnType: creation.Type ?? typeof(object));
            owner.EnsureBuilt();
            var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            return prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, creation));
        }

        private static (string Value, IMethodSymbol Symbol) EmitConstructorCallProof(NewInstanceExpression creation, CSharpCompilation compilation)
        {
            using var writer = new CodeWriter();
            creation.Write(writer);
            var tree = CSharpSyntaxTree.ParseText("public class Run { public static object M() => " + writer.ToString(false) + "; }");
            var emitted = compilation.WithAssemblyName("ConstructorProof_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            Assert.That(emitted.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var syntax = tree.GetRoot().DescendantNodes().OfType<ObjectCreationExpressionSyntax>().Single();
            var symbol = (IMethodSymbol)emitted.GetSemanticModel(tree).GetSymbolInfo(syntax).Symbol!;
            using var stream = new MemoryStream();
            var result = emitted.Emit(stream);
            Assert.That(result.Success, Is.True, string.Join("\n", result.Diagnostics));
            var instance = Assembly.Load(stream.ToArray()).GetType("Run")!.GetMethod("M")!.Invoke(null, null)!;
            return ((string)instance.GetType().GetProperty("Observation")!.GetValue(instance)!, symbol);
        }
    }
}
