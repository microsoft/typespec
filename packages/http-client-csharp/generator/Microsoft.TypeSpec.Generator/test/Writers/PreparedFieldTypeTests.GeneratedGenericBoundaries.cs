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
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        private sealed class AlternateGenericBoundaryTemplate<T> { }

        [TestCase("written-type-argument")]
        [TestCase("declaration-type-parameter")]
        [TestCase("helper-modifiers")]
        [TestCase("helper-body")]
        [TestCase("retained-value-argument")]
        public void GeneratedGenericBoundaryNativeBindingAndGraphInvalidateStickily(string mutation)
        {
            var previous = CodeModelGenerator.Instance;
            var services = new GeneratedInstanceWriterService(new GeneratorContext(previous.Configuration))
            { SourceInputModel = previous.SourceInputModel };
            CodeModelGenerator.Instance = services;
            try
            {
                var owner = new GeneratedGenericProofOwner("explicit-int-substitution");
                owner.EnsureBuilt();
                FinalizeGeneratedInstanceOwner(owner);
                var call = owner.Call;
                var writtenTypes = (CSharpType[])call.TypeArguments!;
                var declaredTypes = (CSharpType[])owner.Helper.Signature.GenericArguments!;
                var writtenValues = (ValueExpression[])call.Arguments;
                var originalType = writtenTypes.Single();
                var originalDeclaration = declaredTypes.Single();
                var originalValue = writtenValues.Single();
                var originalModifiers = owner.Helper.Signature.Modifiers;
                var originalBody = owner.Helper.BodyExpression!;
                var inputs = CallProofCompilation();
                Assert.That(services.TypeFactory.CSharpTypeMap, Is.Empty);
                using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, inputs, _ => true);
                var source = prepared.SourceFiles.Single();
                var node = source.Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
                var selection = node.CallProofs?.Selection;
                var graph = source.Observations!;
                Assert.That(services.WriteCallbacks, Is.Empty);
                var writer = services.GetWriter(owner);
                writer.PreparedFieldTypes = prepared;
                var output = writer.Write();
                Assert.That(services.WriteCallbacks[owner], Is.EqualTo(1));
                Assert.That(services.WriteCallbacks, Has.Count.EqualTo(1));
                Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);

                // Establish the actual constructed native declaration and runtime
                // before asserting any generated-definition binding or freshness.
                var tree = CSharpSyntaxTree.ParseText(output.Content);
                var compilation = inputs.WithAssemblyName("GenericBoundary_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
                Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var model = compilation.GetSemanticModel(tree);
                var invocation = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
                var operation = (IInvocationOperation)model.GetOperation(invocation)!;
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(invocation).Symbol, operation.TargetMethod), Is.True);
                Assert.That(operation.TargetMethod.Name, Is.EqualTo("Identity"));
                Assert.That(operation.TargetMethod.IsStatic, Is.True);
                Assert.That(operation.TargetMethod.Arity, Is.EqualTo(1));
                Assert.That(operation.TargetMethod.TypeArguments.Single().SpecialType, Is.EqualTo(SpecialType.System_Int32));
                Assert.That(operation.TargetMethod.Parameters.Single().Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));
                Assert.That(operation.TargetMethod.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Int32));
                Assert.That(operation.TargetMethod.OriginalDefinition.TypeParameters.Single().Name, Is.EqualTo("T"));
                Assert.That(operation.Arguments.Single().Value.ConstantValue.Value, Is.EqualTo(1));
                using var stream = new MemoryStream();
                var emit = compilation.Emit(stream);
                Assert.That(emit.Success, Is.True, string.Join("\n", emit.Diagnostics));
                var runtimeOwner = Assembly.Load(stream.ToArray()).GetType("Sample.Clock")!;
                Assert.That(runtimeOwner.GetMethod("M")!.Invoke(null, null), Is.EqualTo(1));

                Assert.That(selection, Is.Not.Null);
                var selected = selection!;
                var binding = selected.GeneratedBinding;
                Assert.That(binding, Is.Not.Null);
                var bound = binding!;
                Assert.That(bound.Occurrence, Is.EqualTo(node.Id));
                Assert.That(bound.Declaration, Is.SameAs(selected.GeneratedDeclaration));
                Assert.That(bound.Declaration.Method, Is.SameAs(owner.Helper));
                Assert.That(selected.Contract.DeclarationSymbol, Is.Null);
                Assert.That(selected.Contract.Parameters.Single().Provider, Is.SameAs(owner.Helper.Signature.Parameters.Single()));
                Assert.That(bound.GenericArguments.Single().SpecialType, Is.EqualTo(SpecialType.System_Int32));
                Assert.That(bound.FormalTypes.Single().SpecialType, Is.EqualTo(SpecialType.System_Int32));
                Assert.That(bound.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Int32));
                Assert.That(bound.IsCurrent, Is.True);
                Assert.That(selected.IsCurrent, Is.True);
                Assert.That(graph.IsCurrent, Is.True);
                Assert.That(graph.GetCurrent(node)!.DirectKnowledge,
                    Is.EqualTo(PreparedSourceObservations.PreparedDirectCaptureKnowledge.Known));
                Assert.That(graph.GetCurrent(node)!.OwnCaptures, Is.Empty);
                Assert.That(graph.GetCurrent(node)!.OwnBarriers, Is.Empty);

                switch (mutation)
                {
                    case "written-type-argument": writtenTypes[0] = typeof(string); break;
                    case "declaration-type-parameter": declaredTypes[0] = typeof(AlternateGenericBoundaryTemplate<>).GetGenericArguments()[0]; break;
                    case "helper-modifiers": owner.Helper.Signature.Modifiers &= ~MethodSignatureModifiers.Static; break;
                    case "helper-body": owner.Helper.Update(bodyExpression: Literal(2)); break;
                    case "retained-value-argument": writtenValues[0] = Literal(2); break;
                    default: Assert.Fail(mutation); break;
                }
                Assert.That(bound.IsCurrent, Is.False);
                Assert.That(selected.IsCurrent, Is.False);
                Assert.That(node.CallProofs?.Selection, Is.Null);
                Assert.That(graph.IsCurrent, Is.False);
                Assert.That(graph.GetCurrent(node), Is.Null);

                writtenTypes[0] = originalType;
                declaredTypes[0] = originalDeclaration;
                writtenValues[0] = originalValue;
                owner.Helper.Signature.Modifiers = originalModifiers;
                if (mutation == "helper-body") { owner.Helper.Update(bodyExpression: originalBody); }
                Assert.That(bound.IsCurrent, Is.False, "Observed invalidation is sticky even after restoring the same references and spelling.");
                Assert.That(selected.IsCurrent, Is.False);
                Assert.That(node.CallProofs?.Selection, Is.Null);
                Assert.That(graph.IsCurrent, Is.False);
                Assert.That(graph.GetCurrent(node), Is.Null);
                Assert.That(services.WriteCallbacks[owner], Is.EqualTo(1), "No writer replay for freshness.");
            }
            finally { CodeModelGenerator.Instance = previous; }
        }
    }
}
