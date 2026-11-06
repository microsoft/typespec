// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
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
        [Test]
        public void ExplicitGenericCallProofTypeArgumentListMutationInvalidatesStickily()
        {
            CSharpType original = typeof(Uri);
            var types = new List<CSharpType> { original };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGenericCallProbe)), "Observe", new ValueExpression[] { Literal(1) }) { TypeArguments = types };
            var node = CaptureCallProof(call, CallProofCompilation());
            var selected = node.CallProofs?.Selection;
            Assert.That(selected?.IsCurrent, Is.True);
            types[0] = typeof(string);
            Assert.That(selected!.IsCurrent, Is.False);
            types[0] = original;
            Assert.That(selected.IsCurrent, Is.False);
        }

        [Test]
        public void ExplicitGenericCallProofSubstitutedChildReturnFeedsParentWithoutClearingCapture()
        {
            var child = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGenericCallProbe)), "Identity", new ValueExpression[] { Literal("text") }) { TypeArguments = new CSharpType[] { typeof(string) } };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { child });
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, Array.Empty<ParameterProvider>()), call, Array.Empty<object>());
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Does.Contain("Identity<string>(\"text\")"));
            var childNode = GeneratedReviewCallOccurrence(prepared, child);
            Assert.That(childNode.CallProofs?.Selection, Is.Not.Null);
            Assert.That(childNode.CallProofs?.ObservationAbsence, Is.Not.Null);
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(result.Node.CallProofs!.Selection!.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ExplicitGenericCallProofPartialSourceObserverCorrespondence(bool implementationAttribute)
        {
            var attribute = "[global::System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] ";
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(
                "namespace SourceCalls { public partial class Probe { public static partial string Observe<T>(int value, " +
                (implementationAttribute ? "" : attribute) + "string expression = \"\"); } public partial class Probe { public static partial string Observe<T>(int value, " +
                (implementationAttribute ? attribute : "") + "string expression) => expression; } }"));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Observe", new ValueExpression[] { Literal(1) }) { TypeArguments = new CSharpType[] { typeof(Uri) } };
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo(implementationAttribute ? "" : "1"));
            Assert.That(actual.Method.OriginalDefinition.PartialImplementationPart, Is.Not.Null);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection is not null, Is.EqualTo(!implementationAttribute));
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            if (!implementationAttribute)
            {
                Assert.That(node.CallProofs!.Selection!.Contract.Parts, Has.Length.EqualTo(2));
                Assert.That(node.CallProofs.Selection.Contract.SourceDeclarations, Has.Length.EqualTo(2));
            }
        }

        [Test]
        public void ExplicitGenericCallProofPartialCounterpartsRetainSubstitutedFormalAndReturn()
        {
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(
                "namespace SourceCalls { public partial class Probe { public static partial T Echo<T>(T value); } public partial class Probe { public static partial T Echo<T>(T value) => value; } }"));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), "Echo", new ValueExpression[] { Literal("text") }) { TypeArguments = new CSharpType[] { typeof(string) } };
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo("text"));
            var node = CaptureCallProof(call, compilation);
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Contract.Parts, Has.Length.EqualTo(2));
            Assert.That(selected.Contract.SourceDeclarations, Has.Length.EqualTo(2));
            Assert.That(selected.Contract.Parts.All(p => p.Parameters.Single().Type.SpecialType == SpecialType.System_String && p.ReturnType.SpecialType == SpecialType.System_String), Is.True);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void ExplicitGenericCallProofDoesNotBorrowNongenericDelegateInvoke()
        {
            var parameter = new ParameterProvider("p", $"delegate", typeof(PreparedObservedDelegate));
            var call = new InvokeMethodExpression(parameter.AsVariable(), "Invoke", new ValueExpression[] { Literal(1) }) { TypeArguments = new CSharpType[] { typeof(Uri) } };
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, call);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Not.Empty);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void ExplicitGenericCallProofDoesNotBorrowGeneratedScalarMethod()
        {
            var target = new GeneratedCallableOwner("observe");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Observe", new ValueExpression[] { Literal(1) });
            var caller = new OccurrenceOwner(call, returnType: typeof(string));
            caller.EnsureBuilt();
            _ = target.BaseType;
            _ = target.DeclaringTypeProvider;
            _ = target.CustomCodeView;
            _ = target.WhereClause;
            FinalizeGeneratedCallFixture(target);
            FinalizeGeneratedCallFixture(caller);
            var compilation = CallProofCompilation();
            using var before = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
            var beforeNode = GeneratedReviewCallOccurrence(before, call);
            Assert.That(beforeNode.CallProofs?.Selection, Is.Not.Null, beforeNode.CallProofs?.UnavailableReason);
            call.TypeArguments = new CSharpType[] { typeof(Uri) };
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
            var node = GeneratedReviewCallOccurrence(prepared, call);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            var outputs = new TypeProvider[] { target, caller }.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
            Assert.That(outputs.All(o => o.SourceConsumption!.WasCurrentAtEndOfWrite), Is.True);
            Assert.That(compilation.AddSyntaxTrees(outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content))).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Not.Empty);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ExplicitGenericCallProofUsesActualConstructedMetadataMethod(bool explicitOverride)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGenericCallProbe)), "Observe",
                explicitOverride ? new ValueExpression[] { Literal(1), Literal("fixed") } : new ValueExpression[] { Literal(1) }) { TypeArguments = new CSharpType[] { typeof(Uri) } };
            var compilation = CallProofCompilation();
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo(explicitOverride ? "fixed" : "1"));
            var node = CaptureCallProof(call, compilation);
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, actual.Method), Is.True);
            Assert.That(actual.Method.TypeArguments.Single().Name, Is.EqualTo("Uri"));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(explicitOverride ? Array.Empty<int>() : new[] { 0 }));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ExplicitGenericCallProofUsesActualConstructedSourceMethod(bool safe)
        {
            var name = safe ? "Safe" : "Observe";
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText("namespace SourceCalls { public class Probe { public static string Observe<T>(int value, [global::System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression = \"\") => expression; public static string Safe<T>(int value) => \"safe\"; } }"));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), name, new ValueExpression[] { Literal(1) }) { TypeArguments = new CSharpType[] { typeof(Uri) } };
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo(safe ? "safe" : "1"));
            var node = CaptureCallProof(call, compilation);
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            var symbol = (IMethodSymbol)selected!.Contract.DeclarationSymbol!;
            Assert.That(symbol.TypeArguments.Single().Name, Is.EqualTo("Uri"));
            Assert.That(symbol.DeclaringSyntaxReferences.Single().SyntaxTree, Is.SameAs(actual.Method.DeclaringSyntaxReferences.Single().SyntaxTree));
            Assert.That(symbol.DeclaringSyntaxReferences.Single().Span, Is.EqualTo(actual.Method.DeclaringSyntaxReferences.Single().Span));
            Assert.That(node.CallProofs?.ObservationAbsence is not null, Is.EqualTo(safe));
        }

        [Test]
        public void ExplicitGenericCallProofSubstitutesActualFormalAndReturnType()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGenericCallProbe)), "Identity", new ValueExpression[] { Literal("text") }) { TypeArguments = new CSharpType[] { typeof(string) } };
            var compilation = CallProofCompilation();
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo("text"));
            var node = CaptureCallProof(call, compilation);
            var selected = node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, actual.Method), Is.True);
            Assert.That(actual.Method.Parameters.Single().Type.SpecialType, Is.EqualTo(SpecialType.System_String));
            Assert.That(actual.Method.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_String));
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void ExplicitGenericCallProofUsesExplicitArityNotNongenericObserverCompetitor()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGenericCallProbe)), "Overloaded", new ValueExpression[] { Literal(1) }) { TypeArguments = new CSharpType[] { typeof(Uri) } };
            var compilation = CallProofCompilation();
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo("generic"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }

        [Test]
        public void ExplicitGenericCallProofConstraintFamilyRemainsUnavailable()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGenericCallProbe)), "Constrained", new ValueExpression[] { Literal(1) }) { TypeArguments = new CSharpType[] { typeof(string) } };
            var compilation = CallProofCompilation();
            Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo("constraint"));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ExplicitGenericCallProofInvalidStaticTypeOrArityRetains(bool arity)
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGenericCallProbe)), "Observe", new ValueExpression[] { Literal(1) })
            { TypeArguments = arity ? new CSharpType[] { typeof(Uri), typeof(string) } : new CSharpType[] { typeof(Math) } };
            var compilation = CallProofCompilation();
            var node = CaptureCallProof(call, compilation);
            using var writer = new CodeWriter();
            call.Write(writer);
            var tree = CSharpSyntaxTree.ParseText("public class Run { public static string M() => " + writer.ToString(false) + "; }");
            Assert.That(compilation.AddSyntaxTrees(tree).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Not.Empty);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void ExplicitGenericCallProofEmptyTypeArgumentsFollowActualNongenericWriter()
        {
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedGenericCallProbe)), "Safe", new ValueExpression[] { Literal(1) }) { TypeArguments = Array.Empty<CSharpType>() };
            var compilation = CallProofCompilation();
            var actual = EmitCallProof(call, compilation);
            Assert.That(actual.Value, Is.EqualTo("safe"));
            Assert.That(actual.Method.Arity, Is.Zero);
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Not.Null);
        }
    }
}
