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
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(typeof(int))]
        [TestCase(typeof(string))]
        [TestCase(typeof(bool))]
        [TestCase(typeof(char))]
        public void ParameterValueProofUsesActualEmittedParameterType(Type type)
        {
            var parameter = new ParameterProvider("p", $"parameter", type);
            var variable = parameter.AsVariable();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { variable });
            object value = type == typeof(string) ? "x" : type == typeof(bool) ? true : type == typeof(char) ? (object)'x' : 1;
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new[] { value });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("p"));
            var selected = result.Node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, result.Actual), Is.True);
            Assert.That(selected.Arguments.Parameters[0].Value, Is.SameAs(variable));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.True);
        }

        [Test]
        public void ParameterValueProofIgnoresVariableAndWrapperHints()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(Type));
            var wrongHint = new VariableExpression(typeof(int), parameter.AsVariable().Declaration);
            var argument = new ScopedApi<string>(wrongHint);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedTypeOfCallProbe)), "ObserveType", new ValueExpression[] { argument });
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { typeof(int) });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("p"));
            var selected = result.Node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, result.Actual), Is.True);
            Assert.That(selected.Arguments.Parameters[0].Value, Is.SameAs(argument));
        }

        [Test]
        public void ParameterValueProofSharedNamedArgumentsKeepEvaluationOrder()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(object));
            var variable = parameter.AsVariable();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedConstructionArgumentProbe)), "ObservePair", new ValueExpression[]
            {
                new PositionalParameterReferenceExpression("right", variable), new PositionalParameterReferenceExpression("left", variable)
            });
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { new object() });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("p|p"));
            var selected = result.Node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Arguments.EvaluationOrder.Select(a => a.Formal.Ordinal), Is.EqualTo(new[] { 1, 0 }));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0, 1 }));
        }

        [Test]
        public void ParameterValueProofProvidesActualInstanceReceiverType()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(PreparedInstanceCallProbe));
            var receiver = new VariableExpression(typeof(int), parameter.AsVariable().Declaration);
            var call = new InvokeMethodExpression(new ScopedApi<string>(receiver), "Observe", new ValueExpression[] { Literal(1) });
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { new PreparedInstanceCallProbe() });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("1"));
            var selected = result.Node.CallProofs?.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(SymbolEqualityComparer.Default.Equals(selected!.Contract.DeclarationSymbol, result.Actual), Is.True);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ParameterValueProofContainingMethodChangesInvalidateHeldChildDirectly(bool replaceBody)
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var parameters = new List<ParameterProvider> { parameter };
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var owner = new ParameterValueOwner(call, parameters);
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var held = node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            if (replaceBody) { owner.Methods[0].Update(bodyExpression: Literal("changed")); }
            else { parameters.Clear(); }
            Assert.That(held!.IsCurrent, Is.False);
            if (replaceBody) { owner.Methods[0].Update(bodyExpression: call); }
            else { parameters.Add(parameter); }
            Assert.That(held.IsCurrent, Is.False);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ParameterValueProofDoesNotBorrowUnattachedOrSameNameDeclarations(bool sameName)
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var variable = sameName ? new VariableExpression(typeof(int), "p") : parameter.AsVariable();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { variable });
            var owner = new ParameterValueOwner(call, sameName ? new[] { parameter } : Array.Empty<ParameterProvider>());
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [TestCase("type")]
        [TestCase("name")]
        [TestCase("carrier")]
        [TestCase("modifier")]
        public void ParameterValueProofParameterMutationInvalidatesHeldCertificate(string change)
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var variable = parameter.AsVariable();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { variable });
            var result = PrepareAndRunParameterCall(new ParameterValueOwner(call, new[] { parameter }), call, new object[] { 1 });
            using var prepared = result.Plan;
            var held = result.Node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            switch (change)
            {
                case "type": parameter.Update(type: typeof(string)); break;
                case "name": parameter.Update(name: "changed"); break;
                case "carrier": variable.Update(name: "changed"); break;
                default: parameter.Update(isRef: true); break;
            }
            Assert.That(held!.IsCurrent, Is.False);
            switch (change)
            {
                case "type": parameter.Update(type: typeof(int)); break;
                case "name": parameter.Update(name: "p"); break;
                case "carrier": variable.Update(name: "p"); break;
                default: parameter.Update(isRef: false); break;
            }
            Assert.That(held.IsCurrent, Is.False);
        }

        [TestCase("ref")]
        [TestCase("out")]
        [TestCase("in")]
        public void ParameterValueProofByReferenceParametersRemainUnknown(string modifier)
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int), isRef: modifier == "ref", isOut: modifier == "out", isIn: modifier == "in");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void ParameterValueProofSharedForeignMethodCannotBorrowOwningFrame()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            var owning = new ParameterValueOwner(call, new[] { parameter }, name: "Owning");
            var foreign = new ParameterValueOwner(call, Array.Empty<ParameterProvider>(), name: "Foreign");
            owning.EnsureBuilt();
            foreign.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owning, foreign }, CallProofCompilation(), _ => true);
            var ownedNode = prepared.SourceFiles.Single(f => ReferenceEquals(f.FileOwner, owning)).Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var foreignNode = prepared.SourceFiles.Single(f => ReferenceEquals(f.FileOwner, foreign)).Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(ownedNode.CallProofs?.Selection, Is.Not.Null);
            Assert.That(foreignNode.CallProofs?.Selection, Is.Null);
            Assert.That(foreignNode.CallProofs?.ObservationAbsence, Is.Null);
            Assert.That(ownedNode.Id, Is.Not.EqualTo(foreignNode.Id));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ParameterValueProofBlockAndEmptyClosureExtensionsUseOwningParameters(bool closure)
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { parameter.AsVariable() });
            ParameterValueOwner owner;
            if (closure)
            {
                owner = new ParameterValueOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), call), new[] { parameter }, typeof(Func<string>));
            }
            else
            {
                owner = new ParameterValueOwner(call, new[] { parameter });
                owner.EnsureBuilt();
                owner.Methods[0].Update(bodyStatements: new Microsoft.TypeSpec.Generator.Statements.ExpressionStatement(new KeywordExpression("return", call)));
            }
            var result = PrepareAndRunParameterCall(owner, call, new object[] { 1 });
            using var prepared = result.Plan;
            Assert.That(result.Runtime, Is.EqualTo("p"));
            // Deliberately extend the former expression-only boundary, then its
            // empty-parameter closure boundary; the original runtime fixture stays.
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
            Assert.That(result.Node.CallProofs?.ObservationAbsence, Is.Null);
        }

        [Test]
        public void ParameterValueProofCustomVariableDoesNotBorrowCachedDeclaration()
        {
            var parameter = new ParameterProvider("p", $"parameter", typeof(int));
            var callbacks = 0;
            var value = new ParameterVariableOverride(parameter.AsVariable().Declaration, () => callbacks++);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { value });
            var owner = new ParameterValueOwner(call, new[] { parameter });
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            Assert.That(callbacks, Is.Zero);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            _ = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(1));
        }

        [Test]
        public void ParameterValueProofUnusedLazyCarrierIsNotMaterializedAndDoesNotVetoLiteralProof()
        {
            var parameter = new ParameterProvider("unused", $"parameter", typeof(int));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedCastCallProbe)), "ObserveObject", new ValueExpression[] { Literal(1) });
            var owner = new ParameterValueOwner(call, new[] { parameter }, emptyDocs: true);
            owner.EnsureBuilt();
            Assert.That(parameter.CachedVariableExpression, Is.Null);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CallProofCompilation(), _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            var held = node.CallProofs?.Selection;
            Assert.That(held, Is.Not.Null);
            Assert.That(parameter.CachedVariableExpression, Is.Null);
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(parameter.CachedVariableExpression, Is.Not.Null);
            Assert.That(held!.IsCurrent, Is.True);
            prepared.Dispose();
            Assert.That(held.IsCurrent, Is.False);
        }

        private sealed record ParameterVariableOverride(CodeWriterDeclaration ValueDeclaration, Action Callback) : VariableExpression(typeof(int), ValueDeclaration)
        {
            internal override void WriteCore(CodeWriter writer) { Callback(); writer.AppendRaw("1"); }
        }

        private static (PreparedFieldTypes Plan, PreparedSourceOccurrence Node, IMethodSymbol Actual, string Runtime) PrepareAndRunParameterCall(
            ParameterValueOwner owner, InvokeMethodExpression call, object[] arguments)
        {
            owner.EnsureBuilt();
            var compilation = CallProofCompilation();
            var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            try
            {
                var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
                var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
                Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
                var tree = CSharpSyntaxTree.ParseText(output.Content);
                compilation = compilation.WithAssemblyName("ParameterProof_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
                Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var emittedName = call.MethodSignature?.Name ?? call.MethodName;
                var syntax = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single(s =>
                    (s.Expression is MemberAccessExpressionSyntax member ? member.Name.Identifier.ValueText :
                        s.Expression is SimpleNameSyntax simple ? simple.Identifier.ValueText : null) == emittedName);
                var method = (IMethodSymbol)compilation.GetSemanticModel(tree).GetSymbolInfo(syntax).Symbol!;
                using var stream = new MemoryStream();
                var emitted = compilation.Emit(stream);
                Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
                var assembly = Assembly.Load(stream.ToArray());
                var value = assembly.GetType("Sample.ParameterValueOwner")!.GetMethod("M")!.Invoke(null, arguments)!;
                while (value is Delegate closure) { value = closure.DynamicInvoke()!; }
                return (prepared, node, method, (string)value);
            }
            catch { prepared.Dispose(); throw; }
        }

        private sealed class ParameterValueOwner(ValueExpression body, IReadOnlyList<ParameterProvider> parameters, CSharpType? returnType = null, string name = "ParameterValueOwner", bool emptyDocs = false) : TypeProvider
        {
            protected override string BuildName() => name;
            protected override string BuildNamespace() => "Sample";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected override string BuildRelativeFilePath() => name + ".cs";
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected internal override MethodProvider[] BuildMethods() => new[]
            {
                new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                    returnType ?? typeof(string), null, parameters), body, this, xmlDocProvider: emptyDocs ? new XmlDocProvider() : null)
            };
        }
    }
}
