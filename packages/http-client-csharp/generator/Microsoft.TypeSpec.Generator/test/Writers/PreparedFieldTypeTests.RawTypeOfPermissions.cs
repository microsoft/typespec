// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        // Supporting observed-only retention. These qualified-static metadata
        // warmups do NOT close the original instance Pass/type-only-seed G3
        // anchors, the G1 contextual envelope, or body-only host/commit admission.
        [Test]
        public void RawTypeOfPermissionOmittedCallerExpressionRetainsOriginalOperand()
            => RunRawTypeOfPermissionWarmup(observed: true, shared: false);

        private static void RunRawTypeOfPermissionWarmup(bool observed, bool shared)
        {
            var previous = CodeModelGenerator.Instance;
            // Reuse the standard GetWriter factory counter and its DEFAULT
            // TypeFactory getter, not an opaque body callback/custom writer.
            var services = new GeneratedInstanceWriterService(new GeneratorContext(previous.Configuration))
            { SourceInputModel = previous.SourceInputModel };
            CodeModelGenerator.Instance = services;
            try
            {
                var operand = new TypeOfExpression(typeof(Exception));
                var safe = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedRawTypeOfPermissionProbe)),
                    "SafeType", new ValueExpression[] { operand });
                var observe = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)),
                    "ObserveType", new ValueExpression[] { operand });
                ValueExpression body = shared
                    ? new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedRawTypeOfPermissionProbe)),
                        "Pair", new ValueExpression[] { safe, observe })
                    : observed ? observe : safe;
                // Reuse the existing owned, single-method, parameterless fixture.
                // Only body-reachable IR is captured; no dummy field or seed.
                var owner = new ParameterValueOwner(body, Array.Empty<ParameterProvider>(),
                    name: "RawTypeOfPermissionOwner", emptyDocs: true);
                owner.EnsureBuilt();
                FinalizeGeneratedInstanceOwner(owner);
                Assert.That(owner.Fields, Is.Empty);
                Assert.That(owner.Constructors, Is.Empty);
                Assert.That(owner.Properties, Is.Empty);
                Assert.That(owner.NestedTypes, Is.Empty);
                Assert.That(owner.BaseType, Is.Null);
                Assert.That(owner.Implements, Is.Empty);
                Assert.That(owner.CustomCodeView, Is.Null);
                Assert.That(owner.Methods, Has.Count.EqualTo(1));
                Assert.That(owner.Methods.Single().Signature.Parameters, Is.Empty);
                Assert.That(services.TypeFactory.CSharpTypeMap.ContainsKey(owner.Type), Is.False);

                var inputs = CallProofCompilation();
                // Deliberate internal-Create consumer warmup, NOT a fabricated
                // complete-host snapshot. See notes for separate G1 lifecycle gates.
                using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, inputs, _ => true);
                var file = prepared.SourceFiles.Single();
                var nodes = file.Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
                var leaves = nodes.Where(n => ReferenceEquals(n.Producer, operand)).ToArray();
                Assert.That(services.WriteCallbacks, Is.Empty, "Preparation must call GetWriter zero times.");

                // Exactly ONE ordinary writer pass in this prepared-file lifetime.
                var writer = services.GetWriter(owner);
                Assert.That(writer.GetType(), Is.EqualTo(typeof(TypeProviderWriter)));
                writer.PreparedFieldTypes = prepared;
                var output = writer.Write();
                Assert.That(services.WriteCallbacks[owner], Is.EqualTo(1));
                Assert.That(services.WriteCallbacks, Has.Count.EqualTo(1));

                // Native syntax/operation/binding/diagnostic/emit/runtime evidence
                // on CodeFile.Content comes BEFORE any desired raw shortening.
                // Neither ReduceAsync nor a workspace/process result is consulted.
                var raw = AssertRawTypeOfNativeOracle(output.Content, inputs, observed, shared);
                var qualifiedContent = output.QualifiedContent
                    ?? throw new InvalidOperationException("The standard writer must produce its qualified companion.");
                // Same produced file, NOT another write or another preparation.
                var qualified = AssertRawTypeOfNativeOracle(qualifiedContent, inputs, observed, shared);
                Assert.That(qualified.Operands, Is.EqualTo(Enumerable.Repeat("global::System.Exception", shared ? 2 : 1)));

                var receipt = output.SourceConsumption
                    ?? throw new InvalidOperationException("Missing standard-writer source consumption receipt.");
                Assert.That(receipt.WasCurrentAtEndOfWrite, Is.True);
                Assert.That(receipt.Generation, Is.EqualTo(file.Generation));
                Assert.That(receipt.File, Is.EqualTo(file.FilePath));
                Assert.That(receipt.RootCount, Is.EqualTo(file.Roots.Length));
                var expectedConsumption = file.Roots.SelectMany(root => root.DescendantsAndSelf()
                    .Where(n => ReferenceEquals(n, root) || n.EmissionBoundary)).Select(n => n.Id).ToArray();
                Assert.That(receipt.Consumed, Is.EqualTo(expectedConsumption));
                Assert.That(receipt.Consumed.Distinct().Count(), Is.EqualTo(receipt.Consumed.Length));
                Assert.That(leaves, Has.Length.EqualTo(shared ? 2 : 1));
                Assert.That(leaves.All(n => receipt.Consumed.Contains(n.Id)), Is.True);
                if (shared)
                {
                    Assert.That(leaves[0].Producer, Is.SameAs(leaves[1].Producer));
                    Assert.That(leaves[0].Id, Is.Not.EqualTo(leaves[1].Id));
                }

                var observations = file.Observations
                    ?? throw new InvalidOperationException("Missing prepared observation graph.");
                Assert.That(observations.IsCurrent, Is.True);
                if (!observed || shared)
                {
                    var parent = nodes.Single(n => ReferenceEquals(n.Producer, safe));
                    var selection = parent.CallProofs?.Selection
                        ?? throw new InvalidOperationException("Single SafeType metadata declaration needs existing selection evidence.");
                    Assert.That(selection.IsCurrent, Is.True);
                    Assert.That(selection.Occurrence, Is.EqualTo(parent.Id));
                    Assert.That(SymbolEqualityComparer.Default.Equals(selection.Contract.DeclarationSymbol, raw.Safe), Is.True);
                    Assert.That(selection.Arguments.ImplicitCallerExpressionInputs, Is.Empty);
                    Assert.That(selection.Arguments.HasImplicitCallerLine, Is.False);
                    Assert.That(parent.CallProofs?.ObservationAbsence, Is.Not.Null);
                    AssertRawTypeOfUnobservedFacts(observations, parent);
                    var leaf = leaves.Single(n => n.Id.EdgePath == parent.Id.EdgePath + "/argument[0]");
                    AssertRawTypeOfUnobservedFacts(observations, leaf);
                }
                if (observed)
                {
                    var parent = nodes.Single(n => ReferenceEquals(n.Producer, observe));
                    var selection = parent.CallProofs?.Selection
                        ?? throw new InvalidOperationException("ObserveType needs existing metadata selection evidence.");
                    Assert.That(selection.IsCurrent, Is.True);
                    Assert.That(selection.Occurrence, Is.EqualTo(parent.Id));
                    Assert.That(SymbolEqualityComparer.Default.Equals(selection.Contract.DeclarationSymbol, raw.Observe), Is.True);
                    Assert.That(selection.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
                    Assert.That(selection.Arguments.HasImplicitCallerLine, Is.True);
                    Assert.That(selection.Arguments.Parameters[0].Value, Is.SameAs(operand));
                    Assert.That(parent.CallProofs?.ObservationAbsence, Is.Null);
                    var leaf = leaves.Single(n => n.Id.EdgePath == parent.Id.EdgePath + "/argument[0]");
                    var parentFacts = observations.GetCurrent(parent)
                        ?? throw new InvalidOperationException("Missing observing parent facts.");
                    var leafFacts = observations.GetCurrent(leaf)
                        ?? throw new InvalidOperationException("Missing captured edge facts.");
                    Assert.That(parentFacts.DirectKnowledge, Is.EqualTo(PreparedSourceObservations.PreparedDirectCaptureKnowledge.Known));
                    var capture = parentFacts.OwnCaptures.Single();
                    Assert.That(capture.Observer, Is.EqualTo(parent.Id));
                    Assert.That(capture.CaptureParameterOrdinal, Is.EqualTo(1));
                    Assert.That(capture.InputParameterOrdinal, Is.Zero);
                    Assert.That(capture.SuppliedArgumentRoot, Is.EqualTo(leaf.Id));
                    Assert.That(parentFacts.EnclosingCaptures, Is.Empty);
                    Assert.That(parentFacts.OwnBarriers, Is.Empty);
                    Assert.That(parentFacts.EnclosingBarriers, Is.Empty);
                    Assert.That(leafFacts.IsCurrent, Is.True);
                    Assert.That(leafFacts.OwnCaptures, Is.Empty);
                    Assert.That(leafFacts.EnclosingCaptures, Is.EqualTo(new[] { capture }));
                    Assert.That(leafFacts.OwnBarriers, Is.Empty);
                    Assert.That(leafFacts.EnclosingBarriers, Is.Empty);
                }
                if (shared)
                {
                    var pair = nodes.Single(n => ReferenceEquals(n.Producer, body));
                    var selection = pair.CallProofs?.Selection
                        ?? throw new InvalidOperationException("Pair needs existing selected-child return-type evidence.");
                    Assert.That(SymbolEqualityComparer.Default.Equals(selection.Contract.DeclarationSymbol, raw.Pair), Is.True);
                    Assert.That(selection.IsCurrent, Is.True);
                    Assert.That(pair.CallProofs?.ObservationAbsence, Is.Not.Null);
                    AssertRawTypeOfUnobservedFacts(observations, pair);
                }

                // Prepared knowledge and a complete cursor are NOT permission.
                // These are the deliberately missing raw-consumer expectations.
                Assert.That(raw.Operands, Is.EqualTo(shared
                    ? new[] { "Exception", "global::System.Exception" }
                    : new[] { observed ? "global::System.Exception" : "Exception" }));
                if (!observed || shared)
                {
                    Assert.That(output.Content, Does.Contain("typeof(Exception)"));
                }
                if (observed)
                {
                    Assert.That(output.Content, Does.Contain("typeof(global::System.Exception)"));
                }
            }
            finally { CodeModelGenerator.Instance = previous; }
        }

        private static void AssertRawTypeOfUnobservedFacts(PreparedSourceObservations observations, PreparedSourceOccurrence node)
        {
            var facts = observations.GetCurrent(node)
                ?? throw new InvalidOperationException("Missing current occurrence observations.");
            Assert.That(facts.IsCurrent, Is.True);
            Assert.That(facts.Occurrence, Is.EqualTo(node.Id));
            if (node.Producer is InvokeMethodExpression)
            {
                Assert.That(facts.DirectKnowledge, Is.EqualTo(PreparedSourceObservations.PreparedDirectCaptureKnowledge.Known));
            }
            Assert.That(facts.OwnCaptures, Is.Empty);
            Assert.That(facts.EnclosingCaptures, Is.Empty);
            Assert.That(facts.OwnBarriers, Is.Empty);
            Assert.That(facts.EnclosingBarriers, Is.Empty);
        }

        private static (string[] Operands, IMethodSymbol? Safe, IMethodSymbol? Observe, IMethodSymbol? Pair)
            AssertRawTypeOfNativeOracle(string content, CSharpCompilation inputs, bool observed, bool shared)
        {
            var tree = CSharpSyntaxTree.ParseText(content);
            var compilation = inputs.WithAssemblyName("RawTypeOfPermission_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var model = compilation.GetSemanticModel(tree);
            var exception = compilation.GetTypeByMetadataName("System.Exception")
                ?? throw new InvalidOperationException("Missing actual System.Exception symbol.");
            var systemType = compilation.GetTypeByMetadataName("System.Type")
                ?? throw new InvalidOperationException("Missing actual System.Type symbol.");
            var syntaxNodes = tree.GetRoot().DescendantNodes().OfType<TypeOfExpressionSyntax>().ToArray();
            Assert.That(syntaxNodes, Has.Length.EqualTo(shared ? 2 : 1));
            IMethodSymbol? safe = null;
            IMethodSymbol? observe = null;
            IMethodSymbol? pair = null;
            foreach (var syntax in syntaxNodes)
            {
                var operation = model.GetOperation(syntax) as ITypeOfOperation
                    ?? throw new InvalidOperationException("Operand must be an actual C# typeof operation.");
                Assert.That(SymbolEqualityComparer.Default.Equals(operation.TypeOperand, exception), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(operation.Type, systemType), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetTypeInfo(syntax.Type).Type, exception), Is.True);
                var argument = syntax.Parent as ArgumentSyntax
                    ?? throw new InvalidOperationException("typeof must be the actual direct argument, not a surrogate.");
                var invocation = argument.Parent?.Parent as InvocationExpressionSyntax
                    ?? throw new InvalidOperationException("Missing actual parent invocation syntax.");
                var parent = model.GetOperation(invocation) as IInvocationOperation
                    ?? throw new InvalidOperationException("Missing actual parent invocation operation.");
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(invocation).Symbol, parent.TargetMethod), Is.True);
                Assert.That(parent.TargetMethod.IsStatic, Is.True);
                Assert.That(parent.TargetMethod.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
                Assert.That(parent.TargetMethod.MethodKind, Is.EqualTo(MethodKind.Ordinary));
                Assert.That(parent.TargetMethod.Arity, Is.Zero);
                Assert.That(parent.Instance, Is.Null);
                Assert.That(parent.TargetMethod.Locations.All(l => l.IsInMetadata), Is.True);
                Assert.That(SymbolEqualityComparer.Default.Equals(parent.TargetMethod.Parameters[0].Type, systemType), Is.True);
                Assert.That(parent.Arguments.Single(a => a.Parameter?.Ordinal == 0).IsImplicit, Is.False);
                var member = invocation.Expression as MemberAccessExpressionSyntax
                    ?? throw new InvalidOperationException("Metadata parent must have an explicit qualified receiver.");
                var isObserver = parent.TargetMethod.Name == "ObserveType";
                var metadataName = isObserver ? typeof(PreparedTypeOfCallProbe).FullName! : typeof(PreparedRawTypeOfPermissionProbe).FullName!;
                var target = compilation.GetTypeByMetadataName(metadataName)
                    ?? throw new InvalidOperationException("Missing actual metadata parent type.");
                Assert.That(SymbolEqualityComparer.Default.Equals(parent.TargetMethod.ContainingType, target), Is.True);
                Assert.That(member.Expression.ToString(), Is.EqualTo("global::" + metadataName));
                Assert.That(parent.TargetMethod.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_String));
                if (isObserver)
                {
                    observe = parent.TargetMethod;
                    Assert.That(observed, Is.True);
                    Assert.That(parent.TargetMethod.Parameters, Has.Length.EqualTo(3));
                    var attribute = parent.TargetMethod.Parameters[1].GetAttributes().Single();
                    Assert.That(attribute.AttributeClass?.ToDisplayString(), Is.EqualTo("System.Runtime.CompilerServices.CallerArgumentExpressionAttribute"));
                    Assert.That(attribute.ConstructorArguments.Single().Value, Is.EqualTo("value"));
                    var capture = parent.Arguments.Single(a => a.Parameter?.Ordinal == 1);
                    Assert.That(capture.IsImplicit, Is.True);
                    Assert.That(capture.ArgumentKind, Is.EqualTo(ArgumentKind.DefaultValue));
                    Assert.That(capture.Value.ConstantValue.HasValue, Is.True);
                    Assert.That(capture.Value.ConstantValue.Value, Is.EqualTo("typeof(global::System.Exception)"));
                    var line = parent.Arguments.Single(a => a.Parameter?.Ordinal == 2);
                    Assert.That(line.IsImplicit, Is.True);
                    Assert.That(line.Value.ConstantValue.Value, Is.EqualTo(invocation.GetLocation().GetLineSpan().StartLinePosition.Line + 1));
                }
                else
                {
                    safe = parent.TargetMethod;
                    Assert.That(parent.TargetMethod.Name, Is.EqualTo("SafeType"));
                    Assert.That(parent.Arguments, Has.Length.EqualTo(1));
                    Assert.That(parent.TargetMethod.Parameters.Single().GetAttributes(), Is.Empty);
                }
            }
            var invocations = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().ToArray();
            Assert.That(invocations, Has.Length.EqualTo(shared ? 3 : 1));
            if (shared)
            {
                var outerSyntax = invocations.Single(i => i.ArgumentList.Arguments.Count == 2);
                var outer = model.GetOperation(outerSyntax) as IInvocationOperation
                    ?? throw new InvalidOperationException("Missing actual Pair parent operation.");
                pair = outer.TargetMethod;
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(outerSyntax).Symbol, pair), Is.True);
                Assert.That(pair.Name, Is.EqualTo("Pair"));
                Assert.That(pair.ContainingType.ToDisplayString(), Is.EqualTo(typeof(PreparedRawTypeOfPermissionProbe).FullName));
                Assert.That(pair.IsStatic, Is.True);
                Assert.That(pair.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
                Assert.That(pair.Locations.All(l => l.IsInMetadata), Is.True);
                Assert.That(pair.Parameters.Select(p => p.Type.SpecialType), Is.EqualTo(new[] { SpecialType.System_String, SpecialType.System_String }));
                Assert.That(pair.Parameters.All(p => p.GetAttributes().IsEmpty), Is.True);
                Assert.That(outer.Arguments.All(a => !a.IsImplicit), Is.True);
                Assert.That(outer.Arguments.Select(a => a.Value).All(v => v is IInvocationOperation), Is.True);
            }
            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
            var assembly = Assembly.Load(stream.ToArray());
            var runtimeOwner = assembly.GetType("Sample.RawTypeOfPermissionOwner")
                ?? throw new InvalidOperationException("Missing emitted runtime owner.");
            var runtimeMethod = runtimeOwner.GetMethod("M")
                ?? throw new InvalidOperationException("Missing emitted runtime method.");
            Assert.That(runtimeMethod.GetParameters(), Is.Empty);
            Assert.That(runtimeMethod.Invoke(null, null), Is.EqualTo(shared
                ? "type|typeof(global::System.Exception)"
                : observed ? "typeof(global::System.Exception)" : "type"));
            return (syntaxNodes.Select(s => s.Type.ToString()).ToArray(), safe, observe, pair);
        }
    }
}
