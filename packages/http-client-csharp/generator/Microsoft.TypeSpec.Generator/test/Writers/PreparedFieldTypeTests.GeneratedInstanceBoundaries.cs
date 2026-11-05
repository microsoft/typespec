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
using Microsoft.TypeSpec.Generator.Snippets;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        // UNEXECUTED boundary controls, not additional accepted call families.
        // Requires the original GeneratedInstanceProofs partial, unchanged.
        [Test]
        public void GeneratedInstanceBoundaryNamedCanonicalCompetitorIsNotDropped()
        {
            using var service = new GeneratedInstanceBoundaryServiceScope();
            var target = new GeneratedInstanceBoundaryTarget(competitor: true);
            target.EnsureBuilt();
            var receiver = new ParameterProvider("receiver", $"receiver", target.Type);
            var call = new InvokeMethodExpression(receiver.AsVariable(), "Safe", new ValueExpression[]
            { new PositionalParameterReferenceExpression("value", Literal(1)) });
            var result = PrepareGeneratedInstanceBoundary(service.Services, target, receiver, call);
            using var prepared = result.Plan;

            // The helper has already bound the named call to int, emitted both
            // overloads into ONE assembly, and executed M with a real receiver.
            var actual = result.Actual!;
            var overloads = actual.ContainingType.GetMembers("Safe").OfType<IMethodSymbol>().ToArray();
            Assert.That(overloads, Has.Length.EqualTo(2));
            var unsupported = overloads.Single(m => m.Parameters[0].Type.SpecialType == SpecialType.None);
            Assert.That(SymbolEqualityComparer.Default.Equals(unsupported.Parameters[0].Type, actual.ContainingType), Is.True);
            Assert.That(overloads.All(m => m.Parameters.All(p => p.GetAttributes().IsEmpty)), Is.True);
            Assert.That(result.SelectionBeforeWrite, Is.Null, "Do not drop the canonical-generated-type competitor and select int.");
            Assert.That(result.AbsenceBeforeWrite, Is.Null, "An unselectable named competitor must not become an all-nonobserver proof.");
            Assert.That(result.Node.CallProofs?.Selection, Is.Null);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void GeneratedInstanceBoundaryLateUnrelatedNativeMapEntryInvalidatesHeldCallAndGraphStickily()
        {
            using var service = new GeneratedInstanceBoundaryServiceScope();
            var target = new GeneratedInstanceTarget(false);
            target.EnsureBuilt();
            var receiver = new ParameterProvider("receiver", $"receiver", target.Type);
            var call = new InvokeMethodExpression(receiver.AsVariable(), "Safe", new ValueExpression[] { Literal(1) });
            var result = PrepareGeneratedInstanceBoundary(service.Services, target, receiver, call);
            using var prepared = result.Plan;
            var held = result.SelectionBeforeWrite;
            var graph = result.Graph;
            Assert.That(held, Is.Not.Null);
            Assert.That(held!.IsCurrent, Is.True);
            Assert.That(graph.IsCurrent, Is.True);
            var map = GeneratedInstanceBoundaryNativeMap(service.Services);
            Assert.That(map, Is.Empty);
            try
            {
                // Native, unrelated key; null value. No mapped-provider adoption
                // and no custom equality, hash, key collection, or provider callback.
                map.Add(new CSharpType(typeof(Uri)), null);
                Assert.That(held.IsCurrent, Is.False);
                Assert.That(graph.IsCurrent, Is.False);
            }
            finally { map.Clear(); }
            Assert.That(held.IsCurrent, Is.False);
            Assert.That(graph.IsCurrent, Is.False);
        }

        [Test]
        public void GeneratedInstanceBoundaryInitiallyNonemptyNativeMapIsUnknownDespiteValidRuntime()
        {
            using var service = new GeneratedInstanceBoundaryServiceScope();
            var map = GeneratedInstanceBoundaryNativeMap(service.Services);
            Assert.That(map, Is.Empty);
            map.Add(new CSharpType(typeof(Uri)), null);
            try
            {
                var target = new GeneratedInstanceTarget(false);
                target.EnsureBuilt();
                var receiver = new ParameterProvider("receiver", $"receiver", target.Type);
                var call = new InvokeMethodExpression(receiver.AsVariable(), "Safe", new ValueExpression[] { Literal(1) });
                var result = PrepareGeneratedInstanceBoundary(service.Services, target, receiver, call);
                using var prepared = result.Plan;
                Assert.That(result.SelectionBeforeWrite, Is.Null);
                Assert.That(result.AbsenceBeforeWrite, Is.Null);
                Assert.That(result.Node.CallProofs?.Selection, Is.Null);
                Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Null);
            }
            finally { map.Clear(); }
        }

        [TestCase("receiver-type")]
        [TestCase("deep-arguments")]
        public void GeneratedInstanceBoundaryCallerMutationAndRestorationDoNotReviveHeldFacts(string mutation)
        {
            using var service = new GeneratedInstanceBoundaryServiceScope();
            var target = new GeneratedInstanceTarget(false);
            target.EnsureBuilt();
            var receiver = new ParameterProvider("receiver", $"receiver", target.Type);
            // Deliberately misleading hint, preserving the actual frame's
            // declaration identity. The emitted parameter remains authoritative.
            var receiverUse = new VariableExpression(typeof(int), receiver.AsVariable().Declaration);
            ValueExpression original = Literal(1);
            var arguments = new List<ValueExpression> { original };
            var call = new InvokeMethodExpression(receiverUse, "Safe", arguments);
            var result = PrepareGeneratedInstanceBoundary(service.Services, target, receiver, call, wrapBody: true);
            using var prepared = result.Plan;
            var held = result.SelectionBeforeWrite;
            Assert.That(held, Is.Not.Null);
            Assert.That(held!.IsCurrent, Is.True);
            Assert.That(result.Graph.IsCurrent, Is.True);
            try
            {
                if (mutation == "receiver-type") { receiver.Update(type: typeof(int)); }
                else { arguments[0] = Literal(2); } // no call.Update/revision bump
                Assert.That(held.IsCurrent, Is.False);
                Assert.That(result.Graph.IsCurrent, Is.False);
            }
            finally
            {
                if (mutation == "receiver-type") { receiver.Update(type: target.Type); }
                else { arguments[0] = original; }
            }
            Assert.That(held.IsCurrent, Is.False);
            Assert.That(result.Graph.IsCurrent, Is.False);
        }

        [TestCase("static-via-instance", "CS0176")]
        [TestCase("instance-via-type", "CS0120")]
        [TestCase("empty-type-arguments-static-via-instance", "CS0176")]
        public void GeneratedInstanceBoundaryInvalidReceiverSyntaxRetainsCompilerDiagnostic(string mode, string diagnostic)
        {
            using var service = new GeneratedInstanceBoundaryServiceScope();
            var target = new GeneratedInstanceBoundaryTarget(isStatic: mode != "instance-via-type");
            target.EnsureBuilt();
            var receiver = new ParameterProvider("receiver", $"receiver", target.Type);
            ValueExpression use = mode == "instance-via-type"
                ? TypeReferenceExpression.FromType(target.Type) : receiver.AsVariable();
            var call = new InvokeMethodExpression(use, "Safe", new ValueExpression[] { Literal(1) });
            if (mode == "empty-type-arguments-static-via-instance")
            {
                // Empty lists write NO angle brackets. They must not bypass the
                // receiver/static check and clear the real CS0176 diagnostic.
                call.TypeArguments = Array.Empty<CSharpType>();
            }
            var result = PrepareGeneratedInstanceBoundary(service.Services, target, receiver, call, expectedDiagnostic: diagnostic);
            using var prepared = result.Plan;
            // Actual emitted-tree diagnostics are asserted in the helper FIRST.
            Assert.That(result.SelectionBeforeWrite, Is.Null);
            Assert.That(result.AbsenceBeforeWrite, Is.Null);
            Assert.That(result.Node.CallProofs?.Selection, Is.Null);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Null);
        }

        private static Dictionary<CSharpType, TypeProvider?> GeneratedInstanceBoundaryNativeMap(GeneratedInstanceWriterService services)
        {
            Assert.That(services.TypeFactory.CSharpTypeMap.GetType(), Is.EqualTo(typeof(Dictionary<CSharpType, TypeProvider>)));
            return (Dictionary<CSharpType, TypeProvider?>)services.TypeFactory.CSharpTypeMap;
        }

        // The D1 compilation/emit/runtime logic is method-local. Keep this small
        // test-only counterpart here rather than rewriting the original fixture.
        private static (PreparedFieldTypes Plan, PreparedSourceOccurrence Node,
            PreparedSelectedCall? SelectionBeforeWrite, PreparedDirectObservationAbsence? AbsenceBeforeWrite,
            PreparedSourceObservations Graph, IMethodSymbol? Actual) PrepareGeneratedInstanceBoundary(
            GeneratedInstanceWriterService services, TypeProvider target, ParameterProvider receiver,
            InvokeMethodExpression call, bool wrapBody = false, string? expectedDiagnostic = null)
        {
            var caller = new ParameterValueOwner(wrapBody ? new ScopedApi<string>(call) : call, new[] { receiver });
            caller.EnsureBuilt();
            FinalizeGeneratedInstanceOwner(target);
            FinalizeGeneratedInstanceOwner(caller);
            var compilation = CallProofCompilation();
            var metadataName = target.Type.Namespace + "." + target.Type.Name;
            Assert.That(compilation.GetTypeByMetadataName(metadataName), Is.Null);
            var owners = new TypeProvider[] { target, caller };
            var prepared = PreparedFieldTypes.Create(owners, compilation, _ => true);
            try
            {
                var node = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf())
                    .Single(n => ReferenceEquals(n.Producer, call));
                var selection = node.CallProofs?.Selection;
                var absence = node.CallProofs?.ObservationAbsence;
                var graph = prepared.SourceFiles.Single(f => ReferenceEquals(f.FileOwner, caller)).Observations!;
                Assert.That(services.WriteCallbacks, Is.Empty, "GetWriter: zero during preparation.");
                var outputs = owners.Select(owner =>
                {
                    var writer = services.GetWriter(owner);
                    writer.PreparedFieldTypes = prepared;
                    return writer.Write();
                }).ToArray();
                Assert.That(owners.All(owner => services.WriteCallbacks[owner] == 1), Is.True, "GetWriter: one per actual write.");
                Assert.That(outputs.All(o => o.SourceConsumption!.WasCurrentAtEndOfWrite), Is.True);
                var trees = outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content)).ToArray();
                compilation = compilation.WithAssemblyName("GeneratedInstanceBoundary_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(trees);
                var errors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
                var syntax = trees[1].GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
                if (expectedDiagnostic is not null)
                {
                    Assert.That(errors.Any(d => d.Id == expectedDiagnostic && d.Location.SourceTree == trees[1]), Is.True,
                        string.Join("\n", errors.Select(d => d.ToString())));
                    if (call.TypeArguments is { Count: 0 })
                    {
                        Assert.That(((MemberAccessExpressionSyntax)syntax.Expression).Name, Is.InstanceOf<IdentifierNameSyntax>());
                    }
                    return (prepared, node, selection, absence, graph, null);
                }

                Assert.That(errors, Is.Empty);
                var model = compilation.GetSemanticModel(trees[1]);
                var operation = model.GetOperation(syntax) as IInvocationOperation;
                Assert.That(operation, Is.Not.Null);
                var actual = operation!.TargetMethod;
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(syntax).Symbol, actual), Is.True);
                var targetSymbol = compilation.GetTypeByMetadataName(metadataName)!;
                var callerSymbol = compilation.GetTypeByMetadataName("Sample.ParameterValueOwner")!;
                var emittedReceiver = callerSymbol.GetMembers("M").OfType<IMethodSymbol>().Single().Parameters.Single();
                Assert.That(SymbolEqualityComparer.Default.Equals(emittedReceiver.Type, targetSymbol), Is.True);
                Assert.That(operation.Instance, Is.InstanceOf<IParameterReferenceOperation>());
                Assert.That(SymbolEqualityComparer.Default.Equals(((IParameterReferenceOperation)operation.Instance!).Parameter, emittedReceiver), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(actual.ContainingType, targetSymbol), Is.True);
                Assert.That(actual.IsStatic, Is.False);
                Assert.That(actual.Name, Is.EqualTo("Safe"));
                Assert.That(actual.Arity, Is.Zero);
                Assert.That(actual.Parameters.Single().Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));
                Assert.That(operation.Arguments.Single().Parameter!.Name, Is.EqualTo("value"));
                Assert.That(operation.Arguments.Single().Value.ConstantValue.Value, Is.EqualTo(1));
                using var stream = new MemoryStream();
                var emitted = compilation.Emit(stream);
                Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
                var assembly = Assembly.Load(stream.ToArray());
                var runtimeTarget = assembly.GetType(metadataName)!;
                var runtimeReceiver = Activator.CreateInstance(runtimeTarget)!;
                var runtimeCaller = assembly.GetType("Sample.ParameterValueOwner")!.GetMethod("M")!;
                Assert.That(runtimeCaller.GetParameters().Single().ParameterType, Is.SameAs(runtimeTarget));
                Assert.That(runtimeCaller.Invoke(null, new[] { runtimeReceiver }), Is.EqualTo("safe"));
                return (prepared, node, selection, absence, graph, actual);
            }
            catch { prepared.Dispose(); throw; }
        }

        private sealed class GeneratedInstanceBoundaryServiceScope : IDisposable
        {
            private readonly CodeModelGenerator _previous = CodeModelGenerator.Instance;
            internal GeneratedInstanceWriterService Services { get; }
            internal GeneratedInstanceBoundaryServiceScope()
            {
                Services = new GeneratedInstanceWriterService(new GeneratorContext(_previous.Configuration))
                { SourceInputModel = _previous.SourceInputModel };
                CodeModelGenerator.Instance = Services;
            }
            public void Dispose() => CodeModelGenerator.Instance = _previous;
        }

        private sealed class GeneratedInstanceBoundaryTarget(bool competitor = false, bool isStatic = false) : TypeProvider
        {
            protected override string BuildName() => "BoundaryTarget";
            protected override string BuildNamespace() => "Sample.GeneratedInstanceBoundaries";
            protected override string BuildRelativeFilePath() => "BoundaryTarget.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected internal override MethodProvider[] BuildMethods()
            {
                var modifiers = MethodSignatureModifiers.Public | (isStatic ? MethodSignatureModifiers.Static : (MethodSignatureModifiers)0);
                var scalar = new MethodProvider(new MethodSignature("Safe", null, modifiers, typeof(string), null,
                    new[] { new ParameterProvider("value", $"value", typeof(int)) }), Literal("safe"), this);
                if (!competitor) { return new[] { scalar }; }
                // Exact cached canonical self type, not a separately constructed
                // QName lookalike or an invented IMethodSymbol.
                var generated = new MethodProvider(new MethodSignature("Safe", null, modifiers, typeof(string), null,
                    new[] { new ParameterProvider("value", $"value", Type) }), Literal("competitor"), this);
                return new[] { scalar, generated };
            }
        }
    }
}
