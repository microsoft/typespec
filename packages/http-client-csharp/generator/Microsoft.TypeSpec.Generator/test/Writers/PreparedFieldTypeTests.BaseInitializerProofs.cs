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
        // UNEXECUTED revised producer regressions. Actual compiler/emit/runtime
        // evidence precedes eligibility assertions. Opaque bodies are NOT positives,
        // even when this particular callback happens to emit the same harmless body.
        [TestCase("omitted", false)]
        [TestCase("named-override", false)]
        [TestCase("nonobserving", false)]
        [TestCase("omitted", true)]
        [TestCase("named-override", true)]
        [TestCase("nonobserving", true)]
        public void BaseInitializerProofUsesActualFinalizedMetadataBaseConstructor(string mode, bool opaqueBody)
        {
            var previous = CodeModelGenerator.Instance;
            var services = new BaseInitializerWriterService(new GeneratorContext(previous.Configuration))
            { SourceInputModel = previous.SourceInputModel };
            CodeModelGenerator.Instance = services;
            try
            {
                var observing = mode != "nonobserving";
                var explicitOverride = mode == "named-override";
                var value = Literal(1);
                ValueExpression[] arguments = explicitOverride
                    ? new ValueExpression[]
                    {
                        new PositionalParameterReferenceExpression("expression", Literal("fixed")),
                        new PositionalParameterReferenceExpression("value", value)
                    }
                    : new ValueExpression[] { value };
                // No TargetConstructorIntent or OriginalTargetSymbol: the finalized
                // emitted owner/base relationship must supply target authority.
                var initializer = new ConstructorInitializer(true, arguments);
                var metadataBase = observing ? typeof(PreparedBaseInitializerProbe) : typeof(PreparedBaseInitializerNonObservingProbe);
                var callbacks = 0;
                // Both branches emit GC.KeepAlive(null). Only the owned branch can
                // be inspected without invoking arbitrary source-writing code.
                MethodBodyStatement body = opaqueBody
                    ? new ExpressionStatement(new SourceCallbackExpression(writer =>
                    {
                        callbacks++;
                        writer.AppendRaw("global::System.GC.KeepAlive(null)");
                    }))
                    : new ExpressionStatement(new InvokeMethodExpression(Static(typeof(GC)), nameof(GC.KeepAlive),
                        new ValueExpression[] { Null }));
                var owner = new BaseInitializerProofOwner(metadataBase, initializer, body);
                owner.EnsureBuilt();
                FinalizeBaseInitializerOwner(owner);
                var canonicalType = owner.Type;
                Assert.That(canonicalType.BaseType, Is.EqualTo((CSharpType)metadataBase),
                    "The actual writer header uses owner.Type.BaseType, not a fresh owner.BaseType getter.");
                var compilation = CallProofCompilation();
                using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
                Assert.That(callbacks, Is.Zero, "Preparation must not execute the constructor-body callback.");
                Assert.That(services.WriteCallbacks, Is.Empty, "Preparation must not invoke the standard writer factory.");
                var source = prepared.SourceFiles.Single();
                var nodes = source.Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
                var occurrence = nodes.Single(n => ReferenceEquals(n.Producer, initializer));
                var inputRoot = occurrence.Children.Single(n => n.Id.EdgePath == occurrence.Id.EdgePath +
                    (explicitOverride ? "/argument[1]" : "/argument[0]"));
                var leaf = nodes.Single(n => ReferenceEquals(n.Producer, value));
                var selectedBeforeWrite = occurrence.CallProofs?.Selection;

                // Exactly one preparation and one standard provider write per case.
                // The factory callback is observable even for the owned positives;
                // it is not an opaque expression inserted into the source graph.
                var standardWriter = services.GetWriter(owner);
                standardWriter.PreparedFieldTypes = prepared;
                var output = standardWriter.Write();
                Assert.That(services.WriteCallbacks, Has.Count.EqualTo(1));
                Assert.That(services.WriteCallbacks[owner], Is.EqualTo(1));
                Assert.That(callbacks, Is.EqualTo(opaqueBody ? 1 : 0));
                Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
                // The initializer itself is structural, not an emission boundary.
                Assert.That(output.SourceConsumption.Consumed, Does.Contain(inputRoot.Id));
                Assert.That(output.SourceConsumption.Consumed, Does.Contain(leaf.Id));

                var tree = CSharpSyntaxTree.ParseText(output.Content);
                var emitted = compilation.WithAssemblyName("BaseInitializerProof_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
                Assert.That(emitted.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var model = emitted.GetSemanticModel(tree);
                var constructorSyntax = tree.GetRoot().DescendantNodes().OfType<ConstructorDeclarationSyntax>().Single();
                var initializerSyntax = constructorSyntax.Initializer!;
                Assert.That(initializerSyntax.IsKind(SyntaxKind.BaseConstructorInitializer), Is.True);
                var derived = (INamedTypeSymbol)model.GetDeclaredSymbol(constructorSyntax.Parent!)!;
                var actualBase = emitted.GetTypeByMetadataName(metadataBase.FullName!)!;
                Assert.That(actualBase, Is.Not.Null);
                Assert.That(actualBase.DeclaringSyntaxReferences, Is.Empty, "The base must be metadata, not a source stand-in.");
                Assert.That(SymbolEqualityComparer.Default.Equals(derived.BaseType, actualBase), Is.True);
                var operation = model.GetOperation(initializerSyntax) as IInvocationOperation;
                Assert.That(operation, Is.Not.Null, "Inspect the actual Roslyn constructor-initializer operation.");
                var actualTarget = operation!.TargetMethod;
                Assert.That(actualTarget.MethodKind, Is.EqualTo(MethodKind.Constructor));
                Assert.That(SymbolEqualityComparer.Default.Equals(actualTarget.ContainingType, actualBase), Is.True);
                Assert.That(actualBase.InstanceConstructors, Has.Length.EqualTo(1));
                Assert.That(SymbolEqualityComparer.Default.Equals(actualTarget, actualBase.InstanceConstructors.Single()), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(initializerSyntax).Symbol, actualTarget), Is.True);
                Assert.That(operation.Instance, Is.InstanceOf<IInstanceReferenceOperation>());
                Assert.That(((IInstanceReferenceOperation)operation.Instance!).ReferenceKind,
                    Is.EqualTo(InstanceReferenceKind.ContainingTypeInstance));
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetDeclaredSymbol(constructorSyntax)!.ContainingType, derived), Is.True);
                Assert.That(operation.Arguments.Single(a => a.Parameter!.Ordinal == 0).Value.ConstantValue.Value, Is.EqualTo(1));
                var actualImplicitCaptures = operation.Arguments.Where(a => a.IsImplicit && a.Parameter!.Ordinal == 1).ToArray();
                Assert.That(actualImplicitCaptures, Has.Length.EqualTo(observing && !explicitOverride ? 1 : 0));
                if (observing)
                {
                    var attribute = actualTarget.Parameters[1].GetAttributes().Single(a =>
                        a.AttributeClass!.ToDisplayString() == "System.Runtime.CompilerServices.CallerArgumentExpressionAttribute");
                    Assert.That(attribute.ConstructorArguments.Single().Value, Is.EqualTo("value"));
                    var captureArgument = operation.Arguments.Single(a => a.Parameter!.Ordinal == 1);
                    Assert.That(captureArgument.Value.ConstantValue.Value, Is.EqualTo(explicitOverride ? "fixed" : "1"));
                    Assert.That(captureArgument.ArgumentKind, Is.EqualTo(explicitOverride ? ArgumentKind.Explicit : ArgumentKind.DefaultValue));
                }
                Assert.That(operation.Arguments.Where(a => !a.IsImplicit).Select(a => a.Parameter!.Ordinal),
                    Is.EqualTo(explicitOverride ? new[] { 1, 0 } : new[] { 0 }));

                using var stream = new MemoryStream();
                var result = emitted.Emit(stream);
                Assert.That(result.Success, Is.True, string.Join("\n", result.Diagnostics));
                var runtimeDerived = Assembly.Load(stream.ToArray()).GetType("Sample.BaseInitializerProofOwner")!;
                Assert.That(runtimeDerived.BaseType, Is.EqualTo(metadataBase));
                var instance = Activator.CreateInstance(runtimeDerived)!;
                Assert.That(runtimeDerived.GetProperty("Value")!.GetValue(instance), Is.EqualTo(1));
                Assert.That(runtimeDerived.GetProperty("CapturedText")!.GetValue(instance),
                    Is.EqualTo(observing ? explicitOverride ? "fixed" : "1" : "safe"));

                // Producer facts only, never binding/edit permission. Actual C# can
                // bind correctly while preparation must refuse an opaque file closure.
                var selected = occurrence.CallProofs?.Selection;
                var facts = source.Observations!.GetCurrent(occurrence)!;
                var inputFacts = source.Observations.GetCurrent(inputRoot)!;
                var leafFacts = source.Observations.GetCurrent(leaf)!;
                Assert.That(selected, Is.SameAs(selectedBeforeWrite), "Writing must not manufacture selection evidence.");
                if (opaqueBody)
                {
                    Assert.Multiple(() =>
                    {
                        Assert.That(selected, Is.Null, "An arbitrary body callback can escape its body and compete with the header/base name.");
                        Assert.That(facts.DirectKnowledge, Is.EqualTo(PreparedSourceObservations.PreparedDirectCaptureKnowledge.Unavailable));
                        Assert.That(facts.OwnCaptures, Is.Empty);
                        Assert.That(inputFacts.EnclosingCaptures, Is.Empty);
                        Assert.That(leafFacts.EnclosingCaptures, Is.Empty);
                        Assert.That(facts.OwnBarriers.Any(b => b.Origin == occurrence.Id && b.RegionRoot == inputRoot.Id &&
                            b.Kind == PreparedSourceObservations.PreparedCaptureBarrierKind.UnavailableCall), Is.True);
                        Assert.That(inputFacts.EnclosingBarriers.Any(b => b.Origin == occurrence.Id &&
                            b.Kind == PreparedSourceObservations.PreparedCaptureBarrierKind.UnavailableCall), Is.True);
                        Assert.That(leafFacts.EnclosingBarriers.Any(b => b.Origin == occurrence.Id &&
                            b.Kind == PreparedSourceObservations.PreparedCaptureBarrierKind.UnavailableCall), Is.True);
                    });
                    return;
                }

                // On S the initializer is not a ValueExpression: CallProofs is null
                // and knowledge is Unavailable. These owned cases retain that anchor.
                Assert.Multiple(() =>
                {
                    Assert.That(selected, Is.Not.Null, "Actual native base-constructor selection needs an initializer producer with owned closure.");
                    Assert.That(facts.DirectKnowledge, Is.EqualTo(PreparedSourceObservations.PreparedDirectCaptureKnowledge.Known));
                    Assert.That(facts.OwnCaptures, Has.Length.EqualTo(observing && !explicitOverride ? 1 : 0));
                    Assert.That(inputFacts.EnclosingCaptures, Has.Length.EqualTo(observing && !explicitOverride ? 1 : 0));
                    Assert.That(leafFacts.EnclosingCaptures, Has.Length.EqualTo(observing && !explicitOverride ? 1 : 0));
                    Assert.That(inputFacts.EnclosingBarriers, Is.Empty, "This actual bounded selection is not an unavailable initializer call.");
                    if (selected is not null)
                    {
                        Assert.That(selected.IsCurrent, Is.True);
                        Assert.That(selected.Occurrence, Is.EqualTo(occurrence.Id));
                        Assert.That(SymbolEqualityComparer.Default.Equals(selected.Contract.DeclarationSymbol, actualTarget), Is.True);
                        Assert.That(selected.Arguments.EvaluationOrder.Select(a => a.Formal.Ordinal),
                            Is.EqualTo(explicitOverride ? new[] { 1, 0 } : new[] { 0 }));
                        Assert.That(selected.Arguments.ImplicitCallerExpressionInputs,
                            Is.EqualTo(observing && !explicitOverride ? new[] { 0 } : Array.Empty<int>()));
                    }
                    if (observing && !explicitOverride && facts.OwnCaptures.Length == 1)
                    {
                        var capture = facts.OwnCaptures.Single();
                        Assert.That(capture.Observer, Is.EqualTo(occurrence.Id));
                        Assert.That(capture.CaptureParameterOrdinal, Is.EqualTo(1));
                        Assert.That(capture.InputParameterOrdinal, Is.EqualTo(0));
                        Assert.That(capture.SuppliedArgumentRoot, Is.EqualTo(inputRoot.Id));
                        Assert.That(inputFacts.EnclosingCaptures, Does.Contain(capture));
                    }
                });
            }
            finally { CodeModelGenerator.Instance = previous; }
        }

        private static void FinalizeBaseInitializerOwner(TypeProvider owner)
        {
            // Finalize the existing header inputs, retaining the counting service.
            // TypeProviderWriter emits this canonical Type's BaseType; no new cache API.
            _ = owner.Type;
            _ = owner.DeclaringTypeProvider;
            _ = owner.CustomCodeView;
            _ = owner.WhereClause;
            _ = owner.XmlDocs;
            _ = owner.GetAttributesForWrite();
            _ = owner.DisabledFileWarnings;
            owner.Update(relativeFilePath: owner.RelativeFilePath);
        }

        private sealed class BaseInitializerWriterService(GeneratorContext context) : CodeModelGenerator(context)
        {
            // Deliberately retain the default TypeFactory getter/implementation.
            internal Dictionary<TypeProvider, int> WriteCallbacks { get; } = new();
            public override TypeProviderWriter GetWriter(TypeProvider provider)
            {
                WriteCallbacks.TryGetValue(provider, out var count);
                WriteCallbacks[provider] = count + 1;
                return base.GetWriter(provider);
            }
        }

        private sealed class BaseInitializerProofOwner : TypeProvider
        {
            private readonly CSharpType _metadataBase;
            private readonly ConstructorInitializer _initializer;
            private readonly MethodBodyStatement _body;

            internal BaseInitializerProofOwner(CSharpType metadataBase, ConstructorInitializer initializer, MethodBodyStatement body)
            { _metadataBase = metadataBase; _initializer = initializer; _body = body; }

            protected override string BuildName() => "BaseInitializerProofOwner";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "BaseInitializerProofOwner.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected override CSharpType? BuildBaseType() => _metadataBase;
            protected internal override ConstructorProvider[] BuildConstructors() => new[]
            {
                new ConstructorProvider(new ConstructorSignature(Type, null, MethodSignatureModifiers.Public,
                    Array.Empty<ParameterProvider>(), initializer: _initializer), _body, this)
            };
        }
    }
}
