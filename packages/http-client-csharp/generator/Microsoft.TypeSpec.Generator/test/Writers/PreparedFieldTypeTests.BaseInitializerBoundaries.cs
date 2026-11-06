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
using Microsoft.CodeAnalysis.Operations;
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
        // UNEXECUTED author draft. These extend only the bounded, single-physical-
        // owner metadata-base profile; unknown outside that profile is not completion.
        [Test]
        public void BaseInitializerBoundaryWrongConstructorIntentCannotReplaceActualNativeBase()
        {
            var value = Literal(1);
            var wrongSignature = new ConstructorSignature(typeof(PreparedBaseInitializerNonObservingProbe), null,
                MethodSignatureModifiers.Public, new[] { new ParameterProvider("value", $"value", typeof(int)) });
            var initializer = new ConstructorInitializer(true, wrongSignature, new ValueExpression[] { value });
            WithBaseInitializerBoundary(initializer, value, BoundaryKeepAlive(), evidence =>
            {
                Assert.That(initializer.TargetConstructorIntent, Is.SameAs(wrongSignature));
                Assert.That(wrongSignature.Type, Is.EqualTo((CSharpType)typeof(PreparedBaseInitializerNonObservingProbe)));
                var selected = evidence.Initializer.CallProofs!.Selection!;
                Assert.That(SymbolEqualityComparer.Default.Equals(selected.Contract.DeclarationSymbol, evidence.ActualTarget), Is.True);
                Assert.That(selected.Contract.Parameters, Has.Length.EqualTo(2),
                    "The actual observing base has the omitted CAA parameter; the wrong hint has only one parameter.");
                Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            });
        }

        [Test]
        public void BaseInitializerBoundaryRetainedArgumentListInvalidatesHeldSelectionAndGraphStickily()
        {
            var value = Literal(1);
            var arguments = new List<ValueExpression> { value };
            var initializer = new ConstructorInitializer(true, arguments);
            WithBaseInitializerBoundary(initializer, value, BoundaryKeepAlive(), evidence =>
            {
                Assert.That(initializer.Arguments, Is.SameAs(arguments));
                AssertBaseInitializerBoundarySticky(evidence,
                    () => arguments[0] = Literal(2), () => arguments[0] = value);
            });
        }

        [Test]
        public void BaseInitializerBoundaryDeepOwnedBodyListInvalidatesWithoutConstructorUpdate()
        {
            var value = Literal(1);
            var original = BoundaryKeepAlive();
            var retained = new List<MethodBodyStatement> { original };
            var inner = new MethodBodyStatements(retained);
            var body = new MethodBodyStatements(new MethodBodyStatement[] { inner });
            WithBaseInitializerBoundary(new ConstructorInitializer(true, new ValueExpression[] { value }), value, body, evidence =>
            {
                Assert.That(evidence.Constructor.BodyStatements, Is.SameAs(body));
                Assert.That(inner.Statements, Is.SameAs(retained));
                var revision = evidence.Constructor.DeclarationRevision;
                AssertBaseInitializerBoundarySticky(evidence,
                    () =>
                    {
                        // The replacement is still a known owned statement. No
                        // callback or ConstructorProvider.Update can explain staleness.
                        retained[0] = BoundaryKeepAlive();
                        Assert.That(evidence.Constructor.DeclarationRevision, Is.EqualTo(revision));
                    },
                    () => retained[0] = original);
                Assert.That(evidence.Constructor.DeclarationRevision, Is.EqualTo(revision));
            });
        }

        [Test]
        public void BaseInitializerBoundaryUnversionedSuppressionsReplacementInvalidatesHeldProofs()
        {
            var value = Literal(1);
            WithBaseInitializerBoundary(new ConstructorInitializer(true, new ValueExpression[] { value }), value, BoundaryKeepAlive(), evidence =>
            {
                var constructor = evidence.Constructor;
                var original = constructor.Suppressions;
                Assert.That(original, Is.TypeOf<List<SuppressionStatement>>());
                Assert.That(original, Is.Empty);
                var revision = constructor.DeclarationRevision;
                var replacement = new List<SuppressionStatement>
                {
                    new SuppressionStatement(null, Literal("CS0618"), "bounded replacement")
                };
                AssertBaseInitializerBoundarySticky(evidence,
                    () =>
                    {
                        constructor.Suppressions = replacement;
                        Assert.That(constructor.Suppressions, Is.SameAs(replacement));
                        Assert.That(constructor.DeclarationRevision, Is.EqualTo(revision));
                    },
                    () => constructor.Suppressions = original);
                Assert.That(constructor.DeclarationRevision, Is.EqualTo(revision));
                Assert.That(constructor.Suppressions, Is.SameAs(original));
            });
        }

        [Test]
        public void BaseInitializerBoundarySignatureMutationAndRestorationDoNotReviveHeldProofs()
        {
            var value = Literal(1);
            WithBaseInitializerBoundary(new ConstructorInitializer(true, new ValueExpression[] { value }), value, BoundaryKeepAlive(), evidence =>
            {
                var signature = evidence.Constructor.Signature;
                var revision = evidence.Constructor.DeclarationRevision;
                AssertBaseInitializerBoundarySticky(evidence,
                    () => signature.Update(modifiers: MethodSignatureModifiers.Internal),
                    () => signature.Update(modifiers: MethodSignatureModifiers.Public));
                Assert.That(evidence.Constructor.Signature, Is.SameAs(signature));
                Assert.That(evidence.Constructor.DeclarationRevision, Is.EqualTo(revision),
                    "This changes the retained signature, not the constructor provider revision.");
            });
        }

        [Test]
        public void BaseInitializerBoundarySecondPhysicalOwnerKeepsThisFamilyUnknownDespiteValidFirstOwnerRuntime()
        {
            var value = Literal(1);
            WithBaseInitializerBoundary(new ConstructorInitializer(true, new ValueExpression[] { value }), value, BoundaryKeepAlive(), evidence =>
            {
                Assert.That(evidence.Plan.SourceFiles, Has.Length.EqualTo(2));
                Assert.That(evidence.Initializer.CallProofs?.Selection, Is.Null);
                Assert.That(evidence.Initializer.CallProofs?.ObservationAbsence, Is.Null);
                var graph = evidence.Source.Observations!;
                var facts = graph.GetCurrent(evidence.Initializer)!;
                var inputFacts = graph.GetCurrent(evidence.Input)!;
                var leafFacts = graph.GetCurrent(evidence.Leaf)!;
                Assert.That(facts.DirectKnowledge, Is.EqualTo(PreparedSourceObservations.PreparedDirectCaptureKnowledge.Unavailable));
                Assert.That(facts.OwnCaptures, Is.Empty);
                Assert.That(inputFacts.EnclosingCaptures, Is.Empty);
                Assert.That(leafFacts.EnclosingCaptures, Is.Empty);
                Assert.That(facts.OwnBarriers.Any(b => b.Origin == evidence.Initializer.Id && b.RegionRoot == evidence.Input.Id &&
                    b.Kind == PreparedSourceObservations.PreparedCaptureBarrierKind.UnavailableCall), Is.True);
                Assert.That(leafFacts.EnclosingBarriers.Any(b => b.Origin == evidence.Initializer.Id &&
                    b.Kind == PreparedSourceObservations.PreparedCaptureBarrierKind.UnavailableCall), Is.True);
                // This is a bounded refusal only. We emitted the actual first
                // owner's file, not a fictional complete multi-owner program.
            }, secondPhysicalOwner: true);
        }

        [Test]
        public void BaseInitializerBoundaryDisposalInvalidatesHeldSelectionAndGraph()
        {
            var value = Literal(1);
            WithBaseInitializerBoundary(new ConstructorInitializer(true, new ValueExpression[] { value }), value, BoundaryKeepAlive(), evidence =>
            {
                var selection = evidence.Initializer.CallProofs!.Selection!;
                var graph = evidence.Source.Observations!;
                var held = new[] { evidence.Initializer, evidence.Input, evidence.Leaf }.Select(n => graph.GetCurrent(n)!).ToArray();
                Assert.That(selection.IsCurrent, Is.True);
                Assert.That(held.All(f => f.IsCurrent), Is.True);
                evidence.Plan.Dispose();
                Assert.That(selection.IsCurrent, Is.False);
                Assert.That(graph.IsCurrent, Is.False);
                Assert.That(held.All(f => !f.IsCurrent), Is.True);
                Assert.That(graph.GetCurrent(evidence.Initializer), Is.Null);
                Assert.That(graph.GetCurrent(evidence.Input), Is.Null);
                Assert.That(graph.GetCurrent(evidence.Leaf), Is.Null);
            });
        }

        private static MethodBodyStatement BoundaryKeepAlive() => new ExpressionStatement(
            new InvokeMethodExpression(Static(typeof(GC)), nameof(GC.KeepAlive), new ValueExpression[] { Null }));

        private static void AssertBaseInitializerBoundarySticky(BaseInitializerBoundaryEvidence evidence, Action mutate, Action restore)
        {
            var selected = evidence.Initializer.CallProofs!.Selection!;
            var graph = evidence.Source.Observations!;
            var nodes = new[] { evidence.Initializer, evidence.Input, evidence.Leaf };
            var held = nodes.Select(n => graph.GetCurrent(n)!).ToArray();
            Assert.That(selected.IsCurrent, Is.True);
            Assert.That(graph.IsCurrent, Is.True);
            Assert.That(held.All(f => f.IsCurrent), Is.True);
            try
            {
                mutate();
                Assert.That(selected.IsCurrent, Is.False, "A held selection must check the actual initializer frame dependency.");
                Assert.That(graph.IsCurrent, Is.False);
                Assert.That(held.All(f => !f.IsCurrent), Is.True);
                foreach (var node in nodes) { Assert.That(graph.GetCurrent(node), Is.Null); }
            }
            finally { restore(); }
            Assert.That(selected.IsCurrent, Is.False, "Observed invalidation is sticky after restoration.");
            Assert.That(graph.IsCurrent, Is.False);
            Assert.That(held.All(f => !f.IsCurrent), Is.True);
            foreach (var node in nodes) { Assert.That(graph.GetCurrent(node), Is.Null); }
            Assert.That(evidence.Initializer.CallProofs!.Selection, Is.Null);
        }

        private static void WithBaseInitializerBoundary(ConstructorInitializer initializer, ValueExpression value,
            MethodBodyStatement body, Action<BaseInitializerBoundaryEvidence> check, bool secondPhysicalOwner = false)
        {
            var previous = CodeModelGenerator.Instance;
            var services = new BaseInitializerWriterService(new GeneratorContext(previous.Configuration))
            { SourceInputModel = previous.SourceInputModel };
            CodeModelGenerator.Instance = services;
            try
            {
                var owner = new BaseInitializerProofOwner(typeof(PreparedBaseInitializerProbe), initializer, body);
                owner.EnsureBuilt();
                var constructor = owner.Constructors.Single();
                constructor.Suppressions = new List<SuppressionStatement>();
                FinalizeBaseInitializerOwner(owner);
                TypeProvider[] owners = new TypeProvider[] { owner };
                if (secondPhysicalOwner)
                {
                    var second = new BaseInitializerBoundaryOtherOwner();
                    second.EnsureBuilt();
                    FinalizeBaseInitializerOwner(second);
                    owners = new TypeProvider[] { owner, second };
                }
                var compilation = CallProofCompilation();
                using var prepared = PreparedFieldTypes.Create(owners, compilation, _ => true);
                Assert.That(services.WriteCallbacks, Is.Empty, "Zero GetWriter calls during the single preparation.");
                var source = prepared.SourceFiles.Single(f => ReferenceEquals(f.FileOwner, owner));
                var nodes = source.Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
                var occurrence = nodes.Single(n => ReferenceEquals(n.Producer, initializer));
                var input = occurrence.Children.Single(n => n.Id.EdgePath == occurrence.Id.EdgePath + "/argument[0]");
                var leaf = nodes.Single(n => ReferenceEquals(n.Producer, value));
                var beforeWrite = occurrence.CallProofs?.Selection;
                var writer = services.GetWriter(owner);
                writer.PreparedFieldTypes = prepared;
                var output = writer.Write();
                Assert.That(services.WriteCallbacks, Has.Count.EqualTo(1));
                Assert.That(services.WriteCallbacks[owner], Is.EqualTo(1), "Exactly one standard owner write.");
                Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
                Assert.That(output.SourceConsumption.Consumed, Does.Contain(input.Id));
                Assert.That(output.SourceConsumption.Consumed, Does.Contain(leaf.Id));

                // Establish the ACTUAL emitted header, C# binding, CAA operation,
                // emit and reflection runtime before asserting producer facts.
                var tree = CSharpSyntaxTree.ParseText(output.Content);
                var emitted = compilation.WithAssemblyName("BaseInitializerBoundary_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
                Assert.That(emitted.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var model = emitted.GetSemanticModel(tree);
                var syntax = tree.GetRoot().DescendantNodes().OfType<ConstructorDeclarationSyntax>().Single();
                Assert.That(syntax.Modifiers.Any(m => m.IsKind(SyntaxKind.PublicKeyword)), Is.True);
                Assert.That(syntax.ParameterList.Parameters, Is.Empty);
                var initializerSyntax = syntax.Initializer ?? throw new InvalidOperationException("The emitted constructor must have a base initializer.");
                Assert.That(initializerSyntax.IsKind(SyntaxKind.BaseConstructorInitializer), Is.True);
                var derived = (INamedTypeSymbol)model.GetDeclaredSymbol(syntax.Parent!)!;
                var nativeBase = emitted.GetTypeByMetadataName(typeof(PreparedBaseInitializerProbe).FullName!)!;
                Assert.That(nativeBase.DeclaringSyntaxReferences, Is.Empty);
                Assert.That(SymbolEqualityComparer.Default.Equals(derived.BaseType, nativeBase), Is.True);
                Assert.That(owner.Type.BaseType, Is.EqualTo((CSharpType)typeof(PreparedBaseInitializerProbe)));
                var operation = model.GetOperation(initializerSyntax) as IInvocationOperation;
                Assert.That(operation, Is.Not.Null);
                var actualTarget = operation!.TargetMethod;
                Assert.That(actualTarget.MethodKind, Is.EqualTo(MethodKind.Constructor));
                Assert.That(nativeBase.InstanceConstructors, Has.Length.EqualTo(1));
                Assert.That(SymbolEqualityComparer.Default.Equals(actualTarget, nativeBase.InstanceConstructors.Single()), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(initializerSyntax).Symbol, actualTarget), Is.True);
                var argument = operation.Arguments.Single(a => a.Parameter!.Ordinal == 0);
                Assert.That(argument.IsImplicit, Is.False);
                Assert.That(argument.Value.ConstantValue.Value, Is.EqualTo(1));
                var capture = operation.Arguments.Single(a => a.Parameter!.Ordinal == 1);
                Assert.That(capture.IsImplicit, Is.True);
                Assert.That(capture.ArgumentKind, Is.EqualTo(ArgumentKind.DefaultValue));
                Assert.That(capture.Value.ConstantValue.Value, Is.EqualTo("1"));
                var attribute = actualTarget.Parameters[1].GetAttributes().Single(a =>
                    a.AttributeClass!.ToDisplayString() == "System.Runtime.CompilerServices.CallerArgumentExpressionAttribute");
                Assert.That(attribute.ConstructorArguments.Single().Value, Is.EqualTo("value"));
                using var stream = new MemoryStream();
                var emit = emitted.Emit(stream);
                Assert.That(emit.Success, Is.True, string.Join("\n", emit.Diagnostics));
                var runtimeType = Assembly.Load(stream.ToArray()).GetType("Sample.BaseInitializerProofOwner")!;
                Assert.That(runtimeType.BaseType, Is.EqualTo(typeof(PreparedBaseInitializerProbe)));
                var instance = Activator.CreateInstance(runtimeType)!;
                var runtimeValue = runtimeType.GetProperty("Value")!.GetValue(instance);
                var runtimeCapture = runtimeType.GetProperty("CapturedText")!.GetValue(instance);
                Assert.That(runtimeValue, Is.EqualTo(1));
                Assert.That(runtimeCapture, Is.EqualTo("1"));

                Assert.That(constructor.Signature.ReturnType, Is.Null);
                Assert.That(constructor.Signature.Parameters, Is.Empty);
                Assert.That(occurrence.CallProofs?.Selection, Is.SameAs(beforeWrite), "Writing must not create selection evidence.");
                var evidence = new BaseInitializerBoundaryEvidence(prepared, source, occurrence, input, leaf, actualTarget, constructor);
                if (!secondPhysicalOwner)
                {
                    var selected = occurrence.CallProofs?.Selection;
                    Assert.That(selected, Is.Not.Null, "Retain the original owned native-base regression anchor.");
                    Assert.That(selected!.IsCurrent, Is.True);
                    Assert.That(selected.Occurrence, Is.EqualTo(occurrence.Id));
                    Assert.That(SymbolEqualityComparer.Default.Equals(selected.Contract.DeclarationSymbol, actualTarget), Is.True);
                    Assert.That(selected.Arguments.EvaluationOrder.Select(a => a.Formal.Ordinal), Is.EqualTo(new[] { 0 }));
                    Assert.That(selected.Arguments.EvaluationOrder.Single().SuppliedExpression, Is.SameAs(input.Producer));
                    Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
                    var graph = source.Observations!;
                    var facts = graph.GetCurrent(occurrence)!;
                    Assert.That(facts.DirectKnowledge, Is.EqualTo(PreparedSourceObservations.PreparedDirectCaptureKnowledge.Known));
                    Assert.That(facts.OwnCaptures, Has.Length.EqualTo(1));
                    var own = facts.OwnCaptures.Single();
                    Assert.That(own.Observer, Is.EqualTo(occurrence.Id));
                    Assert.That(own.InputParameterOrdinal, Is.EqualTo(0));
                    Assert.That(own.CaptureParameterOrdinal, Is.EqualTo(1));
                    Assert.That(own.SuppliedArgumentRoot, Is.EqualTo(input.Id));
                    Assert.That(graph.GetCurrent(input)!.EnclosingCaptures, Does.Contain(own));
                    Assert.That(graph.GetCurrent(leaf)!.EnclosingCaptures, Does.Contain(own));
                    Assert.That(graph.GetCurrent(input)!.EnclosingBarriers, Is.Empty);
                }
                check(evidence);
            }
            finally { CodeModelGenerator.Instance = previous; }
        }

        private sealed record BaseInitializerBoundaryEvidence(PreparedFieldTypes Plan, PreparedSourceFile Source,
            PreparedSourceOccurrence Initializer, PreparedSourceOccurrence Input, PreparedSourceOccurrence Leaf,
            IMethodSymbol ActualTarget, ConstructorProvider Constructor);

        private sealed class BaseInitializerBoundaryOtherOwner : TypeProvider
        {
            protected override string BuildName() => "BaseInitializerBoundaryOtherOwner";
            protected override string BuildNamespace() => "Independent";
            protected override string BuildRelativeFilePath() => "BaseInitializerBoundaryOtherOwner.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
        }
    }
}
