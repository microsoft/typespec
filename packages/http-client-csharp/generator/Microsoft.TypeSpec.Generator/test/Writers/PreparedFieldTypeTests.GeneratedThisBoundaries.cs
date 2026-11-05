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
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        // Additive scope cases alongside GeneratedThisProofs and
        // GeneratedInstanceProofs unchanged. This is a closed, empty-map service
        // profile, not real SCM adoption or raw namespace-shortening evidence.
        [Test]
        public void GeneratedThisBoundaryImplicitSoleStaticHelperHasNoInventedInstance()
        {
            using var service = new GeneratedThisBoundaryServiceScope();
            var call = new InvokeMethodExpression(null, "Safe", new ValueExpression[] { Literal(1) });
            var owner = new GeneratedThisBoundaryOwner(call, "static");
            var result = PrepareGeneratedThisBoundary(service.Services, owner, call, "static");
            using var prepared = result.Plan;
            // Native binding/emit/runtime already established a STATIC callee,
            // despite an actual INSTANCE caller and unqualified syntax.
            var selected = result.Selection;
            Assert.That(selected, Is.Not.Null);
            Assert.That(selected!.Contract.IsStatic, Is.True);
            AssertGeneratedThisBoundaryKnown(result.Node, result.Graph, selected, owner);
        }

        [Test]
        public void GeneratedThisBoundaryUnusedScalarOwningParameterRemainsOutsideFirstFamily()
        {
            using var service = new GeneratedThisBoundaryServiceScope();
            var call = new InvokeMethodExpression(null, "Safe", new ValueExpression[] { Literal(1) });
            var owner = new GeneratedThisBoundaryOwner(call, "parameter");
            var result = PrepareGeneratedThisBoundary(service.Services, owner, call, "parameter");
            using var prepared = result.Plan;
            AssertGeneratedThisBoundaryUnknown(result.Node, result.Selection, result.Absence);
        }

        [Test]
        public void GeneratedThisBoundarySameNameDelegateParameterDoesNotCertifyGeneratedHelper()
        {
            using var service = new GeneratedThisBoundaryServiceScope();
            // Deliberately name-only, with the actual emitted lowercase parameter
            // spelling: a differently cased requested name would not shadow Safe.
            var call = new InvokeMethodExpression(null, "safe", new ValueExpression[] { Literal(1) });
            var owner = new GeneratedThisBoundaryOwner(call, "delegate");
            var result = PrepareGeneratedThisBoundary(service.Services, owner, call, "delegate");
            using var prepared = result.Plan;
            AssertGeneratedThisBoundaryUnknown(result.Node, result.Selection, result.Absence);
        }

        [TestCase("caller-modifiers")]
        [TestCase("root-name")]
        [TestCase("retained-arguments")]
        public void GeneratedThisBoundaryActualCallerAndDeepRootMutationsInvalidateStickily(string mutation)
        {
            using var service = new GeneratedThisBoundaryServiceScope();
            var originalArgument = Literal(1);
            var arguments = new List<ValueExpression> { originalArgument };
            // Use this only for the modifier control; null for name/list controls.
            var call = new InvokeMethodExpression(mutation == "caller-modifiers"
                ? new KeywordExpression("this", null) : null, "Safe", arguments);
            var owner = new GeneratedThisProofOwner(call, observing: false, staticCaller: false);
            var result = PrepareGeneratedThisBoundary(service.Services, owner, call, "instance");
            using var prepared = result.Plan;
            var held = result.Selection;
            Assert.That(held, Is.Not.Null);
            AssertGeneratedThisBoundaryKnown(result.Node, result.Graph, held!, owner);
            var caller = owner.Methods.Single(m => m.Signature.Name == "M");
            var originalModifiers = caller.Signature.Modifiers;
            var methodRevision = caller.DeclarationRevision;
            var callRevision = call.DeclarationRevision;
            try
            {
                if (mutation == "caller-modifiers")
                {
                    // Actual caller declaration, not a retained callee hint.
                    caller.Signature.Modifiers = originalModifiers | MethodSignatureModifiers.Static;
                }
                else if (mutation == "root-name") { call.MethodName = "Missing"; }
                else { arguments[0] = Literal(2); }
                Assert.That(caller.DeclarationRevision, Is.EqualTo(methodRevision), "No MethodProvider.Update.");
                if (mutation == "retained-arguments")
                {
                    Assert.That(call.DeclarationRevision, Is.EqualTo(callRevision), "Retained list mutation has no invocation revision bump.");
                }
                Assert.That(held!.IsCurrent, Is.False);
                Assert.That(result.Graph.IsCurrent, Is.False);
            }
            finally
            {
                if (mutation == "caller-modifiers") { caller.Signature.Modifiers = originalModifiers; }
                else if (mutation == "root-name") { call.MethodName = "Safe"; }
                else { arguments[0] = originalArgument; }
            }
            Assert.That(held!.IsCurrent, Is.False, "Restoration cannot revive a held selector.");
            Assert.That(result.Graph.IsCurrent, Is.False, "Restoration cannot revive the held graph.");
        }

        [Test]
        public void GeneratedThisBoundaryStatementBodyWithLocalDoesNotBorrowExpressionRootAuthority()
        {
            using var service = new GeneratedThisBoundaryServiceScope();
            var call = new InvokeMethodExpression(null, "Safe", new ValueExpression[] { Literal(1) });
            var owner = new GeneratedThisBoundaryOwner(call, "statements");
            var result = PrepareGeneratedThisBoundary(service.Services, owner, call, "statements");
            using var prepared = result.Plan;
            AssertGeneratedThisBoundaryUnknown(result.Node, result.Selection, result.Absence);
        }

        [Test]
        public void GeneratedThisBoundaryMultipleNamedNonobserversDoNotAuthorizeImplicitRanking()
        {
            using var service = new GeneratedThisBoundaryServiceScope();
            var call = new InvokeMethodExpression(null, "Safe", new ValueExpression[] { Literal(1) });
            var owner = new GeneratedThisBoundaryOwner(call, "multiple");
            var result = PrepareGeneratedThisBoundary(service.Services, owner, call, "multiple");
            using var prepared = result.Plan;
            // Native C# selects int; two supported nonobservers are nevertheless
            // not a sole complete implicit-member group (nor absence authority).
            AssertGeneratedThisBoundaryUnknown(result.Node, result.Selection, result.Absence);
        }

        private static void AssertGeneratedThisBoundaryUnknown(PreparedSourceOccurrence node,
            PreparedSelectedCall? selection, PreparedDirectObservationAbsence? absence)
        {
            Assert.That(selection, Is.Null);
            Assert.That(absence, Is.Null);
            Assert.That(node.CallProofs?.Selection, Is.Null);
            Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
        }

        private static void AssertGeneratedThisBoundaryKnown(PreparedSourceOccurrence node,
            PreparedSourceObservations graph, PreparedSelectedCall selected, TypeProvider owner)
        {
            Assert.That(node.CallProofs!.Selection, Is.SameAs(selected));
            Assert.That(selected.Occurrence, Is.EqualTo(node.Id));
            Assert.That(selected.Contract.DeclarationSymbol, Is.Null);
            Assert.That(selected.Contract.ProviderOwner, Is.SameAs(owner));
            Assert.That(selected.GeneratedDeclaration, Is.Not.Null);
            Assert.That(selected.GeneratedDeclaration!.Owner, Is.SameAs(owner));
            Assert.That(selected.GeneratedDeclaration.Method, Is.SameAs(owner.Methods.Single(m => m.Signature.Name == "Safe")));
            Assert.That(selected.GeneratedDeclaration.Contract, Is.SameAs(selected.Contract));
            Assert.That(selected.Arguments.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(selected.Arguments.HasImplicitCallerLine, Is.False);
            Assert.That(selected.IsCurrent, Is.True);
            Assert.That(graph.IsCurrent, Is.True);
            var facts = graph.GetCurrent(node)!;
            Assert.That(facts.DirectKnowledge, Is.EqualTo(PreparedSourceObservations.PreparedDirectCaptureKnowledge.Known));
            Assert.That(facts.OwnCaptures, Is.Empty);
            Assert.That(facts.OwnBarriers, Is.Empty);
            Assert.That(node.CallProofs.ObservationAbsence, Is.Not.Null);
        }

        private static (PreparedFieldTypes Plan, PreparedSourceOccurrence Node,
            PreparedSelectedCall? Selection, PreparedDirectObservationAbsence? Absence,
            PreparedSourceObservations Graph) PrepareGeneratedThisBoundary(
            GeneratedInstanceWriterService services, TypeProvider owner, InvokeMethodExpression call, string mode)
        {
            owner.EnsureBuilt();
            FinalizeGeneratedInstanceOwner(owner);
            var actualCallerProvider = owner.Methods.Single(m => m.Signature.Name == "M");
            Assert.That(actualCallerProvider.EnclosingType, Is.SameAs(owner));
            Assert.That(actualCallerProvider.EnclosingType.CachedType, Is.SameAs(owner.Type));
            Assert.That(services.TypeFactory.CSharpTypeMap, Is.Empty);
            var compilation = CallProofCompilation();
            var metadataName = owner.Type.Namespace + "." + owner.Type.Name;
            Assert.That(compilation.GetTypeByMetadataName(metadataName), Is.Null);
            var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            try
            {
                var source = prepared.SourceFiles.Single();
                var node = source.Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
                var selection = node.CallProofs?.Selection;
                var absence = node.CallProofs?.ObservationAbsence;
                var graph = source.Observations!;
                Assert.That(services.WriteCallbacks, Is.Empty, "Zero GetWriter calls during preparation.");
                var writer = services.GetWriter(owner);
                writer.PreparedFieldTypes = prepared;
                var output = writer.Write();
                Assert.That(services.WriteCallbacks, Has.Count.EqualTo(1));
                Assert.That(services.WriteCallbacks[owner], Is.EqualTo(1), "One standard factory write; no opaque body callback.");
                Assert.That(output.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
                var tree = CSharpSyntaxTree.ParseText(output.Content);
                compilation = compilation.WithAssemblyName("GeneratedThisBoundary_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
                // All eight originals are valid C#. Never assert desired prepared
                // facts before diagnostics, actual binding, emit and runtime.
                Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var syntax = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
                var callerSyntax = syntax.Ancestors().OfType<MethodDeclarationSyntax>().Single();
                var ownerSyntax = (ClassDeclarationSyntax)callerSyntax.Parent!;
                var model = compilation.GetSemanticModel(tree);
                var actualOwner = compilation.GetTypeByMetadataName(metadataName)!;
                var caller = model.GetDeclaredSymbol(callerSyntax)!;
                var helperSyntax = ownerSyntax.Members.OfType<MethodDeclarationSyntax>()
                    .Single(m => m.Identifier.ValueText == (mode == "delegate" ? "safe" : "Safe") && m.ParameterList.Parameters.Single().Type!.ToString() == "int");
                var helper = model.GetDeclaredSymbol(helperSyntax)!;
                Assert.That(ownerSyntax.BaseList, Is.Null);
                Assert.That(ownerSyntax.TypeParameterList, Is.Null);
                Assert.That(ownerSyntax.Members.All(m => m is MethodDeclarationSyntax), Is.True);
                Assert.That(ownerSyntax.Members, Has.Count.EqualTo(mode == "multiple" ? 3 : 2));
                Assert.That(actualOwner.DeclaringSyntaxReferences, Has.Length.EqualTo(1));
                Assert.That(caller.Name, Is.EqualTo("M"));
                Assert.That(caller.IsStatic, Is.False);
                Assert.That(caller.Arity, Is.Zero);
                Assert.That(caller.Parameters.Length, Is.EqualTo(mode is "parameter" or "delegate" ? 1 : 0));
                Assert.That(SymbolEqualityComparer.Default.Equals(caller.ContainingType, actualOwner), Is.True);
                Assert.That(helper.IsStatic, Is.EqualTo(mode == "static"));
                Assert.That(helper.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
                Assert.That(helper.Parameters.Single().GetAttributes(), Is.Empty);
                Assert.That(helper.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_String));
                Assert.That(helper.DeclaringSyntaxReferences.Single().SyntaxTree, Is.SameAs(tree));
                Assert.That(helper.DeclaringSyntaxReferences.Single().Span, Is.EqualTo(helperSyntax.Span));
                var operation = (IInvocationOperation)model.GetOperation(syntax)!;
                var actual = operation.TargetMethod;
                Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(syntax).Symbol, actual), Is.True);
                Assert.That(actual.IsStatic, Is.EqualTo(mode == "static"));
                Assert.That(operation.Arguments.Single().Value.ConstantValue.Value, Is.EqualTo(1));
                Assert.That(actual.Parameters.Single().Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));
                if (mode == "delegate")
                {
                    Assert.That(syntax.Expression, Is.InstanceOf<IdentifierNameSyntax>());
                    Assert.That(actual.MethodKind, Is.EqualTo(MethodKind.DelegateInvoke));
                    Assert.That(SymbolEqualityComparer.Default.Equals(actual, helper), Is.False);
                    var parameterReference = (IParameterReferenceOperation)operation.Instance!;
                    Assert.That(SymbolEqualityComparer.Default.Equals(parameterReference.Parameter, caller.Parameters.Single()), Is.True);
                    Assert.That(caller.Parameters.Single().Name, Is.EqualTo("safe"));
                    Assert.That(helper.Name, Is.EqualTo(caller.Parameters.Single().Name), "The actual emitted delegate parameter must shadow the identically named helper.");
                    Assert.That(caller.Parameters.Single().DeclaringSyntaxReferences.Single().Span,
                        Is.EqualTo(callerSyntax.ParameterList.Parameters.Single().Span));
                    Assert.That(SymbolEqualityComparer.Default.Equals(actual.ContainingType, caller.Parameters.Single().Type), Is.True);
                    Assert.That(actual.DeclaringSyntaxReferences, Is.Empty, "Framework Func.Invoke, not a generated helper declaration.");
                }
                else
                {
                    Assert.That(actual.MethodKind, Is.EqualTo(MethodKind.Ordinary));
                    Assert.That(SymbolEqualityComparer.Default.Equals(actual, helper), Is.True);
                    Assert.That(actual.DeclaringSyntaxReferences.Single().Span, Is.EqualTo(helperSyntax.Span));
                    if (mode == "static")
                    {
                        Assert.That(syntax.Expression, Is.InstanceOf<IdentifierNameSyntax>());
                        Assert.That(operation.Instance, Is.Null, "An implicit static call has no containing-instance callee receiver.");
                    }
                    else
                    {
                        var instance = (IInstanceReferenceOperation)operation.Instance!;
                        Assert.That(instance.ReferenceKind, Is.EqualTo(InstanceReferenceKind.ContainingTypeInstance));
                        Assert.That(instance.IsImplicit, Is.EqualTo(call.InstanceReference is null));
                        Assert.That(SymbolEqualityComparer.Default.Equals(instance.Type, actualOwner), Is.True);
                        if (call.InstanceReference is null) { Assert.That(syntax.Expression, Is.InstanceOf<IdentifierNameSyntax>()); }
                        else
                        {
                            var access = (MemberAccessExpressionSyntax)syntax.Expression;
                            Assert.That(access.Expression, Is.InstanceOf<ThisExpressionSyntax>());
                        }
                    }
                }
                if (mode == "parameter")
                {
                    Assert.That(caller.Parameters.Single().Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));
                    Assert.That(callerSyntax.DescendantNodes().OfType<IdentifierNameSyntax>()
                        .Any(n => n.Identifier.ValueText == "unused"), Is.False);
                }
                if (mode == "statements")
                {
                    Assert.That(callerSyntax.ExpressionBody, Is.Null);
                    BlockSyntax body = callerSyntax.Body!;
                    Assert.That(body.Statements.OfType<LocalDeclarationStatementSyntax>().Count(), Is.EqualTo(1));
                }
                if (mode == "multiple")
                {
                    var candidates = actualOwner.GetMembers("Safe").OfType<IMethodSymbol>().ToArray();
                    Assert.That(candidates, Has.Length.EqualTo(2));
                    Assert.That(candidates.All(m => !m.IsStatic && m.Parameters.All(p => p.GetAttributes().IsEmpty)), Is.True);
                    Assert.That(candidates.Select(m => m.Parameters.Single().Type.SpecialType),
                        Is.EquivalentTo(new[] { SpecialType.System_Int32, SpecialType.System_String }));
                }
                using var stream = new MemoryStream();
                var emitted = compilation.Emit(stream);
                Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
                var runtimeOwner = Assembly.Load(stream.ToArray()).GetType(metadataName)!;
                var runtimeInstance = Activator.CreateInstance(runtimeOwner)!;
                object[] runtimeArguments = mode == "delegate" ? new object[] { new Func<int, string>(_ => "delegate") }
                    : mode == "parameter" ? new object[] { 17 } : Array.Empty<object>();
                var runtimeCaller = runtimeOwner.GetMethod("M")!;
                Assert.That(runtimeCaller.IsStatic, Is.False);
                Assert.That(runtimeCaller.Invoke(runtimeInstance, runtimeArguments), Is.EqualTo(mode == "delegate" ? "delegate" : "safe"));
                return (prepared, node, selection, absence, graph);
            }
            catch { prepared.Dispose(); throw; }
        }

        private sealed class GeneratedThisBoundaryServiceScope : IDisposable
        {
            private readonly CodeModelGenerator _previous = CodeModelGenerator.Instance;
            internal GeneratedInstanceWriterService Services { get; }
            internal GeneratedThisBoundaryServiceScope()
            {
                Services = new GeneratedInstanceWriterService(new GeneratorContext(_previous.Configuration))
                { SourceInputModel = _previous.SourceInputModel };
                CodeModelGenerator.Instance = Services;
            }
            public void Dispose() => CodeModelGenerator.Instance = _previous;
        }

        private sealed class GeneratedThisBoundaryOwner(InvokeMethodExpression call, string mode) : TypeProvider
        {
            protected override string BuildName() => "GeneratedThisBoundaryOwner";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "GeneratedThisBoundaryOwner.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected internal override MethodProvider[] BuildMethods()
            {
                var parameters = mode == "parameter" ? new[] { new ParameterProvider("unused", $"unused scalar", typeof(int)) }
                    : mode == "delegate" ? new[] { new ParameterProvider("safe", $"delegate shadows helper", typeof(Func<int, string>)) }
                    : Array.Empty<ParameterProvider>();
                var signature = new MethodSignature("M", null, MethodSignatureModifiers.Public, typeof(string), null, parameters);
                MethodProvider caller;
                if (mode == "statements")
                {
                    var local = new VariableExpression(typeof(int), "unusedLocal");
                    caller = new MethodProvider(signature, new MethodBodyStatements(new MethodBodyStatement[]
                    {
                        new ExpressionStatement(new AssignmentExpression(new DeclarationExpression(local), Literal(0))),
                        new ExpressionStatement(new KeywordExpression("return", call))
                    }), this);
                }
                else { caller = new MethodProvider(signature, call, this); }
                var helper = new MethodProvider(new MethodSignature(mode == "delegate" ? "safe" : "Safe", null,
                    MethodSignatureModifiers.Public | (mode == "static" ? MethodSignatureModifiers.Static : (MethodSignatureModifiers)0),
                    typeof(string), null, new[] { new ParameterProvider("value", $"value", typeof(int)) }), Literal("safe"), this);
                if (mode != "multiple") { return new[] { caller, helper }; }
                var other = new MethodProvider(new MethodSignature("Safe", null, MethodSignatureModifiers.Public,
                    typeof(string), null, new[] { new ParameterProvider("value", $"value", typeof(string)) }), Literal("other"), this);
                return new[] { caller, helper, other };
            }
        }
    }
}
